"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Event } from "@/lib/db/types";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { addToRecent } from "@/lib/bookmark-storage";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  event: Event;
  isBookmarked: boolean;
  onBookmarkToggle: (id: string) => void;
};

/** 横棚用の統一カード：同じ高さ・同じ情報配置 */
export function ShelfCard({
  event,
  isBookmarked,
  onBookmarkToggle,
}: Props) {
  const router = useRouter();
  const category = getPrimaryCategory(event);
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

  const badges: { label: string; accent?: boolean }[] = [];
  if (category) badges.push({ label: CATEGORY_LABELS[category] });
  if (event.price === 0) badges.push({ label: "無料", accent: true });
  else if (badges.length < 2) badges.push({ label: `¥${event.price}` });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="flex w-[168px] shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.98] dark:bg-[var(--background)] sm:w-[200px]"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          fill
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        {badges.length > 0 && (
          <div className="absolute left-2 top-2 z-10 flex gap-1">
            {badges.slice(0, 2).map((b) => (
              <span
                key={b.label}
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  b.accent
                    ? "bg-white/90 text-[var(--accent)]"
                    : "bg-black/50 text-white backdrop-blur-sm"
                }`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        <div
          className="absolute right-2 top-2 z-10 flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
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
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <p className="text-xs text-[var(--foreground-muted)]">
          {dayLabel} {dateStr} {timeStr}
        </p>
        <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
          {event.location}
        </p>
        {event.organizerName && (
          <p className="mt-0.5 truncate text-[10px] text-zinc-500 dark:text-zinc-500">
            {event.organizerId ? (
              <Link
                href={`/organizers/${event.organizerId}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline"
              >
                by {event.organizerName}
              </Link>
            ) : (
              <>by {event.organizerName}</>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
