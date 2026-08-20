"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { getThisWeekendEvents } from "@/lib/events";
import { EventThumbnail } from "@/components/event-thumbnail";
import { cn } from "@/lib/utils";

type Props = {
  events: Event[];
  loading: boolean;
};

const CARD_COUNT = 4;

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

function getJstDayOfWeek(ymd: string): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  }).format(new Date(`${ymd}T12:00:00+09:00`));
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

/** 8/2(土) 形式。土＝青、日＝赤、それ以外＝通常 */
function formatWeekendDateParts(date: string): {
  label: string;
  tone: "sat" | "sun" | "default";
} {
  const day = getJstDayOfWeek(date);
  const [, m, d] = date.split("-").map(Number);
  if (!m || !d) {
    return { label: date, tone: "default" };
  }
  const label = `${m}/${d}(${WEEKDAY_JA[day]})`;
  if (day === 6) return { label, tone: "sat" };
  if (day === 0) return { label, tone: "sun" };
  return { label, tone: "default" };
}

function formatTimeRange(startTime?: string | null, endTime?: string | null): string {
  if (!startTime) return "時間未定";
  const start = startTime.slice(0, 5);
  if (!endTime) return `${start}〜`;
  return `${start}〜${endTime.slice(0, 5)}`;
}

function WeekendEventCard({ event }: { event: Event }) {
  const { label, tone } = formatWeekendDateParts(event.date);
  const place = event.location || event.prefecture || "場所未定";

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex min-h-[108px] overflow-hidden rounded-[12px] border border-[#e8ebe6] bg-[#fbfcfb] transition hover:border-[#c8dcd0] hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)]"
      aria-label={`${event.title}の詳細を見る`}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5 pr-2">
        <p
          className={cn(
            "text-[12px] font-semibold leading-none",
            tone === "sat" && "text-[#2b6cb0]",
            tone === "sun" && "text-[#d64545]",
            tone === "default" && "text-[#1A2214]",
          )}
        >
          {label}
        </p>
        <p className="text-[11px] leading-snug text-[#1A2214]">
          {formatTimeRange(event.startTime, event.endTime)}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-[#0e1610]">
          {event.title}
        </p>
        <p className="mt-auto flex items-center gap-1 pt-1 text-[11px] text-[#5a6a60]">
          <span className="shrink-0 text-[#2f6b4f]" aria-hidden>
            ◎
          </span>
          <span className="line-clamp-1">{place}</span>
        </p>
      </div>

      <div className="relative w-[42%] shrink-0 self-stretch overflow-hidden bg-[#e8ede4]">
        <EventThumbnail imageUrl={event.imageUrl} alt="" rounded="none" fill />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#fbfcfb] to-transparent"
          aria-hidden
        />
      </div>
    </Link>
  );
}

export function PcWeekendEventsRow({ events, loading }: Props) {
  const weekendEvents = useMemo(
    () => getThisWeekendEvents(events, CARD_COUNT),
    [events]
  );

  if (!loading && weekendEvents.length === 0) return null;

  return (
    <section
      aria-label="今週末のイベント"
      className="space-y-2.5 rounded-[16px] bg-white px-3 py-3 ring-1 ring-[#e3e8e4]/80"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Bell className="h-4 w-4 text-[#2f6b4f]" aria-hidden />
          <h2 className="text-[14px] font-semibold text-[#0e1610]">
            今週末のイベント
          </h2>
        </div>
        <Link
          href="/events"
          className="shrink-0 text-[12px] font-medium text-[#6a7a70] hover:text-[#2c7a88] hover:underline"
        >
          すべて見る →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: CARD_COUNT }).map((_, i) => (
            <div
              key={i}
              className="h-[108px] animate-pulse rounded-[12px] bg-[#eef3ef]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5">
          {weekendEvents.map((event) => (
            <WeekendEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
