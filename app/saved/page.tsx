"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBookmarks, toggleBookmark } from "@/lib/bookmark-storage";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { formatEventDateTime } from "@/lib/format-date";

export default function SavedPage() {
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBookmarkIds(getBookmarks());
  }, []);

  useEffect(() => {
    if (bookmarkIds.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchWithTimeout("/api/events")
      .then((r) => r.json())
      .then((data: Event[]) => {
        const map = new Map(data.map((e) => [e.id, e]));
        setEvents(
          bookmarkIds
            .map((id) => map.get(id))
            .filter((e): e is Event => e != null)
        );
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [bookmarkIds.join(",")]);

  const handleBookmarkToggle = (eventId: string) => {
    toggleBookmark(eventId);
    setBookmarkIds(getBookmarks());
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-[var(--mg-mobile-top-header-h)] z-30 border-b border-[var(--border)] bg-white/95 px-4 py-3 backdrop-blur-sm sm:top-0 dark:bg-[var(--background)]">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          保存したイベント
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          気になるイベントを🔖で保存するとここに並びます
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">読み込み中...</div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-500">保存したイベントがありません</p>
            <Link
              href="/discover"
              className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              イベントを探す
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/50"
                >
                  <EventThumbnail
                    imageUrl={event.imageUrl}
                    alt={event.title}
                    rounded="none"
                  />
                  <div className="flex items-start justify-between gap-2 p-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-zinc-900 line-clamp-2 dark:text-zinc-100">
                        {event.title}
                      </h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatEventDateTime(event.date, event.startTime)} ・ {event.location}
                      </p>
                    </div>
                    <BookmarkToggle
                      eventId={event.id}
                      isActive={bookmarkIds.includes(event.id)}
                      onToggle={() => handleBookmarkToggle(event.id)}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
