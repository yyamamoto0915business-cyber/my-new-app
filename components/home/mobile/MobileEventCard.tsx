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

/** 横並び3枚（gap-1.5 × 2 = 0.75rem） */
export const MOBILE_EVENT_CARD_WIDTH = "calc((100% - 0.75rem) / 3)";

type Props = { event: Event };

function getFooterTags(event: Event, max = 1): string[] {
  const tags: string[] = [];
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
  const footerTags = getFooterTags(event);
  const category = getPrimaryCategory(event);
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
      className={`flex shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-[16px] border border-[#dde9e1] bg-white shadow-[0_4px_12px_rgba(22,56,40,0.05)] ${
        status === "ended" ? "opacity-75" : ""
      }`}
      style={{ width: MOBILE_EVENT_CARD_WIDTH }}
      aria-label={`${event.title}の詳細を見る`}
    >
      <div className="relative aspect-[3/2] shrink-0 overflow-hidden bg-[#e8ede4]">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          fill
          placeholderSize="icon"
        />
        <div className="absolute left-1 top-1 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-0.5">
          {isFree && (
            <span className="inline-flex h-4 items-center rounded-md bg-[#eef6f2]/95 px-1 text-[8px] font-semibold text-[#2f6b4f] ring-1 ring-[#b8dcc8]/80">
              無料
            </span>
          )}
          {event.childFriendly && (
            <span className="inline-flex h-4 items-center rounded-md bg-white/90 px-1 text-[8px] font-semibold text-[#8868b8] ring-1 ring-[#e8e0f0]">
              親子
            </span>
          )}
          {category === "workshop" && (
            <span className="inline-flex h-4 items-center rounded-md bg-white/90 px-1 text-[8px] font-semibold text-[#4a78b8] ring-1 ring-[#d8e4f4]">
              体験
            </span>
          )}
          {status === "ended" && (
            <span className="inline-flex h-4 items-center rounded-md bg-[#f4f6f4]/95 px-1 text-[8px] font-semibold text-[#566358] ring-1 ring-[#dde8df]/80">
              終了
            </span>
          )}
          {status === "full" && (
            <span className="inline-flex h-4 items-center rounded-md bg-[#f4f6f4]/95 px-1 text-[8px] font-semibold text-[#566358] ring-1 ring-[#dde8df]/80">
              満員
            </span>
          )}
        </div>
        <div
          className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-[#dde9e1]/80 bg-white/95 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkToggle
            eventId={event.id}
            isActive={saved}
            onToggle={() => setSaved(toggleBookmark(event.id))}
            tone="light"
            className="!min-h-0 !min-w-0 !p-0.5 [&_svg]:h-3 [&_svg]:w-3"
          />
        </div>
      </div>

      <div
        className="flex flex-col gap-0.5 px-2 py-1.5"
      >
        <p className="truncate text-[9px] leading-none text-[#6a6258]">
          {formatEventScheduleLabel(
            event.date,
            event.startTime,
            event.endTime,
            event.recurrence ?? "none",
            event.recurrenceCount
          )}
        </p>
        <h3 className="line-clamp-2 text-[10px] font-semibold leading-[1.2] text-[#163828]">
          {event.title}
        </h3>
        <p className="flex items-center gap-0.5 text-[9px] leading-none text-[#6a6258]">
          <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
          <span className="truncate">{event.location}</span>
        </p>
        {footerTags.length > 0 && (
          <div className="flex gap-0.5 overflow-hidden pt-0.5">
            {footerTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex max-w-full shrink truncate rounded border border-[#dde9e1] bg-[#f7fbf8] px-1 py-px text-[8px] font-medium text-[#3d5c48]"
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
