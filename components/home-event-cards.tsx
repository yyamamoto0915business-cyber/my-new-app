"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Event } from "@/lib/db/types";
import { getEventsByDateRange } from "@/lib/events";
import { tagLabels } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";
import { EventThumbnail } from "@/components/event-thumbnail";

function EventCard({ event, index }: { event: Event; index: number }) {
  const { t, locale } = useLanguage();
  const dateStr = event.date.replace(/-/g, "/");
  const timeStr = event.endTime
    ? `${event.startTime} - ${event.endTime}`
    : event.startTime;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-lg dark:border-zinc-700/60 dark:bg-zinc-900">
      <Link href={`/events/${event.id}`} className="block">
        <div className="relative">
          <EventThumbnail
            imageUrl={event.imageUrl}
            alt={event.title}
            rounded="none"
            className="rounded-t-2xl"
          />
          <span className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded bg-red-500 text-xs font-bold text-white">
            {index + 1}
          </span>
        </div>
        <div className="p-4">
          <h2 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
            {event.title}
          </h2>
          {event.tags && event.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {event.tags.map((tagId) => (
                <span
                  key={tagId}
                  className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {tagLabels[locale][tagId] ?? tagId}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {dateStr} | {timeStr}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-zinc-500 underline-offset-2 hover:underline">
              {t.more}
            </span>
            <span className="inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
              {t.viewDetails}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function HomeEventCards() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const tagsParam = searchParams.get("tags") ?? "";
  const tagsStr = useMemo(
    () => (tagsParam ? tagsParam.split(",").filter(Boolean).join(",") : ""),
    [tagsParam]
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    if (tagsStr) params.set("tags", tagsStr);
    const qs = params.toString();
    fetchWithTimeout(`/api/events${qs ? `?${qs}` : ""}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: Event[]) => {
        const thisWeek = getEventsByDateRange(data, "week");
        const toShow = thisWeek.length > 0 ? thisWeek : data;
        setEvents(Array.isArray(data) ? toShow : []);
      })
      .catch(() => {
        setEvents([]);
        setError("読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
  }, [prefecture, city, tagsStr]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-[16/10] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white/80 p-6 text-center dark:bg-zinc-900/80">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-2 text-sm text-[var(--accent)] underline"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="rounded-2xl bg-white/80 p-8 text-center text-zinc-500 dark:bg-zinc-900/80">
        {t.noUpcomingEvents}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((event, i) => (
        <li key={event.id}>
          <EventCard event={event} index={i} />
        </li>
      ))}
    </ul>
  );
}
