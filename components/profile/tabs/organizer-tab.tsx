"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EventThumbnail } from "@/components/event-thumbnail";
import { ProfileEmptyCard } from "@/components/profile/profile-empty-card";
import { getOrganizerNextEvent, getOrganizerRecruitments } from "@/lib/profile-dashboard-data";
import type { Event } from "@/lib/db/types";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  userId: string | null;
};

function formatDate(date: string, startTime: string) {
  const d = new Date(date + "T12:00:00");
  const day = WEEKDAY[d.getDay()];
  const dateStr = date.replace(/-/g, "/").replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  return `${day} ${dateStr} ${startTime}〜`;
}

export function OrganizerTab({ userId }: Props) {
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [recruitments, setRecruitments] = useState<{ id: string; title: string; applicantCount: number; unreadCount: number }[]>([]);

  useEffect(() => {
    if (!userId) return;
    setNextEvent(getOrganizerNextEvent(userId));
    setRecruitments(getOrganizerRecruitments(userId));
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* 1) 次回イベント */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">次回イベント</h2>
        {!userId ? (
          <ProfileEmptyCard
            title="ログインが必要です"
            description="主催者としてイベントを管理するにはログインしてください"
            ctaLabel="ログイン"
            ctaHref="/login?returnTo=/profile"
          />
        ) : !nextEvent ? (
          <ProfileEmptyCard
            title="イベントがありません"
            description="新しいイベントを作成しましょう"
            ctaLabel="イベントを作成"
            ctaHref="/organizer/events/new"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
            <div className="relative aspect-[16/9]">
              <EventThumbnail
                imageUrl={nextEvent.imageUrl}
                alt={nextEvent.title}
                rounded="none"
                className="rounded-t-xl"
              />
            </div>
            <div className="p-4">
              <h3 className="font-serif font-semibold">{nextEvent.title}</h3>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                {formatDate(nextEvent.date, nextEvent.startTime)} @ {nextEvent.location}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/events/${nextEvent.id}`}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  詳細
                </Link>
                <Link
                  href={`/events/${nextEvent.id}`}
                  className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  応募者管理
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2) 募集中のボランティア募集 */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">募集中のボランティア</h2>
        {recruitments.length === 0 ? (
          <ProfileEmptyCard
            title="募集中のボランティア募集がありません"
            description="ボランティアを募集してみましょう"
            ctaLabel="募集を作成"
            ctaHref="/organizer/recruitments/new"
          />
        ) : (
          <div className="space-y-2">
            {recruitments.map((r) => (
              <Link
                key={r.id}
                href={`/organizer/recruitments/${r.id}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900/90"
              >
                <span className="font-medium">{r.title}</span>
                <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                  <span>👥 {r.applicantCount}件</span>
                  {r.unreadCount > 0 && (
                    <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-white">
                      {r.unreadCount}件未読
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 3) 下書き */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">下書き</h2>
        <ProfileEmptyCard
          title="下書きがありません"
          description="イベントや募集の作成を途中で保存するとここに表示されます"
          ctaLabel="続きから作成"
          ctaHref="/organizer/events/new"
        />
      </section>

      {/* 4) メッセージ */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">メッセージ</h2>
        <ProfileEmptyCard
          title="メッセージがありません"
          description="参加者などとの1対1のやり取りはここに表示されます"
          ctaLabel="メッセージを開く"
          ctaHref="/messages"
        />
      </section>
    </div>
  );
}
