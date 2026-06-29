import type { Event } from "@/lib/db/types";
import { EventDetailFlyerImage } from "@/components/events/EventDetailFlyerImage";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getEventStatus, type EventStatus } from "@/lib/events";
import {
  CalendarDays,
  CircleUserRound,
  JapaneseYen,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

function participationStatusMessage(
  participationMode: Event["participationMode"],
  requiresRegistration?: boolean
): string {
  const mode =
    participationMode ?? (requiresRegistration ? "required" : "none");
  if (mode === "optional") return "当日そのまま参加できます";
  if (mode === "none") return "当日そのまま参加できます";
  return "事前申込が必要です";
}

export function EventDetailPcHero({ event }: Props) {
  const status = getEventStatus(event);
  const isAvailable = status === "available";
  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;
  const reception = receptionLabel(status, isAvailable);

  const dateLine = formatEventScheduleLabel(
    event.date,
    event.startTime,
    event.endTime,
    event.recurrence ?? "none",
    event.recurrenceCount
  );

  const priceLine =
    event.price === 0
      ? "無料"
      : `¥${Number(event.price).toLocaleString("ja-JP")}`;
  const priceSuffix = event.priceNote ? `（${event.priceNote}）` : "";

  const dayMessage = participationStatusMessage(
    event.participationMode,
    event.requiresRegistration
  );

  return (
    <section
      aria-label="イベント概要"
      className="hidden min-[900px]:block overflow-hidden rounded-2xl border border-[var(--mg-line)] bg-white shadow-[0_1px_4px_rgba(44,42,40,0.05)]"
    >
      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <EventDetailFlyerImage
          imageUrl={event.imageUrl}
          alt={event.title}
          priority
          variant="pcHero"
        />

        <div className="flex flex-col justify-center px-5 py-4">
          <div className="flex flex-wrap gap-1.5">
            {categoryLabel ? (
              <span className="inline-flex items-center rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                {categoryLabel}
              </span>
            ) : null}
            <span className="inline-flex items-center rounded-full border border-[var(--accent)]/35 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
              {reception}
            </span>
          </div>

          <h1 className="mt-2.5 text-[22px] font-bold leading-snug tracking-tight text-[var(--mg-ink)]">
            {event.title}
          </h1>

          {event.description ? (
            <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-[var(--mg-muted)]">
              {event.description}
            </p>
          ) : null}

          <ul className="mt-3 space-y-2">
            <li className="flex gap-2 text-[13px]">
              <CalendarDays
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                aria-hidden
              />
              <span className="font-medium text-[var(--mg-ink)]">{dateLine}</span>
            </li>
            <li className="flex gap-2 text-[13px]">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                aria-hidden
              />
              <span className="min-w-0">
                <span className="font-medium text-[var(--mg-ink)]">{event.location}</span>
                {event.address ? (
                  <span className="mt-0.5 block text-[12px] text-[var(--mg-muted)] line-clamp-1">
                    {event.address}
                  </span>
                ) : null}
              </span>
            </li>
            <li className="flex gap-2 text-[13px]">
              <JapaneseYen
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                aria-hidden
              />
              <span className="font-medium text-[var(--mg-ink)]">
                {priceLine}
                {priceSuffix ? (
                  <span className="font-normal text-[var(--mg-muted)]"> {priceSuffix}</span>
                ) : null}
              </span>
            </li>
            {event.organizerName ? (
              <li className="flex gap-2 text-[13px]">
                <CircleUserRound
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                  aria-hidden
                />
                <span className="font-medium text-[var(--mg-ink)]">{event.organizerName}</span>
              </li>
            ) : null}
          </ul>

          <div
            className={cn(
              "mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium",
              isAvailable ? "bg-[#fff8e6] text-[#5c4a20]" : "bg-zinc-100 text-zinc-600"
            )}
          >
            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden />
            <span>
              {dayMessage}
              {isAvailable ? ` / ${reception}` : ""}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
