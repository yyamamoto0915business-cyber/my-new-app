"use client";

import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { addToRecent } from "@/lib/bookmark-storage";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  events: Event[];
  loading?: boolean;
  bookmarkIds?: string[];
  onBookmarkToggle?: (eventId: string) => void;
};

/** 1枚目用の引用（ダミー） */
const PICKUP_QUOTE = "初めてでも居場所ができた";

export function WeeklyPickup({
  events,
  loading,
  bookmarkIds = [],
  onBookmarkToggle = () => {},
}: Props) {
  const items = events.slice(0, 10);

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="mb-3 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          今週のまち便り
        </h2>
        <div className="-mx-4 flex gap-4 overflow-x-hidden px-4 pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 w-[280px] shrink-0 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="py-8">
        <h2 className="mb-3 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          今週のまち便り
        </h2>
        <p className="py-8 text-center text-sm text-[var(--foreground-muted)]">
          該当するイベントがありません
        </p>
      </section>
    );
  }

  const [first, ...rest] = items;

  return (
    <section className="py-6 sm:py-8" aria-label="今週のまち便り">
      <h2 className="mb-3 font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
        今週のまち便り
      </h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:gap-4">
        {first && (
          <PickupCardFeatured
            key={first.id}
            event={first}
            quote={PICKUP_QUOTE}
            isBookmarked={bookmarkIds.includes(first.id)}
            onBookmarkToggle={onBookmarkToggle}
          />
        )}
        {rest.map((e) => (
          <PickupCard
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

function PickupCardFeatured({
  event,
  quote,
  isBookmarked,
  onBookmarkToggle,
}: {
  event: Event;
  quote: string;
  isBookmarked: boolean;
  onBookmarkToggle: (id: string) => void;
}) {
  const router = useRouter();
  const d = new Date(event.date + "T12:00:00");
  const dayLabel = WEEKDAY[d.getDay()];
  const dateStr = event.date.replace(/-/g, "/").replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  const timeStr = event.endTime ? `${event.startTime}-${event.endTime}` : event.startTime;

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
      className="group flex w-[min(300px,88vw)] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.995] dark:bg-[var(--background)] sm:w-[320px]"
    >
      <div className="relative aspect-[16/10]">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          className="rounded-t-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {getPrimaryCategory(event) && (
          <div className="absolute left-2 top-2 z-10">
            <CategoryBadge event={event} />
          </div>
        )}
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
        <div className="absolute bottom-2 left-2 right-2 text-white">
          <p className="text-xs font-medium drop-shadow-md">{event.organizerName}</p>
          <h3 className="mt-0.5 line-clamp-2 font-serif text-sm font-semibold drop-shadow-md">
            {event.title}
          </h3>
        </div>
        {event.price === 0 && (
          <span className="absolute right-12 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            無料
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <blockquote className="mb-3 border-l-2 border-[var(--accent)] pl-3 text-sm italic text-[var(--foreground-muted)]">
          &quot;{quote}&quot;
        </blockquote>
        <div className="mt-auto">
          <p className="text-xs text-[var(--foreground-muted)]">
            {dayLabel} {dateStr} {timeStr}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
            {event.location}
          </p>
        </div>
      </div>
    </div>
  );
}

function PickupCard({
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
  const timeStr = event.endTime ? `${event.startTime}-${event.endTime}` : event.startTime;

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
      className="group flex w-[min(260px,80vw)] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.98] dark:bg-[var(--background)] sm:w-[280px]"
    >
      <div className="relative aspect-[16/10]">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          className="rounded-t-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {getPrimaryCategory(event) && (
          <div className="absolute left-2 top-2 z-10">
            <CategoryBadge event={event} />
          </div>
        )}
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
        <div className="absolute bottom-2 left-2 right-2 text-white">
          <p className="text-xs font-medium drop-shadow-md">{event.organizerName}</p>
          <h3 className="mt-0.5 line-clamp-2 font-serif text-sm font-semibold drop-shadow-md">
            {event.title}
          </h3>
        </div>
        {event.price === 0 && (
          <span className="absolute right-12 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            無料
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--foreground-muted)]">
            {dayLabel} {dateStr} {timeStr}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
            {event.location}
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-[var(--accent)]">
          {event.price === 0 ? "無料" : `¥${event.price}`}
        </span>
      </div>
    </div>
  );
}
