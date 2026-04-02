import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { formatEventDateTime } from "@/lib/format-date";
import { CalendarDays, MapPin } from "lucide-react";
import { getEventStatus, type EventStatus } from "@/lib/events";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";
import { cn } from "@/lib/utils";

type Props = {
  event: Event;
  className?: string;
};

function receptionLabel(status: EventStatus, isAvailable: boolean): string {
  if (!isAvailable) {
    if (status === "ended") return "終了";
    if (status === "full") return "満員";
  }
  return "参加受付中";
}

export function EventInfoCard({ event, className }: Props) {
  const status = getEventStatus(event);
  const isAvailable = status === "available";
  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;
  const reception = receptionLabel(status, isAvailable);

  const dateLine = `${formatEventDateTime(event.date, event.startTime)}${
    event.endTime ? ` 〜 ${event.endTime}` : ""
  }`;

  return (
    <section
      aria-label="イベントの基本情報"
      className={cn(
        "overflow-hidden rounded-[22px] border border-[var(--mg-line)] bg-white shadow-[var(--mg-shadow)]",
        className
      )}
    >
      <div className="relative aspect-[16/10] w-full bg-slate-100">
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />
      </div>

      <div className="p-5">
        {categoryLabel ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--mg-muted)]">
            {categoryLabel}
          </p>
        ) : null}

        <h1 className="text-xl font-bold leading-snug tracking-tight text-[var(--mg-ink)]">
          {event.title}
        </h1>

        {event.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--mg-muted)]/95">
            {event.description}
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          <div className="flex gap-3">
            <CalendarDays
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--mg-muted)]">日時</p>
              <p className="mt-1 text-[15px] font-semibold leading-snug text-[var(--mg-ink)] break-words">
                {dateLine}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <MapPin
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--mg-muted)]">場所</p>
              <p className="mt-1 text-[15px] font-semibold leading-snug text-[var(--mg-ink)] break-words">
                {event.location}
                {event.address ? (
                  <span className="mt-1 block text-sm font-normal leading-relaxed text-[var(--mg-muted)]">
                    {event.address}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {event.price === 0 ? (
            <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              無料
            </span>
          ) : (
            <span className="inline-flex max-w-full items-center rounded-full border border-[var(--mg-line)] bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-[var(--mg-ink)]">
              <span className="truncate">
                ¥{Number(event.price).toLocaleString("ja-JP")}
                {event.priceNote ? `（${event.priceNote}）` : ""}
              </span>
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
              isAvailable
                ? "border-emerald-100 bg-emerald-50/90 text-emerald-900"
                : status === "ended"
                  ? "border-zinc-200 bg-zinc-100 text-zinc-600"
                  : "border-amber-100 bg-amber-50 text-amber-900"
            )}
          >
            {reception}
          </span>
        </div>
      </div>
    </section>
  );
}
