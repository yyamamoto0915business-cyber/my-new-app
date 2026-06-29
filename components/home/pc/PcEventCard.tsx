"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { addToRecent, isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";

type Props = { event: Event };

export function PcEventCard({ event }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => isBookmarked(event.id));
  const status = getEventStatus(event);
  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : null;
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
      className={`group cursor-pointer overflow-hidden rounded-[12px] border border-[#e8ebe6] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:border-[#c8dcd0] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)] ${
        status === "ended" ? "opacity-70" : ""
      }`}
      aria-label={`${event.title}の詳細を見る`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#e8ede4]">
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />
        <div className="absolute left-2.5 top-2.5 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-1">
          <span
            className={`inline-flex h-6 items-center rounded-md px-2 text-[10px] font-semibold ${
              isFree
                ? "bg-[#eef6f2] text-[#2a7a58] ring-1 ring-[#b8dcc8]/80"
                : "bg-[#eef4fb] text-[#2b4a8a] ring-1 ring-[#b8cce8]/80"
            }`}
          >
            {isFree ? "無料" : "有料"}
          </span>
          {status === "ended" ? (
            <span className="inline-flex h-6 items-center rounded-md bg-[#f4f6f4] px-2 text-[10px] font-semibold text-[#566358] ring-1 ring-[#dde8df]/80">
              終了
            </span>
          ) : status === "full" ? (
            <span className="inline-flex h-6 items-center rounded-md bg-[#f4f6f4] px-2 text-[10px] font-semibold text-[#566358] ring-1 ring-[#dde8df]/80">
              満員
            </span>
          ) : null}
        </div>
        <div
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkToggle
            eventId={event.id}
            isActive={saved}
            onToggle={() => setSaved(toggleBookmark(event.id))}
          />
        </div>
      </div>

      <div className="space-y-1 p-2.5">
        <p className="text-[10px] text-[#6a6258]">
          {formatEventScheduleLabel(
            event.date,
            event.startTime,
            event.endTime,
            event.recurrence ?? "none",
            event.recurrenceCount
          )}
        </p>
        <h3 className="line-clamp-1 text-[12px] font-semibold leading-snug text-[#0e1610]">
          {event.title}
        </h3>
        <p className="flex items-start gap-1 text-[10px] text-[#6a6258]">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span className="line-clamp-1">{event.location}</span>
        </p>
        {categoryLabel && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            <span className="inline-flex h-5 items-center rounded-md bg-[#f4f6f4] px-2 text-[10px] font-medium text-[#3a5848]">
              {categoryLabel}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
