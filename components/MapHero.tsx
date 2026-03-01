"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Event } from "@/lib/db/types";
import { getRecommendedEvents } from "@/lib/events";
import { EventThumbnail } from "./event-thumbnail";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  events: Event[];
};

/**
 * ホームのヒーローセクション
 * 白い高級紙＋おすすめ3件のイベントカード
 */
export function MapHero({ events }: Props) {
  const recommended = useMemo(() => getRecommendedEvents(events, 3), [events]);

  return (
    <section
      className="relative mx-4 mb-6 overflow-hidden rounded-2xl"
      aria-label="おすすめイベント"
    >
      {/* ヒーローエリア（白い高級紙） */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-[var(--mg-line)] px-4 py-5 sm:px-5 sm:py-6"
        style={{ backgroundColor: "var(--mg-paper)" }}
      >
        {/* 紙質グレイン */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply dark:mix-blend-overlay dark:opacity-[0.03]"
          style={{
            backgroundImage: `repeating-conic-gradient(var(--mg-ink) 0% 0.25%, transparent 0% 0.5%)`,
            backgroundSize: "2px 2px",
          }}
          aria-hidden
        />

        <h2 className="relative mb-4 font-serif text-base font-semibold text-zinc-800 dark:text-zinc-200 sm:text-lg">
          おすすめ
        </h2>

        {recommended.length > 0 ? (
          <div className="relative flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1">
            {recommended.map((event) => (
              <HeroEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="relative py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            近日のイベントを準備中です
          </p>
        )}
      </div>
    </section>
  );
}

function HeroEventCard({ event }: { event: Event }) {
  const d = new Date(event.date + "T12:00:00");
  const dayLabel = WEEKDAY[d.getDay()];
  const dateStr = event.date.replace(/-/g, "/").replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  const timeStr = event.endTime ? `${event.startTime}〜${event.endTime}` : event.startTime;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex min-w-[160px] max-w-[200px] shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--mg-line)] bg-white transition-shadow hover:shadow-md dark:bg-zinc-900/80 dark:border-zinc-700 mg-card-glow"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          className="rounded-t-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-1.5 left-2 right-2">
          <h3 className="line-clamp-2 font-serif text-sm font-semibold text-white drop-shadow-sm">
            {event.title}
          </h3>
        </div>
        {event.price === 0 && (
          <span className="absolute right-1.5 top-1.5 rounded bg-white/95 px-1.5 py-0.5 text-xs font-medium text-[var(--accent)]">
            無料
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {dayLabel} {dateStr} {timeStr}
        </p>
        <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">{event.location}</p>
      </div>
    </Link>
  );
}
