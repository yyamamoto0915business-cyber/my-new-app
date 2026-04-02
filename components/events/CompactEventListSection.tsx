"use client";

import Link from "next/link";
import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { formatEventDateTime } from "@/lib/format-date";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";

type Props = {
  title: string;
  subtitle?: string;
  events: Event[];
  moreHref?: string;
  moreLabel?: string;
  showOrganizerName?: boolean;
};

export function CompactEventListSection({
  title,
  subtitle,
  events,
  moreHref,
  moreLabel = "もっと見る",
  showOrganizerName = false,
}: Props) {
  if (events.length === 0) return null;

  return (
    <section className="pt-2 pb-6" aria-label={title}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {moreHref && (
          <Link
            href={moreHref}
            className="inline-flex items-center gap-1 text-sm font-semibold text-green-700"
          >
            {moreLabel} →
          </Link>
        )}
      </div>

      <ul className="mt-3 space-y-3">
        {events.map((event) => {
          const category = getPrimaryCategory(event);
          const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;
          return (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex gap-3 rounded-[20px] border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,0.05)]"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                  <EventThumbnail
                    imageUrl={event.imageUrl}
                    alt={event.title}
                    rounded="none"
                    fill
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600">
                      {formatEventDateTime(event.date, event.startTime)}
                    </span>
                    {categoryLabel && (
                      <span className="inline-flex h-7 items-center rounded-full border border-green-100 bg-green-50 px-2.5 text-[11px] font-semibold text-green-700">
                        {categoryLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[15px] font-semibold leading-6 text-slate-900">
                    {event.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500 line-clamp-2">
                    {event.location}
                    {showOrganizerName && event.organizerName
                      ? ` ・ ${event.organizerName}`
                      : ""}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

