"use client";

import Link from "next/link";
import type { ArticleBlock } from "@/lib/read-article-types";
import { getEventById } from "@/lib/events";
import { EventCard } from "@/app/events/event-card";

type Props = {
  block: Extract<ArticleBlock, { type: "eventEmbed" }>;
};

/** 記事本文内のイベント埋め込み（最大6件） */
export function EventEmbedBlock({ block }: Props) {
  const ids = (block.eventIds ?? []).slice(0, 6);
  const events = ids
    .map((id) => getEventById(id))
    .filter((e): e is NonNullable<typeof e> => e != null);

  if (events.length === 0) return null;

  return (
    <aside
      className="my-10 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]"
      aria-label="関連イベント"
    >
      <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
        関連イベント
      </h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/events"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          イベント一覧を見る →
        </Link>
      </div>
    </aside>
  );
}
