"use client";

import { CircleCheck, CalendarDays } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { EventDetailFlyerImage } from "@/components/events/EventDetailFlyerImage";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";

type Props = {
  event: Event;
  receptionLabel: string;
  participationReception: string;
  isAvailable: boolean;
  /** 外枠カード内に埋め込む場合 */
  embedded?: boolean;
};

export function EventDetailPcHeroCard({
  event,
  receptionLabel,
  participationReception,
  isAvailable,
  embedded = false,
}: Props) {
  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;

  const scheduleLabel = formatEventScheduleLabel(
    event.date,
    event.startTime,
    event.endTime,
    event.recurrence ?? "none",
    event.recurrenceCount
  );

  return (
    <section
      aria-label="イベント概要"
      className={
        embedded
          ? undefined
          : "overflow-hidden rounded-2xl border border-[#e8edd8] bg-white shadow-[0_1px_4px_rgba(44,42,40,0.05)]"
      }
    >
      <div className="grid grid-cols-[minmax(200px,36%)_minmax(0,1fr)] items-stretch">
        <div className="relative min-h-[168px] border-r border-[#e8edd8] bg-[#f0f4f0]">
          <EventDetailFlyerImage
            imageUrl={event.imageUrl}
            alt={event.title}
            priority
            variant="pcHero"
            className="absolute inset-0 h-full w-full"
          />
          {isAvailable ? (
            <div className="absolute bottom-2 left-2 z-10 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-[#348b38]/92 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
              <CircleCheck className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{participationReception}</span>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-2 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {categoryLabel ? (
              <span className="inline-flex items-center rounded-full bg-[#eef5ef] px-2 py-0.5 text-[11px] font-medium text-[#348b38]">
                {categoryLabel}
              </span>
            ) : null}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                isAvailable
                  ? "border-[#348b38]/35 bg-white text-[#348b38]"
                  : "border-[#e0e8d4] bg-[#f5f8f5] text-[#6a7068]"
              }`}
            >
              {receptionLabel}
            </span>
          </div>

          <h1 className="text-[19px] font-bold leading-[1.35] tracking-[-0.02em] text-[#1a2818]">
            {event.title}
          </h1>

          <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#526448]">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#348b38]" aria-hidden />
            <span className="line-clamp-1">{scheduleLabel}</span>
          </p>

          {event.description ? (
            <p className="line-clamp-2 text-[12px] leading-[1.6] text-[#6a7068]">
              {event.description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
