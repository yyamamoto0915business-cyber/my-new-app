"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { getTagLabel } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { addToRecent, isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";

/** 横並び3枚用（gap-2 × 2 = 1rem） */
export const MOBILE_EVENT_CARD_WIDTH = "calc((100% - 1rem) / 3)";

type Props = { event: Event };

function getEventTags(event: Event, max = 2): string[] {
  const tags: string[] = [];
  const category = getPrimaryCategory(event);
  if (category) tags.push(CATEGORY_LABELS[category]);
  for (const tagId of event.tags ?? []) {
    const label = getTagLabel(tagId);
    if (label && !tags.includes(label)) tags.push(label);
    if (tags.length >= max) break;
  }
  return tags.slice(0, max);
}

export function MobileEventCard({ event }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => isBookmarked(event.id));
  const status = getEventStatus(event);
  const displayTags = getEventTags(event);
  const isFree = event.price === 0;

  const handleOpen = () => {
    addToRecent(event.id);
    router.push(`/events/${event.id}`);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => e.key === "Enter" && handleOpen()}
      className={`shrink-0 snap-start cursor-pointer overflow-hidden rounded-[12px] border border-[#e8ebe6] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)] ${
        status === "ended" ? "opacity-70" : ""
      }`}
      style={{ width: MOBILE_EVENT_CARD_WIDTH }}
      aria-label={`${event.title}の詳細を見る`}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-[#e8ede4]">
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />
        <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
          <span
            className={`inline-flex h-[18px] items-center rounded px-1.5 text-[8px] font-semibold ${
              isFree
                ? "bg-[#eef6f2] text-[#2a7a58] ring-1 ring-[#b8dcc8]/80"
                : "bg-[#eef4fb] text-[#2b4a8a] ring-1 ring-[#b8cce8]/80"
            }`}
          >
            {isFree ? "無料" : "有料"}
          </span>
          {status === "ended" ? (
            <span className="inline-flex h-[18px] items-center rounded bg-[#f4f6f4] px-1.5 text-[8px] font-semibold text-[#566358] ring-1 ring-[#dde8df]/80">
              終了
            </span>
          ) : status === "full" ? (
            <span className="inline-flex h-[18px] items-center rounded bg-[#f4f6f4] px-1.5 text-[8px] font-semibold text-[#566358] ring-1 ring-[#dde8df]/80">
              満員
            </span>
          ) : null}
        </div>
        <div
          className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkToggle
            eventId={event.id}
            isActive={saved}
            onToggle={() => setSaved(toggleBookmark(event.id))}
            tone="light"
            className="!min-h-0 !min-w-0 !p-0.5 [&_svg]:h-3.5 [&_svg]:w-3.5"
          />
        </div>
      </div>

      <div className="space-y-px p-1.5 pb-1.5 pt-1">
        <p className="truncate text-[8px] leading-none text-[#6a6258]">
          {formatEventScheduleLabel(
            event.date,
            event.startTime,
            event.endTime,
            event.recurrence ?? "none",
            event.recurrenceCount
          )}
        </p>
        <h3 className="line-clamp-1 text-[10px] font-semibold leading-tight text-[#0e1610]">
          {event.title}
        </h3>
        <p className="flex items-center gap-0.5 text-[8px] leading-none text-[#6a6258]">
          <MapPin className="h-2 w-2 shrink-0" aria-hidden />
          <span className="truncate">{event.location}</span>
        </p>
        {displayTags.length > 0 && (
          <div className="flex gap-0.5 overflow-hidden">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex shrink-0 truncate rounded bg-[#f4f6f4] px-1 py-px text-[8px] font-medium text-[#3a5848]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
