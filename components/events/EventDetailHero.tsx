"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatEventDateTime } from "@/lib/format-date";
import { CalendarDays, MapPin, UserRound, ArrowLeft } from "lucide-react";
import { getEventStatus } from "@/lib/events";

type Props = {
  event: Event;
};

export function EventDetailHero({ event }: Props) {
  const status = getEventStatus(event);
  const isAvailable = status === "available";
  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;
  const [saved, setSaved] = useState(() => isBookmarked(event.id));

  const dateBadge = useMemo(() => {
    const d = formatEventDateTime(event.date, event.startTime);
    return d;
  }, [event.date, event.startTime]);

  return (
    <section aria-label="イベントの概要">
      <div className="relative overflow-hidden bg-slate-100 aspect-[16/10] w-full">
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Link
            href="/events"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-700 backdrop-blur-sm"
            aria-label="一覧に戻る"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          {categoryLabel && (
            <span className="inline-flex h-8 items-center rounded-full bg-white/90 px-3 text-xs font-semibold text-slate-700 backdrop-blur-sm">
              {categoryLabel}
            </span>
          )}
        </div>

        <div
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-700 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkToggle
            eventId={event.id}
            isActive={saved}
            onToggle={() => {
              const nowSaved = toggleBookmark(event.id);
              setSaved(nowSaved);
            }}
            className="hover:bg-transparent active:bg-transparent"
          />
        </div>

        <div className="absolute left-3 bottom-3 flex flex-wrap gap-2">
          <span className="inline-flex h-8 items-center rounded-full bg-white/90 px-3 text-xs font-semibold text-slate-700 backdrop-blur-sm">
            {dateBadge}
            {event.endTime ? `〜${event.endTime}` : ""}
          </span>
          {event.price === 0 ? (
            <span className="inline-flex h-8 items-center rounded-full bg-emerald-50/95 px-3 text-xs font-semibold text-emerald-700 backdrop-blur-sm border border-emerald-100/70">
              無料
            </span>
          ) : (
            <span className="inline-flex h-8 items-center rounded-full bg-white/90 px-3 text-xs font-semibold text-slate-700 backdrop-blur-sm border border-white/50">
              ¥{event.price}
            </span>
          )}
          {isAvailable && (
            <span className="inline-flex h-8 items-center rounded-full bg-green-50/95 px-3 text-xs font-semibold text-green-700 backdrop-blur-sm border border-green-100/70">
              参加受付中
            </span>
          )}
        </div>
      </div>

      <div className="relative -mt-6 mx-4 rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
        <h1 className="text-[22px] font-semibold leading-8 text-slate-900">
          {event.title}
        </h1>

        {event.description && (
          <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-3">
            {event.description}
          </p>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="min-w-0">
              {formatEventDateTime(event.date, event.startTime)}
              {event.endTime ? `〜${event.endTime}` : ""}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="min-w-0">
              {event.location}
              {event.address ? <span className="text-slate-500">（{event.address}）</span> : null}
            </span>
          </div>
          {event.organizerName && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="min-w-0">{event.organizerName}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

