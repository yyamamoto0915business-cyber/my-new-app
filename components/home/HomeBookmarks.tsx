"use client";

import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/types";
import { addToRecent } from "@/lib/bookmark-storage";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  events: Event[];
  bookmarkIds: string[];
  recentIds: string[];
  onBookmarkToggle: (eventId: string) => void;
};

function formatSub(event: Event): string {
  const d = new Date(event.date + "T12:00:00");
  const day = WEEKDAY[d.getDay()];
  const dateStr = event.date.replace(/-/g, "/").replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  return `${day} ${dateStr} ・ ${event.location}`;
}

function BookmarkShelfCard({
  event,
  isBookmarked,
  onToggle,
  onClick,
}: {
  event: Event;
  isBookmarked: boolean;
  onToggle: (id: string) => void;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="group flex w-[140px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)] sm:w-[160px]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          fill
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute right-1 top-1 z-10" onClick={(e) => e.stopPropagation()}>
          <BookmarkToggle
            eventId={event.id}
            isActive={isBookmarked}
            onToggle={onToggle}
          />
        </div>
        <div className="absolute bottom-1.5 left-1.5 right-1.5">
          <h3 className="line-clamp-2 font-serif text-xs font-semibold text-white drop-shadow-md">
            {event.title}
          </h3>
        </div>
      </div>
      <div className="p-2">
        <p className="line-clamp-1 text-[10px] text-[var(--foreground-muted)]">
          {formatSub(event)}
        </p>
      </div>
    </div>
  );
}

function EmptyShelf({ message }: { message: string }) {
  return (
    <div className="flex min-w-[200px] shrink-0 items-center rounded-xl border border-dashed border-[var(--border)] bg-zinc-50/50 px-4 py-3 dark:bg-zinc-900/30">
      <p className="text-left text-sm text-[var(--foreground-muted)]">{message}</p>
    </div>
  );
}

export function HomeBookmarks({
  events,
  bookmarkIds,
  recentIds,
  onBookmarkToggle,
}: Props) {
  const router = useRouter();
  const eventMap = new Map(events.map((e) => [e.id, e]));
  const bookmarkedEvents = bookmarkIds
    .map((id) => eventMap.get(id))
    .filter((e): e is Event => e != null);
  const recentEvents = recentIds
    .map((id) => eventMap.get(id))
    .filter((e): e is Event => e != null);

  const handleCardClick = (eventId: string) => {
    addToRecent(eventId);
    router.push(`/events/${eventId}`);
  };

  return (
    <section className="py-8" aria-label="あなたのしおり">
      <h2 className="mb-1 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        あなたのしおり
      </h2>
      <p className="mb-4 text-sm text-[var(--foreground-muted)]">
        保存したイベントと最近見たイベント
      </p>

      {/* A. 保存したイベント */}
      <div className="mb-6">
        <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          保存したイベント
        </h3>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {bookmarkedEvents.length === 0 ? (
            <EmptyShelf message="気になるイベントを🔖で保存するとここに並びます" />
          ) : (
            bookmarkedEvents.map((e) => (
              <BookmarkShelfCard
                key={e.id}
                event={e}
                isBookmarked={true}
                onToggle={onBookmarkToggle}
                onClick={() => handleCardClick(e.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* B. 最近見た */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          最近見た
        </h3>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {recentEvents.length === 0 ? (
            <EmptyShelf message="見たイベントがここに残ります" />
          ) : (
            recentEvents.map((e) => (
              <BookmarkShelfCard
                key={e.id}
                event={e}
                isBookmarked={bookmarkIds.includes(e.id)}
                onToggle={onBookmarkToggle}
                onClick={() => handleCardClick(e.id)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
