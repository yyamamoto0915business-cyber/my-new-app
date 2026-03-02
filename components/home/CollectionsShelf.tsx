"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { eventMatchesCategory } from "@/lib/inferCategory";
import { addToRecent } from "@/lib/bookmark-storage";
import { filterEventsByRegion } from "@/lib/events";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { getPrimaryCategory } from "@/lib/inferCategory";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type LaneConfig = {
  title: string;
  filter: (e: Event) => boolean;
};

const LANES: LaneConfig[] = [
  {
    title: "無料で楽しむ今週",
    filter: (e) =>
      e.price === 0 ||
      e.tags?.includes("free") === true ||
      /無料/.test(e.title),
  },
  {
    title: "親子の休日",
    filter: (e) =>
      e.childFriendly ||
      e.tags?.includes("kids") === true ||
      /親子|キッズ|子供/.test(e.title),
  },
  {
    title: "はじめての体験",
    filter: (e) =>
      /体験|ワークショップ|教室/.test(e.title) ||
      e.tags?.includes("beginner") === true,
  },
];

type Props = {
  events: Event[];
  areaPreference?: string;
  categoryPrefs?: CategoryKey[];
  bookmarkIds: string[];
  onBookmarkToggle: (eventId: string) => void;
};

function CollectionCard({
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
  const dateStr = event.date
    .replace(/-/g, "/")
    .replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  const timeStr = event.endTime
    ? `${event.startTime}〜${event.endTime}`
    : event.startTime;

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
      className="group flex w-[168px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.98] dark:bg-[var(--background)] sm:w-[220px]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          className="rounded-t-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {getPrimaryCategory(event) && (
          <div className="absolute left-2 top-2 z-10">
            <CategoryBadge event={event} className="text-[10px]" />
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
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="line-clamp-2 font-serif text-sm font-semibold text-white drop-shadow-md">
            {event.title}
          </h3>
        </div>
        {event.price === 0 && (
          <span className="absolute right-10 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            無料
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <p className="text-xs text-[var(--foreground-muted)]">
          {dayLabel} {dateStr} {timeStr}
        </p>
        <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
          {event.location}
        </p>
      </div>
    </div>
  );
}

export function CollectionsShelf({
  events,
  areaPreference = "",
  categoryPrefs = [],
  bookmarkIds,
  onBookmarkToggle,
}: Props) {
  const areaEvents =
    areaPreference.trim().length > 0
      ? filterEventsByRegion(events, areaPreference)
      : events;
  const hasCategory = categoryPrefs.length > 0;

  return (
    <section className="py-6 sm:py-8" aria-label="テーマ別コレクション">
      <h2 className="mb-1 font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
        テーマ別コレクション
      </h2>
      <p className="mb-4 text-sm text-[var(--foreground-muted)]">
        編集された束から選ぶ
      </p>

      <div className="space-y-6">
        {LANES.slice(0, 3).map((lane) => {
          const laneFilter = (e: Event) => lane.filter(e);
          let display: Event[];

          if (hasCategory) {
            const usedIds = new Set<string>();
            const catMatches = areaEvents.filter(
              (e) => laneFilter(e) && eventMatchesCategory(e, categoryPrefs)
            ).slice(0, 3);
            catMatches.forEach((e) => usedIds.add(e.id));
            let list = [...catMatches];
            if (list.length < 3) {
              const areaMore = areaEvents
                .filter(laneFilter)
                .filter((e) => !usedIds.has(e.id))
                .slice(0, 3 - list.length);
              list = [...list, ...areaMore];
              areaMore.forEach((e) => usedIds.add(e.id));
            }
            if (list.length < 3) {
              const allMore = events
                .filter(laneFilter)
                .filter((e) => !usedIds.has(e.id))
                .slice(0, 3 - list.length);
              list = [...list, ...allMore];
            }
            display = list.slice(0, 3);
          } else {
            const areaFiltered = areaEvents.filter(laneFilter).slice(0, 3);
            const areaIds = new Set(areaFiltered.map((e) => e.id));
            const complement = events
              .filter(laneFilter)
              .filter((e) => !areaIds.has(e.id))
              .slice(0, 3 - areaFiltered.length);
            display = [...areaFiltered, ...complement].slice(0, 3);
          }

          return (
            <div key={lane.title}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {lane.title}
                </h3>
                <Link
                  href="/events"
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  すべて見る →
                </Link>
              </div>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
                {display.map((e) => (
                  <CollectionCard
                    key={e.id}
                    event={e}
                    isBookmarked={bookmarkIds.includes(e.id)}
                    onBookmarkToggle={onBookmarkToggle}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
