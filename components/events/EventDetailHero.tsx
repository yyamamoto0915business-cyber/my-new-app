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
import { getEventStatus, type EventStatus } from "@/lib/events";

type Props = {
  event: Event;
};

function receptionLabel(status: EventStatus, isAvailable: boolean): string {
  if (!isAvailable) {
    if (status === "ended") return "終了";
    if (status === "full") return "満員";
  }
  return "参加受付中";
}

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

  const reception = receptionLabel(status, isAvailable);

  return (
    <section aria-label="イベントの概要" className="max-sm:space-y-4">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 max-sm:rounded-2xl sm:rounded-none">
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />

        <div className="absolute left-3 top-3 hidden items-center gap-2 sm:flex">
          <Link
            href="/events"
            className="inline-flex h-11 w-11 min-h-[var(--mg-touch-min)] min-w-[var(--mg-touch-min)] items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-700 shadow-[var(--mg-shadow)] backdrop-blur-sm"
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

        <div className="absolute right-3 top-3 hidden sm:block">
          <div
            className="inline-flex h-11 w-11 min-h-[var(--mg-touch-min)] min-w-[var(--mg-touch-min)] items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-700 backdrop-blur-sm"
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
        </div>

        <div className="absolute bottom-3 left-3 hidden flex-wrap gap-2 sm:flex">
          <span className="inline-flex h-8 items-center rounded-full bg-white/90 px-3 text-xs font-semibold text-slate-700 backdrop-blur-sm">
            {dateBadge}
            {event.endTime ? `〜${event.endTime}` : ""}
          </span>
          {event.price === 0 ? (
            <span className="inline-flex h-8 items-center rounded-full border border-emerald-100/70 bg-emerald-50/95 px-3 text-xs font-semibold text-emerald-700 backdrop-blur-sm">
              無料
            </span>
          ) : (
            <span className="inline-flex h-8 items-center rounded-full border border-white/50 bg-white/90 px-3 text-xs font-semibold text-slate-700 backdrop-blur-sm">
              ¥{event.price}
            </span>
          )}
          {isAvailable && (
            <span className="inline-flex h-8 items-center rounded-full border border-green-100/70 bg-green-50/95 px-3 text-xs font-semibold text-green-700 backdrop-blur-sm">
              参加受付中
            </span>
          )}
        </div>
      </div>

      <div
        className="relative hidden sm:block sm:-mt-6 sm:mx-4 sm:rounded-[24px] sm:border sm:border-slate-200/90 sm:bg-white sm:p-6 sm:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
      >
        <h1 className="text-[22px] font-semibold leading-8 text-[var(--mg-ink)]">
          {event.title}
        </h1>

        {event.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--mg-muted)]">
            {event.description}
          </p>
        )}

        <dl className="mt-4 space-y-5">
          <div>
            <dt className="text-xs font-medium text-[var(--mg-muted)]">日時</dt>
            <dd className="mt-2 flex items-start gap-3 text-[15px] font-semibold leading-relaxed text-[var(--mg-ink)]">
              <CalendarDays
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]"
                aria-hidden
              />
              <span className="min-w-0 break-words">
                {formatEventDateTime(event.date, event.startTime)}
                {event.endTime ? ` 〜 ${event.endTime}` : ""}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--mg-muted)]">場所</dt>
            <dd className="mt-2 flex items-start gap-3 text-[15px] font-semibold leading-relaxed text-[var(--mg-ink)]">
              <MapPin
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]"
                aria-hidden
              />
              <span className="min-w-0 break-words">
                {event.location}
                {event.address ? (
                  <span className="mt-1 block text-sm font-normal leading-relaxed text-[var(--mg-muted)]">
                    {event.address}
                  </span>
                ) : null}
              </span>
            </dd>
          </div>
        </dl>

        <dl className="mt-5 flex gap-8 sm:flex-wrap">
          <div>
            <dt className="text-xs font-medium text-[var(--mg-muted)]">料金</dt>
            <dd className="mt-1 text-[15px] font-semibold text-[var(--mg-ink)]">
              {event.price === 0 ? "無料" : `¥${Number(event.price).toLocaleString("ja-JP")}`}
              {event.priceNote ? (
                <span className="ml-1 text-sm font-normal text-[var(--mg-muted)]">
                  （{event.priceNote}）
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--mg-muted)]">受付</dt>
            <dd className="mt-1 text-[15px] font-medium text-[var(--mg-ink)]">{reception}</dd>
          </div>
        </dl>

        {event.organizerName && (
          <dl className="mt-5 sm:mt-4">
            <dt className="text-xs font-medium text-[var(--mg-muted)]">主催</dt>
            <dd className="mt-2 flex items-start gap-3 text-sm leading-relaxed text-[var(--mg-ink)]">
              <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-[var(--mg-muted)]" aria-hidden />
              <span className="min-w-0 break-words">{event.organizerName}</span>
            </dd>
          </dl>
        )}
      </div>
    </section>
  );
}
