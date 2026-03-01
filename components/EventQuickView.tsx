"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Event } from "@/lib/db/types";
import { getTagLabel } from "@/lib/db/types";
import { EventThumbnail } from "./event-thumbnail";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

function formatEventDateTime(date: string, startTime: string, endTime?: string): string {
  const d = new Date(date + "T12:00:00");
  const day = WEEKDAY[d.getDay()];
  const dateStr = date.replace(/-/g, "/").replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  const timeStr = endTime ? `${startTime}〜${endTime}` : startTime;
  return `${day} ${dateStr} ${timeStr}`;
}

type Props = {
  event: Event;
  onClose: () => void;
};

/**
 * ピンクリック時のクイックビューパネル
 * デスクトップ: 右側、モバイル: 下からスライド
 */
export function EventQuickView({ event, onClose }: Props) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed z-50 flex flex-col rounded-t-2xl border-t border-[var(--mg-line)] bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900 inset-x-0 bottom-0 max-h-[60vh] md:inset-auto md:bottom-auto md:left-auto md:right-4 md:top-1/2 md:max-h-[400px] md:w-80 md:max-w-[calc(100vw-2rem)] md:-translate-y-1/2 md:rounded-2xl md:border"
      role="dialog"
      aria-label={`${event.title}の詳細`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 md:right-2 md:top-2"
        aria-label="閉じる"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="overflow-y-auto p-4 pt-6 md:p-4">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          className="aspect-[16/10] w-full rounded-lg"
        />
        <h3 className="mt-3 font-serif text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {event.title}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {formatEventDateTime(event.date, event.startTime, event.endTime)}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{event.location}</p>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {event.description}
        </p>
        {event.tags && event.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tagId) => (
              <span
                key={tagId}
                className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
              >
                {getTagLabel(tagId)}
              </span>
            ))}
          </div>
        )}
        <Link
          href={`/events/${event.id}`}
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          詳細を見る
        </Link>
      </div>
    </div>
  );
}
