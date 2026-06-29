import { formatEventDate, formatEventDateTime, formatTimeToHm } from "@/lib/format-date";

export type EventRecurrence = "none" | "weekly" | "monthly";

export const DEFAULT_RECURRENCE_COUNT = 4;

/** 繰り返し回数の選択肢（初回を含む合計回数） */
export const RECURRENCE_COUNT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12] as const;

export const EVENT_RECURRENCE_OPTIONS: ReadonlyArray<{
  value: EventRecurrence;
  label: string;
  description: string;
}> = [
  { value: "none", label: "単発", description: "指定した日のみ開催" },
  { value: "weekly", label: "毎週", description: "同じ曜日・時間で開催" },
  { value: "monthly", label: "毎月", description: "毎月同じ日に開催" },
];

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

export function normalizeEventRecurrence(value: unknown): EventRecurrence {
  if (value === "weekly" || value === "monthly") return value;
  return "none";
}

/** 繰り返し回数を正規化（単発は null、毎週・毎月は 2〜52） */
export function normalizeRecurrenceCount(
  value: unknown,
  recurrence: EventRecurrence
): number | null {
  if (recurrence === "none") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 2) return DEFAULT_RECURRENCE_COUNT;
  return Math.min(52, Math.max(2, Math.round(n)));
}

export function getRecurrenceLabel(recurrence: EventRecurrence | undefined): string {
  return EVENT_RECURRENCE_OPTIONS.find((o) => o.value === (recurrence ?? "none"))?.label ?? "単発";
}

export function formatRecurrenceSummary(
  recurrence: EventRecurrence | undefined,
  count: number | null | undefined
): string | null {
  if (!recurrence || recurrence === "none") return null;
  const n = count ?? DEFAULT_RECURRENCE_COUNT;
  if (recurrence === "weekly") return `毎週開催（全${n}回）`;
  return `毎月開催（全${n}回）`;
}

/** 一覧・確認画面向けの日時表示（繰り返し設定を反映） */
export function formatEventScheduleLabel(
  date: string,
  startTime: string,
  endTime?: string,
  recurrence: EventRecurrence = "none",
  recurrenceCount?: number | null
): string {
  const start = formatTimeToHm(startTime);
  const end = formatTimeToHm(endTime);
  const timeRange = end ? `${start}〜${end}` : start;
  if (!date) return "—";

  const count = recurrenceCount ?? DEFAULT_RECURRENCE_COUNT;
  const countLabel = `全${count}回`;

  if (recurrence === "weekly") {
    const [y, m, d] = date.split("-").map(Number);
    const w = WEEKDAY[new Date(y, m - 1, d).getDay()];
    return `毎週${w}曜 ${timeRange}（${countLabel}・初回 ${formatEventDate(date)}）`;
  }

  if (recurrence === "monthly") {
    const day = Number(date.split("-")[2]);
    return `毎月${day}日 ${timeRange}（${countLabel}・初回 ${formatEventDate(date)}）`;
  }

  return end
    ? `${formatEventDateTime(date, startTime)}〜${end}`
    : formatEventDateTime(date, startTime);
}
