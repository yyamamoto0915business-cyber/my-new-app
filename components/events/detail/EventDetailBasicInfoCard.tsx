import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import type { EventRecurrence } from "@/lib/event-recurrence";

type Props = {
  date: string;
  startTime: string;
  endTime?: string;
  recurrence?: EventRecurrence;
  recurrenceCount?: number | null;
  location: string;
  price: number;
  priceNote?: string | null;
  receptionLabel: string;
};

export function EventDetailBasicInfoCard({
  date,
  startTime,
  endTime,
  recurrence = "none",
  recurrenceCount,
  location,
  price,
  priceNote,
  receptionLabel,
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

  const rows = [
    { label: "日時", value: dateLine },
    { label: "場所", value: location },
    { label: "費用", value: priceLine },
    { label: "受付", value: receptionLabel },
  ] as const;

  return (
    <div className="rounded-xl border border-[var(--mg-line)] bg-white p-4 shadow-[0_1px_3px_rgba(44,42,40,0.04)]">
      <h3 className="text-[13px] font-semibold text-[var(--mg-ink)]">イベントの基本情報</h3>
      <dl className="mt-2.5 space-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex gap-2 text-[13px]">
            <dt className="w-11 shrink-0 text-[var(--mg-muted)]">{label}</dt>
            <dd className="min-w-0 font-medium text-[var(--mg-ink)]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
