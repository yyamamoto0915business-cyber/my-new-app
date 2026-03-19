"use client";

import { useCallback, useEffect, useState } from "react";
import { toggleBookmark, isBookmarked } from "@/lib/bookmark-storage";
import { openMaps } from "@/lib/maps-url";

type Props =
  | {
      requiresRegistration: true;
      targetId: string;
    }
  | {
      requiresRegistration: false;
      eventId: string;
      address: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      title: string;
      date: string;
      startTime: string;
      endTime?: string;
    };

function buildCalendarUrl(
  title: string,
  date: string,
  startTime: string,
  endTime?: string,
  locationStr?: string
): string {
  const pad = (s: string | undefined) => (s ?? "").replace(/-/g, "").replace(/:/g, "");
  const start = `${pad(date)}T${pad(startTime || "00:00")}00`;
  const end = endTime ? `${pad(date)}T${pad(endTime)}00` : start;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    ctz: "Asia/Tokyo",
  });
  if (locationStr) params.set("location", locationStr);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function EventDetailClient(props: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (props.requiresRegistration === false) {
      setSaved(isBookmarked(props.eventId));
    }
  }, [props]);

  const handleSave = useCallback(() => {
    if (props.requiresRegistration === false) {
      const nowSaved = toggleBookmark(props.eventId);
      setSaved(nowSaved);
    }
  }, [props]);

  const handleOpenMaps = useCallback(() => {
    if (props.requiresRegistration) return;
    openMaps({
      address: props.address,
      venueName: props.location,
      latitude: props.latitude,
      longitude: props.longitude,
    });
  }, [props]);

  if (props.requiresRegistration) {
    const scrollTo = () => {
      const el = document.getElementById(props.targetId);
      el?.scrollIntoView({ behavior: "smooth" });
    };
    return (
      <div className="fixed bottom-20 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 p-4 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95 md:bottom-0">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={scrollTo}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            申し込む
          </button>
        </div>
      </div>
    );
  }

  const calendarLocation =
    props.location && props.address
      ? `${props.location} ${props.address}`
      : props.location || props.address;
  const calendarUrl = buildCalendarUrl(
    props.title,
    props.date,
    props.startTime,
    props.endTime,
    calendarLocation
  );

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 p-4 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95 md:bottom-0">
      <div className="mx-auto max-w-2xl space-y-3">
        <button
          type="button"
          onClick={handleOpenMaps}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 font-medium text-[var(--mg-ink)] transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          地図を開く
        </button>
        <div className="flex gap-2">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            カレンダーに追加
          </a>
          <button
            type="button"
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {saved ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4 text-[var(--accent)]"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                    clipRule="evenodd"
                  />
                </svg>
                保存済み
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
