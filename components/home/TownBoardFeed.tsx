"use client";

import Link from "next/link";
import type { Event } from "@/lib/db/types";
import type { Story } from "@/lib/story-types";
import { BoardPostCard, type BoardPostCategory } from "@/components/ui/BoardPostCard";

type Recruitment = {
  id: string;
  title: string;
  description: string;
  meeting_place: string | null;
};

type BoardPost = {
  type: "event" | "recruitment" | "story" | "notice";
  category: BoardPostCategory;
  title: string;
  sub: string;
  href: string;
  sortKey: string; // for sorting by date
};

const DUMMY_NOTICES: BoardPost[] = [
  {
    type: "notice",
    category: "お知らせ",
    title: "雨天時は開催ページを確認してください",
    sub: "各イベントの雨天時の対応をご確認ください",
    href: "/events",
    sortKey: "9999-99-99",
  },
  {
    type: "notice",
    category: "お知らせ",
    title: "直前参加OKのイベント増えてます",
    sub: "当日参加歓迎のイベントをチェック",
    href: "/events",
    sortKey: "9999-99-98",
  },
];

type Props = {
  events: Event[];
  recruitments: Recruitment[];
  stories: Story[];
};

function formatEventSub(e: Event): string {
  const dateStr = e.date.replace(/-/g, "/").replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  return `${dateStr} ${e.startTime} ・ ${e.location}`;
}

function formatStorySub(s: Story): string {
  return new Date(s.updatedAt).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
  });
}

export function TownBoardFeed({ events, recruitments, stories }: Props) {
  const posts: BoardPost[] = [];

  events.slice(0, 4).forEach((e) => {
    posts.push({
      type: "event",
      category: "イベント",
      title: e.title,
      sub: formatEventSub(e),
      href: `/events/${e.id}`,
      sortKey: e.date + (e.startTime || ""),
    });
  });

  recruitments.slice(0, 2).forEach((r) => {
    posts.push({
      type: "recruitment",
      category: "募集",
      title: r.title,
      sub: r.meeting_place ?? r.description.slice(0, 40) + (r.description.length > 40 ? "…" : ""),
      href: `/recruitments/${r.id}`,
      sortKey: "9999-99-00",
    });
  });

  stories.slice(0, 2).forEach((s) => {
    posts.push({
      type: "story",
      category: "ストーリー",
      title: s.title,
      sub: formatStorySub(s),
      href: `/stories/${s.slug}`,
      sortKey: s.updatedAt,
    });
  });

  posts.push(...DUMMY_NOTICES);

  posts.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  const displayPosts = posts.slice(0, 8);

  return (
    <section className="mb-10" aria-label="まちの掲示板">
      <h2 className="mb-1 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        まちの掲示板
      </h2>
      <p className="mb-4 text-sm text-[var(--foreground-muted)]">
        イベント・募集・ストーリー・お知らせ
      </p>

      <div className="space-y-3">
        {displayPosts.map((p, i) => (
          <BoardPostCard
            key={`${p.type}-${i}-${p.title}`}
            category={p.category}
            title={p.title}
            sub={p.sub}
            href={p.href}
          />
        ))}
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/events"
          className="inline-block rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          もっと見る
        </Link>
      </div>
    </section>
  );
}
