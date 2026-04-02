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
    if (status === "available") return { label: "参加受付中", className: "bg-green-50 text-green-700 border-green-100" };
    if (status === "full") return { label: "満員", className: "bg-slate-100 text-slate-600 border-slate-200" };
    if (status === "ended") return { label: "終了", className: "bg-slate-100 text-slate-500 border-slate-200" };
    return null;
  }, [status]);

  const priceBadge = useMemo(() => {
    if (event.price === 0) return { label: "無料", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    return { label: `¥${event.price}`, className: "bg-slate-50 text-slate-700 border-slate-200" };
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
      className={`overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition active:scale-[0.995] ${
        isEnded ? "opacity-60" : ""
      }`}
      aria-label={`${event.title}の詳細を見る`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />

        {categoryLabel && (
          <span className="absolute left-3 top-3 inline-flex h-8 items-center rounded-full border border-white/40 bg-white/85 px-3 text-xs font-semibold text-slate-700 backdrop-blur-sm">
            {categoryLabel}
          </span>
        )}

        <div
          className="absolute right-2 top-2 z-10 flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
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
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${priceBadge.className}`}>
            {priceBadge.label}
          </span>
          {statusBadge && (
            <span className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          )}
          {event.salonOnly && (
            <span className="inline-flex h-8 items-center rounded-full border border-amber-100 bg-amber-50 px-3 text-xs font-semibold text-amber-800">
              サロン限定
            </span>
          )}
        </div>

        <h3 className="mt-3 text-[17px] font-semibold leading-6 text-slate-900 line-clamp-2">
          {event.title}
        </h3>

        {event.description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">
            {truncate(event.description, 72)}
          </p>
        )}

        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="min-w-0">
              {formatEventDateTime(event.date, event.startTime)}
              {event.endTime ? `〜${event.endTime}` : ""}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="min-w-0 line-clamp-1">
              {event.location}
            </span>
          </div>
          {event.organizerName && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="min-w-0 line-clamp-1">
                {event.organizerName}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
            詳細を見る
          </span>
          <span className="text-xs text-slate-500">
            タップで開く
          </span>
        </div>
      </div>
    </article>
  );
}
