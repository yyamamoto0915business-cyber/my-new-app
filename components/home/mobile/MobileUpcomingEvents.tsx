"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, CalendarDays, CalendarPlus, MapPin } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";
import { getJstTodayYmd } from "@/lib/jst-date";
import { getBookmarks, toggleBookmark } from "@/lib/bookmark-storage";
import { EventThumbnail } from "@/components/event-thumbnail";
import { cn } from "@/lib/utils";

const CARD_COUNT = 6;
const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 11/22(土) 形式 */
function formatDate(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  if (!m || !d) return ymd;
  const wd = new Date(`${ymd}T12:00:00+09:00`).getUTCDay();
  return `${m}/${d}(${WEEKDAY_JA[wd]})`;
}

type Props = {
  events: Event[];
  loading: boolean;
};

function UpcomingCard({
  event,
  saved,
  onToggleSave,
}: {
  event: Event;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const place = event.location || event.prefecture || "場所未定";
  return (
    <div className="relative flex w-[76%] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-[16px] border border-[#ebeee8] bg-white shadow-[0_3px_10px_rgba(22,56,40,0.06)]">
      <Link
        href={`/events/${event.id}`}
        className="flex min-w-0 flex-1 items-stretch gap-2 p-1.5 pr-1"
        aria-label={`${event.title}の詳細を見る`}
      >
        <div className="relative min-h-[88px] w-[38%] shrink-0 overflow-hidden rounded-[12px] bg-[#e8ede4]">
          <EventThumbnail imageUrl={event.imageUrl} alt="" rounded="none" fill />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1 pr-7">
          <p className="line-clamp-2 text-[13px] font-bold leading-snug text-[#163828] [overflow-wrap:anywhere]">
            {event.title}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-[#4f5d54]">
            <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
            {formatDate(event.date)}
          </p>
          <p className="flex min-w-0 items-center gap-1 text-[11px] text-[#4f5d54]">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{place}</span>
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onToggleSave}
        aria-pressed={saved}
        aria-label={saved ? "保存を解除" : "保存する"}
        className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full active:bg-[#f4f8f5]"
      >
        <Bookmark
          className={cn("h-[18px] w-[18px]", saved ? "fill-[#1f5e3a] text-[#1f5e3a]" : "text-[#1f5e3a]")}
          aria-hidden
        />
      </button>
    </div>
  );
}

/** まちの情報（スマホ）：近日開催のイベント（今日以降の開催を日付の近い順） */
export function MobileUpcomingEvents({ events, loading }: Props) {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(getBookmarks());
  }, []);

  const upcoming = useMemo(() => {
    const today = getJstTodayYmd();
    return events
      .filter((e) => getEventStatus(e) !== "ended")
      .sort(
        (a, b) =>
          // 期間イベントで始まりが過去のものは「今日」として並べる
          (a.date < today ? today : a.date).localeCompare(b.date < today ? today : b.date) ||
          (a.startTime || "").localeCompare(b.startTime || "")
      )
      .slice(0, CARD_COUNT);
  }, [events]);

  if (!loading && upcoming.length === 0) return null;

  return (
    <section aria-label="近日開催のイベント">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-[16px] font-bold text-[#163828]">
          <CalendarPlus className="h-5 w-5 text-[#1f5e3a]" aria-hidden />
          近日開催のイベント
        </h2>
        <Link
          href="/events"
          className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#1f5e3a]"
        >
          もっとみる
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-[96px] flex-1 animate-pulse rounded-[16px] bg-[#e5ede6]" />
          ))}
        </div>
      ) : (
        <div className="-mx-3 -my-2 flex snap-x scroll-px-3 gap-2 overflow-x-auto px-3 py-2 scrollbar-hide">
          {upcoming.map((event) => (
            <UpcomingCard
              key={event.id}
              event={event}
              saved={savedIds.includes(event.id)}
              onToggleSave={() => {
                toggleBookmark(event.id);
                setSavedIds(getBookmarks());
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
