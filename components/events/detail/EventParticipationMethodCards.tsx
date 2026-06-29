import {
  CalendarDays,
  ClipboardList,
  MapPin,
  JapaneseYen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import type { EventRecurrence } from "@/lib/event-recurrence";

type Props = {
  location: string;
  address?: string;
  date: string;
  startTime: string;
  endTime?: string;
  recurrence?: EventRecurrence;
  recurrenceCount?: number | null;
  receptionLabel: string;
  price: number;
  priceNote?: string | null;
  /** row/grid/inline = カードグリッド、list = 1枚にまとめたコンパクト行 */
  layout?: "row" | "grid" | "inline" | "list";
  compact?: boolean;
  className?: string;
};

const cardClassBase =
  "flex flex-col items-start rounded-lg border border-[var(--ed-line)] bg-white";

export function EventParticipationMethodCards({
  location,
  address,
  date,
  startTime,
  endTime,
  recurrence = "none",
  recurrenceCount,
  receptionLabel,
  price,
  priceNote,
  layout = "row",
  compact = false,
  className,
}: Props) {
  const dateLine = formatEventScheduleLabel(
    date,
    startTime,
    endTime,
    recurrence,
    recurrenceCount
  );
  const priceLine =
    price === 0
      ? "無料"
      : `¥${Number(price).toLocaleString("ja-JP")}${priceNote ? `（${priceNote}）` : ""}`;

  const items = [
    {
      icon: MapPin,
      label: "場所",
      value: location,
      subValue: address,
    },
    {
      icon: CalendarDays,
      label: "日時",
      value: dateLine,
    },
    {
      icon: ClipboardList,
      label: "受付",
      value: receptionLabel,
    },
    {
      icon: JapaneseYen,
      label: "費用",
      value: priceLine,
    },
  ] satisfies { icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string; value: string; subValue?: string }[];

  if (layout === "list") {
    return (
      <div
        className={cn(
          "ed-participation-card divide-y divide-[var(--ed-line)] overflow-hidden",
          className
        )}
      >
        {items.map(({ icon: Icon, label, value, subValue }) => (
          <div key={label} className="ed-participation-row flex gap-3 px-3.5 py-2.5">
            <span className="ed-content-card-icon mt-0.5">
              <Icon className="h-3.5 w-3.5 stroke-[1.75]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium tracking-wide text-[var(--ed-muted,var(--mg-muted))]">
                {label}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold leading-snug text-[var(--ed-ink,var(--mg-ink))]">
                {value}
              </p>
              {subValue ? (
                <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--ed-muted,var(--mg-muted))]">
                  {subValue}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const gridClass =
    layout === "inline"
      ? "grid grid-cols-4 gap-2"
      : layout === "grid"
        ? "grid grid-cols-2 gap-2"
        : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4";

  const cardClass = cn(
    cardClassBase,
    layout === "inline"
      ? "min-h-0 items-center p-2 text-center"
      : compact
        ? "min-h-[68px] p-2.5"
        : "min-h-[100px] p-3.5"
  );

  return (
    <div className={cn(gridClass, className)}>
      {items.map(({ icon: Icon, label, value, subValue }) => (
        <div key={label} className={cardClass}>
          <Icon
            className={cn(
              "text-[var(--accent)]",
              layout === "inline" ? "h-5 w-5" : compact ? "h-4 w-4" : "h-5 w-5"
            )}
            aria-hidden
          />
          <p
            className={cn(
              "font-medium text-[var(--mg-muted)]",
              layout === "inline" ? "mt-1 text-[10px]" : "mt-1.5 text-[10px]"
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "font-semibold leading-snug text-[var(--mg-ink)]",
              layout === "inline"
                ? "mt-0.5 text-[11px] line-clamp-2"
                : compact
                  ? "mt-0.5 text-[12px] line-clamp-2"
                  : "mt-0.5 text-sm"
            )}
          >
            {value}
          </p>
          {subValue ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--mg-muted)]">
              {subValue}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
