"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { EventThumbnail } from "@/components/event-thumbnail";
import { addToRecent, isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";
import { CalendarDays, MapPin, Bookmark } from "lucide-react";

type Props = { event: Event };

export function EventCard({ event }: Props) {
  const router = useRouter();
  const status = getEventStatus(event);
  const isEnded = status === "ended";

  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;

  const [saved, setSaved] = useState(() => isBookmarked(event.id));

  const statusBadge = useMemo(() => {
    if (status === "available") return { label: "募集中", className: "bg-[#EAF4ED] text-[#2D7A4F] border-[#B8DFC5]" };
    if (status === "full") return { label: "満員", className: "bg-[#F5F8F5] text-[#566358] border-[#DDE8DF]" };
    if (status === "ended") return { label: "終了", className: "bg-[#F5F8F5] text-[#566358] border-[#DDE8DF]" };
    return null;
  }, [status]);

  const priceBadge = useMemo(() => {
    if (event.price === 0) return { label: "無料", className: "bg-[#EAF4ED] text-[#2D7A4F] border-[#B8DFC5]" };
    return { label: `¥${event.price}`, className: "bg-[#F5F8F5] text-[#566358] border-[#DDE8DF]" };
  }, [event.price]);

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
      className={`bg-white border border-[#DDE8DF] rounded-[12px] overflow-hidden cursor-pointer transition hover:border-[#4CAF50] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(45,122,79,0.1)] ${
        isEnded ? "opacity-60" : ""
      }`}
      aria-label={`${event.title}の詳細を見る`}
    >
      {/* Image area */}
      <div className="relative h-[160px] overflow-hidden bg-[#f0f4f0]">
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />

        {categoryLabel && (
          <span className="absolute left-[10px] top-[10px] inline-flex items-center rounded-[6px] border border-[#DDE8DF] bg-white/92 px-2 py-[3px] text-[11px] text-[#566358]">
            {categoryLabel}
          </span>
        )}

        <button
          type="button"
          aria-label={saved ? "ブックマーク解除" : "ブックマーク"}
          className="absolute right-[10px] top-[10px] h-[30px] w-[30px] rounded-full bg-white/85 flex items-center justify-center transition hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            const nowSaved = toggleBookmark(event.id);
            setSaved(nowSaved);
          }}
        >
          <Bookmark
            className="h-[15px] w-[15px]"
            style={{
              color: saved ? "#2D7A4F" : "#566358",
              fill: saved ? "#2D7A4F" : "none",
            }}
          />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 pt-[14px]">
        {/* Date row */}
        <div className="flex items-center gap-[5px] text-[12px] font-medium text-[#2D7A4F] mb-[4px]">
          <CalendarDays className="h-[13px] w-[13px] shrink-0" aria-hidden />
          <span>
            {formatEventScheduleLabel(
              event.date,
              event.startTime,
              event.endTime,
              event.recurrence ?? "none",
              event.recurrenceCount
            )}
          </span>
        </div>

        {/* Venue row */}
        <div className="flex items-center gap-[4px] text-[11px] text-[#566358] mb-[2px]">
          <MapPin className="h-[12px] w-[12px] shrink-0 text-[#2D7A4F]" aria-hidden />
          <span className="line-clamp-1">{event.location}</span>
          {(event as Event & { requiresReservation?: boolean }).requiresReservation && (
            <span className="ml-1 text-amber-600 text-[10px] font-medium">要予約</span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#DDE8DF] mb-[8px] mt-[10px]" />

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] font-medium ${priceBadge.className}`}
          >
            {priceBadge.label}
          </span>
          {statusBadge && (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] font-medium ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          )}
          {event.salonOnly && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-[3px] text-[11px] font-medium text-amber-700">
              サロン限定
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[14px] font-semibold leading-[1.4] text-[#1A2214] line-clamp-2 mt-2 mb-[6px]">
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="text-[12px] leading-[1.6] text-[#566358] line-clamp-2 mb-[8px]">
            {event.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-[4px] text-[11px] text-[#566358]">
          <MapPin className="h-[12px] w-[12px] shrink-0 text-[#2D7A4F]" aria-hidden />
          <span className="line-clamp-1">{event.location}</span>
        </div>
      </div>
    </article>
  );
}
