"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type EventContext = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  address?: string;
  itemsToBring?: string[];
  organizerMemo?: string | null;
};

type Props = {
  eventId: string;
  organizerMemo?: string | null;
};

/**
 * チャット画面の文脈パネル：関連イベント/募集の概要
 * 日時・場所・集合・持ち物・主催者メモ（ピン留め）を表示
 */
export function ChatContextPanel({ eventId, organizerMemo }: Props) {
  const [event, setEvent] = useState<EventContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWithTimeout(`/api/events/${eventId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setEvent({
            id: data.id,
            title: data.title ?? "",
            date: data.date ?? "",
            startTime: data.startTime ?? "",
            endTime: data.endTime,
            location: data.location ?? "",
            address: data.address,
            itemsToBring: data.itemsToBring ?? [],
            organizerMemo: organizerMemo ?? data.organizerMemo ?? null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId, organizerMemo]);

  if (loading) {
    return (
      <section className="rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/30">
        <p className="text-sm text-zinc-500">イベント情報を読み込み中...</p>
      </section>
    );
  }

  if (!event) return null;

  const dateTime =
    event.endTime
      ? `${event.date} ${event.startTime} 〜 ${event.endTime}`
      : `${event.date} ${event.startTime}`;

  return (
    <section
      className="rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/30"
      aria-label="イベント概要"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        イベント概要
      </h2>
      <Link
        href={`/events/${eventId}`}
        className="mt-1 block text-sm font-medium text-[var(--accent)] hover:underline"
      >
        {event.title}
      </Link>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">日時</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">{dateTime}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">場所・集合</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {event.location}
            {event.address && (
              <span className="block text-xs font-normal text-zinc-600 dark:text-zinc-400">
                {event.address}
              </span>
            )}
          </dd>
        </div>
        {event.itemsToBring && event.itemsToBring.length > 0 && (
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">持ち物</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">
              {event.itemsToBring.join("、")}
            </dd>
          </div>
        )}
        {(event.organizerMemo || organizerMemo) && (
          <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-900/20">
            <dt className="text-amber-800 dark:text-amber-300">📌 主催者メモ</dt>
            <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              {event.organizerMemo || organizerMemo}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
