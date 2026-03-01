"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EventThumbnail } from "@/components/event-thumbnail";
import { ProfileEmptyCard } from "@/components/profile/profile-empty-card";
import {
  getUpcomingParticipations,
  getSavedEvents,
  getReviewPending,
  getParticipationHistory,
} from "@/lib/profile-dashboard-data";
import type { Event } from "@/lib/db/types";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  userId: string | null;
};

function formatDateTime(date: string, startTime: string, endTime?: string) {
  const d = new Date(date + "T12:00:00");
  const day = WEEKDAY[d.getDay()];
  const dateStr = date.replace(/-/g, "/").replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  const timeStr = endTime ? `${startTime}-${endTime}` : startTime;
  return `${day} ${dateStr} ${timeStr}`;
}

export function ParticipantTab({ userId }: Props) {
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [saved, setSaved] = useState<Event[]>([]);
  const [reviewPending, setReviewPending] = useState<Event[]>([]);
  const [history, setHistory] = useState<Event[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setUpcoming(getUpcomingParticipations(userId));
    setSaved(getSavedEvents(userId));
    setReviewPending(getReviewPending(userId));
    setHistory(getParticipationHistory(userId));
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* 1) 参加予定（直近1件を大きく） */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">参加予定</h2>
        {!userId ? (
          <ProfileEmptyCard
            title="ログインが必要です"
            description="参加予定のイベントを表示するにはログインしてください"
            ctaLabel="ログイン"
            ctaHref="/login?returnTo=/profile"
          />
        ) : upcoming.length === 0 ? (
          <ProfileEmptyCard
            title="参加予定がありません"
            description="イベントを探して参加してみましょう"
            ctaLabel="イベントを探す"
            ctaHref="/events"
          />
        ) : (
          <Link
            href={`/events/${upcoming[0].id}`}
            className="block overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/90"
          >
            <div className="relative aspect-[16/9]">
              <EventThumbnail
                imageUrl={upcoming[0].imageUrl}
                alt={upcoming[0].title}
                rounded="none"
                className="rounded-t-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h3 className="font-serif text-lg font-semibold">{upcoming[0].title}</h3>
                <p className="mt-1 flex items-center gap-2 text-xs opacity-90">
                  <span>📅</span>
                  {formatDateTime(upcoming[0].date, upcoming[0].startTime, upcoming[0].endTime)}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs opacity-90">
                  <span>📍</span>
                  {upcoming[0].location}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-[var(--foreground-muted)]">詳細を見る</span>
              <span className="text-sm font-medium text-[var(--accent)]">→</span>
            </div>
          </Link>
        )}
      </section>

      {/* 2) 保存したイベント（横スクロール） */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">保存したイベント</h2>
        {saved.length === 0 ? (
          <ProfileEmptyCard
            title="保存したイベントがありません"
            description="気になるイベントを保存しておきましょう"
            ctaLabel="イベントを探す"
            ctaHref="/events"
          />
        ) : (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {saved.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="block w-[200px] shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/90"
              >
                <div className="relative aspect-[16/10]">
                  <EventThumbnail imageUrl={e.imageUrl} alt={e.title} rounded="none" className="rounded-t-xl" />
                </div>
                <p className="line-clamp-2 p-2 text-sm font-medium">{e.title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 3) レビュー待ち */}
      {reviewPending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">レビュー待ち</h2>
          <div className="space-y-2">
            {reviewPending.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}#review`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900/90"
              >
                <span className="font-medium">{e.title}</span>
                <span className="text-sm font-medium text-[var(--accent)]">レビューを書く</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4) 参加履歴（折りたたみ） */}
      <section>
        <button
          type="button"
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex w-full items-center justify-between py-2 text-left text-sm font-medium text-[var(--foreground-muted)]"
        >
          <span>参加履歴</span>
          <span className="transition-transform">{historyOpen ? "▲" : "▼"}</span>
        </button>
        {historyOpen && (
          <div className="space-y-2 pt-2">
            {history.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--foreground-muted)]">まだ参加履歴がありません</p>
            ) : (
              history.map((e) => (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/50"
                >
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {formatDateTime(e.date, e.startTime, e.endTime)}
                    </p>
                  </div>
                  <span className="text-[var(--accent)]">詳細</span>
                </Link>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
