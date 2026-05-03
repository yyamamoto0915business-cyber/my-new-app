"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";
import { formatEventDateTime } from "@/lib/format-date";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { addToRecent, isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";
import { CalendarDays, MapPin, UserRound } from "lucide-react";

type Props = { event: Event };

/** 説明を最大文字数で省略 */
function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export function EventCard({ event }: Props) {
  const router = useRouter();
  const status = getEventStatus(event);
  const isEnded = status === "ended";

  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;

  const [saved, setSaved] = useState(() => isBookmarked(event.id));

  const statusBadge = useMemo(() => {
    if (status === "available") return { label: "参加受付中", className: "bg-[#eef6f2] text-[#1e3020] border-[#b8d0c8]" };
    if (status === "full") return { label: "満員", className: "bg-[#f0ece4] text-[#6a6258] border-[#ccc4b4]" };
    if (status === "ended") return { label: "終了", className: "bg-[#f0ece4] text-[#a8a090] border-[#ccc4b4]" };
    return null;
  }, [status]);

  const priceBadge = useMemo(() => {
    if (event.price === 0) return { label: "無料", className: "bg-[#eef6f2] text-[#2c7a88] border-[#b8d0c8]" };
    return { label: `¥${event.price}`, className: "bg-[#faf8f2] text-[#3a3428] border-[#ccc4b4]" };
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
      className={`overflow-hidden rounded-[20px] border border-[#ccc4b4] bg-[#faf8f2] transition active:scale-[0.995] ${
        isEnded ? "opacity-60" : ""
      }`}
      aria-label={`${event.title}の詳細を見る`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#e4ede0]">
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />

        {categoryLabel && (
          <span className="absolute left-3 top-3 inline-flex h-7 items-center rounded-full border border-white/40 bg-white/85 px-3 text-[11px] font-semibold text-[#3a3428] backdrop-blur-sm">
            {categoryLabel}
          </span>
        )}

        <div
          className="absolute right-2 top-2 z-10 flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full bg-black/25 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkToggle
            eventId={event.id}
            isActive={saved}
            onToggle={() => {
              const nowSaved = toggleBookmark(event.id);
              setSaved(nowSaved);
            }}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-semibold ${priceBadge.className}`}>
            {priceBadge.label}
          </span>
          {statusBadge && (
            <span className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-semibold ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          )}
          {event.salonOnly && (
            <span className="inline-flex h-7 items-center rounded-full border border-[#f0d8a0] bg-[#fef8e8] px-3 text-[11px] font-semibold text-[#8a6820]">
              サロン限定
            </span>
          )}
        </div>

        <h3
          className="mt-2.5 text-[16px] font-bold leading-6 text-[#0e1610] line-clamp-2"
          style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
        >
          {event.title}
        </h3>

        {event.description && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#6a6258] line-clamp-2">
            {truncate(event.description, 72)}
          </p>
        )}

        <div className="mt-3 space-y-1.5">
          <div className="flex items-start gap-2 text-[13px] text-[#3a3428]">
            <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a8a090]" aria-hidden />
            <span className="min-w-0">
              {formatEventDateTime(event.date, event.startTime)}
              {event.endTime ? `〜${event.endTime}` : ""}
            </span>
          </div>
          <div className="flex items-start gap-2 text-[13px] text-[#3a3428]">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a8a090]" aria-hidden />
            <span className="min-w-0 line-clamp-1">
              {event.location}
            </span>
          </div>
          {event.organizerName && (
            <div className="flex items-start gap-2 text-[13px] text-[#3a3428]">
              <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a8a090]" aria-hidden />
              <span className="min-w-0 line-clamp-1">
                {event.organizerName}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3.5">
          <span className="inline-flex h-10 w-full items-center justify-center rounded-full border border-[#ccc4b4] bg-white text-[13px] font-medium text-[#3a3428]">
            詳細を見る →
          </span>
        </div>
      </div>
    </article>
  );
}
