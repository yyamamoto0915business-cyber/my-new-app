"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Story } from "@/lib/story-types";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerStoriesHeroBanner } from "@/components/organizer/OrganizerStoriesHeroBanner";
import { OrganizerHeroBleed, OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";

const MOCK_ORGANIZER_ID = "org-1";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function OrganizerStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stories?authorId=${encodeURIComponent(MOCK_ORGANIZER_ID)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStories(Array.isArray(data) ? data : []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: stories.length,
    published: stories.filter((s) => s.status === "published").length,
    draft: stories.filter((s) => s.status === "draft").length,
  }), [stories]);

  const displayedStories = stories.slice(0, 2);
  const hasMore = stories.length > 2;

  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell variant="hero" contentClassName="space-y-2.5 pb-16 min-[900px]:space-y-3 min-[900px]:pb-0">
        <OrganizerHeroBleed>
          <OrganizerStoriesHeroBanner />
        </OrganizerHeroBleed>

        {/* モバイル：作成CTA */}
        <div className="min-[900px]:hidden">
          <Link
            href="/organizer/stories/new"
            className="flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-[#2B3A6B] py-3 text-[13px] font-medium text-white shadow-[0_2px_12px_rgba(43,58,107,0.18)] transition-opacity active:opacity-90"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            ストーリーを書く
          </Link>
        </div>

        {/* PC：作成CTA */}
        <div className="hidden min-[900px]:flex items-center justify-end">
          <Link
            href="/organizer/stories/new"
            className="flex min-h-[40px] items-center gap-2 rounded-lg bg-[#2B3A6B] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            ストーリーを書く
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-3 gap-1.5 min-[900px]:gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[58px] rounded-lg bg-[#e8e6e0] min-[900px]:h-[68px]"/>
              ))}
            </div>
            <div className="h-[108px] rounded-lg bg-[#e8e6e0]"/>
            <div className="h-[108px] rounded-lg bg-[#e8e6e0]"/>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 統計 */}
            <section aria-label="ストーリーの概要" className="grid w-full grid-cols-3 gap-1.5 min-[900px]:gap-2.5">
              <StatCard value={stats.total} label="全ストーリー" valueColor="#2B3A6B" bg="#EEF4FB" border="#C5DBE8" />
              <StatCard value={stats.published} label="公開中" valueColor="#4A9A2E" bg="#EAF6DE" border="#B8DEB0" />
              <StatCard value={stats.draft} label="下書き" valueColor="#9a7b20" bg="#FFF8E8" border="#E8D9A8" muted={stats.draft === 0} />
            </section>

              {/* 空状態 or カード一覧 */}
              {stories.length === 0 ? (
                <section className="rounded-xl border-[0.5px] border-[#e8e6e0] bg-white px-5 py-[52px] text-center">
                  <div className="mx-auto mb-3.5 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#F3F2EF]">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <h2 className="text-[16px] font-[500] text-[#1a1a1a]">
                    まだストーリーがありません
                  </h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#888]">
                    イベントの想いや活動の記録をストーリーとして伝えましょう
                  </p>
                  <Link
                    href="/organizer/stories/new"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-[10px] bg-[#2B3A6B] px-5 py-2.5 text-[13px] font-[500] text-white hover:opacity-90"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    ストーリーを書く
                  </Link>
                </section>
              ) : (
                <section>
                  <ul className="flex flex-col gap-2">
                    {displayedStories.map((s) => (
                      <StoryCard key={s.id} story={s} />
                    ))}
                  </ul>
                  {hasMore && (
                    <div className="mt-3">
                      <Link
                        href="/stories"
                        className="inline-flex items-center gap-1 text-[13px] font-[500] text-[#2B3A6B] hover:opacity-70"
                      >
                        ストーリー一覧を見る →
                      </Link>
                    </div>
                  )}
                </section>
              )}
          </div>
        )}
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}

function StatCard({
  value,
  label,
  valueColor,
  bg,
  border,
  muted,
}: {
  value: number;
  label: string;
  valueColor: string;
  bg: string;
  border: string;
  muted?: boolean;
}) {
  return (
    <div
      className="flex min-h-[58px] flex-col items-center justify-center rounded-lg border-[0.5px] px-1.5 py-2 text-center min-[900px]:min-h-[68px] min-[900px]:px-3 min-[900px]:py-2.5"
      style={{ background: bg, borderColor: border }}
    >
      <p
        className="text-[18px] font-bold tabular-nums leading-none min-[900px]:text-[22px] min-[900px]:font-semibold"
        style={{ color: muted ? "#ccc" : valueColor }}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-medium min-[900px]:mt-1 min-[900px]:text-[11px] min-[900px]:font-normal" style={{ color: muted ? "#aaa" : valueColor }}>
        {label}
      </p>
    </div>
  );
}

function StoryCard({ story }: { story: Story }) {
  const [imgError, setImgError] = useState(false);
  const statusLabel = story.status === "published" ? "公開中" : "下書き";
  const statusClass =
    story.status === "published"
      ? "bg-[#EAF6DE] text-[#3a7a10]"
      : "bg-[#F3F2EF] text-[#888]";

  return (
    <li className="overflow-hidden rounded-lg border-[0.5px] border-[#e8e6e0] bg-white transition-colors hover:bg-[#fafaf8]">
      <div className="flex gap-2.5 px-3 py-2.5 min-[900px]:items-center min-[900px]:gap-3.5 min-[900px]:px-4 min-[900px]:py-3">
        <div className="relative h-11 w-[72px] shrink-0 overflow-hidden rounded-md bg-[#EEF4FB] min-[900px]:h-14 min-[900px]:w-[88px] min-[900px]:rounded-lg">
          {story.coverImageUrl && !imgError ? (
            <Image
              src={story.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 899px) 72px, 88px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b0c4d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-[500] leading-snug text-[#1a1a1a] min-[900px]:truncate min-[900px]:text-[14px]">
            {story.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-[10px] text-[#888] min-[900px]:text-[11px]">{formatDate(story.updatedAt)}</span>
            <span className={`rounded-md px-1.5 py-px text-[9px] min-[900px]:rounded-[10px] min-[900px]:px-2 min-[900px]:py-0.5 min-[900px]:text-[10px] ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
          {story.lead && (
            <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-[#888] min-[900px]:line-clamp-2 min-[900px]:text-[11px]">
              {story.lead}
            </p>
          )}
        </div>

        {/* PC：インラインアクション */}
        <div className="hidden shrink-0 items-center gap-1.5 min-[900px]:flex">
          {story.status === "published" && story.slug && (
            <Link
              href={`/stories/${story.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border-[0.5px] border-[#e8e6e0] bg-white px-3 py-[6px] text-[12px] text-[#1a1a1a] hover:bg-[#f5f4f0]"
            >
              表示
            </Link>
          )}
          <Link
            href={`/organizer/stories/new?edit=${story.id}`}
            className="rounded-lg bg-[#2B3A6B] px-3 py-[6px] text-[12px] font-medium text-white hover:opacity-90"
          >
            編集
          </Link>
        </div>
      </div>

      {/* モバイル：下部アクション */}
      <div className="grid grid-cols-2 gap-px border-t border-[#e8e6e0] bg-[#e8e6e0] min-[900px]:hidden">
        {story.status === "published" && story.slug ? (
          <Link
            href={`/stories/${story.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-white py-2 text-[11px] font-medium text-[#1a1a1a] transition-colors active:bg-[#f5f4f0]"
          >
            表示
          </Link>
        ) : (
          <span className="flex items-center justify-center bg-[#fafaf8] py-2 text-[11px] text-[#ccc]">
            表示
          </span>
        )}
        <Link
          href={`/organizer/stories/new?edit=${story.id}`}
          className="flex items-center justify-center bg-[#2B3A6B] py-2 text-[11px] font-medium text-white transition-opacity active:opacity-90"
        >
          編集
        </Link>
      </div>
    </li>
  );
}
