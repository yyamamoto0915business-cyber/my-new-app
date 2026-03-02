"use client";

import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { GlyphBadge } from "@/components/ui/GlyphBadge";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { addToRecent } from "@/lib/bookmark-storage";
import { getGlyphsForEvent } from "./glyph-utils";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  events: Event[];
  loading?: boolean;
  bookmarkIds?: string[];
  onBookmarkToggle?: (eventId: string) => void;
};

export function RecommendedWithGlyph({
  events,
  loading,
  bookmarkIds = [],
  onBookmarkToggle = () => {},
}: Props) {
  const items = events.slice(0, 3);

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="mb-4 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          あなたの近くのしるし
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 w-[220px] shrink-0 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="py-8" aria-label="あなたの近くのしるし">
      <h2 className="mb-3 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        あなたの近くのしるし
      </h2>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
        {items.map((e) => (
          <RecommendedCard
            key={e.id}
            event={e}
            isBookmarked={bookmarkIds.includes(e.id)}
            onBookmarkToggle={onBookmarkToggle}
          />
        ))}
      </div>
    </section>
  );
}

function RecommendedCard({
  event,
  isBookmarked,
  onBookmarkToggle,
}: {
  event: Event;
  isBookmarked: boolean;
  onBookmarkToggle: (id: string) => void;
}) {
  const router = useRouter();
  const d = new Date(event.date + "T12:00:00");
  const dayLabel = WEEKDAY[d.getDay()];
  const dateStr = event.date.replace(/-/g, "/").replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  const timeStr = event.endTime ? `${event.startTime}〜${event.endTime}` : event.startTime;
  const glyphs = getGlyphsForEvent(event);

  const handleClick = () => {
    addToRecent(event.id);
    router.push(`/events/${event.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="group flex w-[220px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)] sm:w-auto"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          className="rounded-t-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {glyphs.map((g) => (
            <GlyphBadge key={g} glyph={g} />
          ))}
        </div>
        <div
          className="absolute right-2 top-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkToggle
            eventId={event.id}
            isActive={isBookmarked}
            onToggle={onBookmarkToggle}
          />
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="line-clamp-2 font-serif text-sm font-semibold text-white drop-shadow-md">
            {event.title}
          </h3>
        </div>
        {event.price === 0 && (
          <span className="absolute right-12 top-2 rounded-full bg-white/95 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            無料
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="text-xs text-[var(--foreground-muted)]">
          {dayLabel} {dateStr} {timeStr}
        </p>
        <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{event.location}</p>
      </div>
    </div>
  );
}
