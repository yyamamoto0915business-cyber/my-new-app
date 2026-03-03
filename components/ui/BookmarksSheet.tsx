"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  bookmarkIds: string[];
  onBookmarkToggle: (eventId: string) => void;
};

export function BookmarksSheet({
  isOpen,
  onClose,
  events,
  bookmarkIds,
  onBookmarkToggle,
}: Props) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const eventMap = new Map(events.map((e) => [e.id, e]));
  const bookmarkedEvents = bookmarkIds
    .map((id) => eventMap.get(id))
    .filter((e): e is Event => e != null)
    .slice(0, 10);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="保存済みイベント"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-hidden rounded-t-2xl border-t border-[var(--border)] bg-white shadow-lg dark:bg-[var(--background)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            保存済み
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--foreground-muted)] hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="閉じる"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="max-h-[calc(70vh-56px)] overflow-y-auto px-4 py-4">
          {bookmarkedEvents.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--foreground-muted)]">
                気になるイベントを🔖で保存するとここに並びます
              </p>
              <Link
                href="/events"
                className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                イベント一覧へ
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {bookmarkedEvents.map((e) => {
                const d = new Date(e.date + "T12:00:00");
                const dayLabel = WEEKDAY[d.getDay()];
                const dateStr = e.date
                  .replace(/-/g, "/")
                  .replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
                const timeStr = e.endTime
                  ? `${e.startTime}〜${e.endTime}`
                  : e.startTime;
                return (
                  <li key={e.id}>
                    <Link
                      href={`/events/${e.id}`}
                      className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-[var(--border)] p-3 shadow-sm transition-shadow hover:shadow-md active:scale-[0.99] dark:bg-white/5"
                    >
                      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl">
                        <EventThumbnail
                          imageUrl={e.imageUrl}
                          alt={e.title}
                          rounded="none"
                          fill
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {e.title}
                        </h4>
                        <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                          {dayLabel} {dateStr} {timeStr} ・ {e.location}
                        </p>
                      </div>
                      <div
                        className="shrink-0"
                        onClick={(ev) => ev.preventDefault()}
                      >
                        <BookmarkToggle
                          eventId={e.id}
                          isActive={true}
                          onToggle={onBookmarkToggle}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {bookmarkedEvents.length > 0 && (
          <div className="border-t border-[var(--border)] px-4 py-3">
            <Link
              href="/events"
              className="block text-center text-sm font-medium text-[var(--accent)] hover:underline"
            >
              イベント一覧へ →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
