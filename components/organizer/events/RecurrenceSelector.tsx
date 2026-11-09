"use client";

import { useState } from "react";

import {
  DEFAULT_RECURRENCE_COUNT,
  EVENT_RECURRENCE_OPTIONS,
  RECURRENCE_COUNT_OPTIONS,
  normalizeRecurrenceCount,
  type EventRecurrence,
} from "@/lib/event-recurrence";

type Props = {
  value: EventRecurrence;
  count: number | null | undefined;
  onChange: (value: EventRecurrence) => void;
  onCountChange: (count: number | null) => void;
  /** 開始日（期間の終了日の初期値・下限に使う） */
  startDate?: string;
  /** 期間イベントの終了日。入っていれば「期間」を選んでいる */
  endDate?: string | null;
  onEndDateChange?: (endDate: string | null) => void;
  endDateError?: string;
  compact?: boolean;
};

type Pattern = EventRecurrence | "period";

const PATTERN_OPTIONS: ReadonlyArray<{ value: Pattern; label: string; description: string }> = [
  ...EVENT_RECURRENCE_OPTIONS.slice(0, 1),
  { value: "period", label: "期間", description: "開始日から終了日まで、毎日開催" },
  ...EVENT_RECURRENCE_OPTIONS.slice(1),
];

/** "YYYY-MM-DD" に日数を足す */
function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function RecurrenceSelector({
  value,
  count,
  onChange,
  onCountChange,
  startDate,
  endDate,
  onEndDateChange,
  endDateError,
  compact = false,
}: Props) {
  const periodEnabled = Boolean(onEndDateChange);
  // 終了日を空にしても「期間」の選択は残す
  const [periodSelected, setPeriodSelected] = useState(Boolean(endDate));
  const pattern: Pattern =
    periodEnabled && value === "none" && (periodSelected || Boolean(endDate)) ? "period" : value;
  const showCount = pattern === "weekly" || pattern === "monthly";
  const effectiveCount = normalizeRecurrenceCount(count, value) ?? DEFAULT_RECURRENCE_COUNT;

  const handlePatternChange = (next: Pattern) => {
    if (next === "period") {
      setPeriodSelected(true);
      onChange("none");
      onCountChange(null);
      // 終了日の初期値は開始日の1週間後
      onEndDateChange?.(endDate || (startDate ? addDaysYmd(startDate, 7) : null));
      return;
    }
    setPeriodSelected(false);
    onEndDateChange?.(null);
    onChange(next);
    if (next === "none") {
      onCountChange(null);
    } else {
      onCountChange(normalizeRecurrenceCount(count, next));
    }
  };

  const options = periodEnabled ? PATTERN_OPTIONS : EVENT_RECURRENCE_OPTIONS;
  const activeOption = options.find((o) => o.value === pattern);

  return (
    <div className="rounded-[10px] border border-[#e8e6e0] bg-white" role="radiogroup" aria-label="開催パターン">
      <div className={`grid ${options.length === 4 ? "grid-cols-4" : "grid-cols-3"} gap-1 ${compact ? "p-1" : "p-1.5"}`}>
        {options.map((opt) => {
          const selected = pattern === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handlePatternChange(opt.value)}
              className={[
                "min-h-[40px] rounded-[8px] px-1 text-center transition min-[900px]:min-h-0",
                compact ? "py-1.5" : "py-2",
                selected
                  ? "bg-[#2B3A6B] text-white shadow-sm"
                  : "text-[#5c5a54] hover:bg-[#f5f4f0]",
              ].join(" ")}
            >
              <span
                className={`block font-semibold leading-tight ${
                  compact ? "text-[12px]" : "text-[13px]"
                }`}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className={`border-t border-[#f0eeea] ${compact ? "px-2 py-1" : "px-2.5 py-2"}`}>
        <p className={`leading-snug text-[#888] ${compact ? "text-[10.5px]" : "text-[11px]"}`}>
          {activeOption?.description}
          {showCount ? ` · 合計${effectiveCount}回（初回含む）` : ""}
        </p>
      </div>

      {pattern === "period" && (
        <div
          className={`flex flex-wrap items-center gap-2 border-t border-[#f0eeea] bg-[#fafaf8] ${
            compact ? "px-2 py-1.5" : "px-2.5 py-2"
          }`}
        >
          <label htmlFor="eventEndDate" className="shrink-0 text-[12px] font-medium text-[#1a1a1a]">
            終了日
            <span className="ml-1 text-[10px] font-semibold text-[#c8a84b]">必須</span>
          </label>
          <input
            id="eventEndDate"
            type="date"
            value={endDate ?? ""}
            min={startDate || undefined}
            onChange={(e) => onEndDateChange?.(e.target.value || null)}
            className={`min-w-0 flex-1 rounded-[8px] border bg-white px-2 py-1.5 text-[16px] min-[900px]:text-[13px] text-[#1a1a1a] outline-none focus:border-[#2B3A6B] ${
              endDateError ? "border-[#e05060]" : "border-[#e8e6e0]"
            }`}
          />
          {endDateError ? (
            <p className="w-full text-[11px] text-[#e05060]">{endDateError}</p>
          ) : (
            <p className="w-full text-[10.5px] leading-snug text-[#888]">
              時刻は毎日の開催時間です。いつでも参加できる企画は、開始時刻を 0:00 にしても大丈夫です。
            </p>
          )}
        </div>
      )}

      {showCount && (
        <div
          className={`flex items-center gap-2 border-t border-[#f0eeea] bg-[#fafaf8] ${
            compact ? "px-2 py-1.5" : "px-2.5 py-2"
          }`}
        >
          <label htmlFor="recurrenceCount" className="shrink-0 text-[12px] font-medium text-[#1a1a1a]">
            繰り返し
            <span className="ml-1 text-[10px] font-semibold text-[#c8a84b]">必須</span>
          </label>
          <select
            id="recurrenceCount"
            value={effectiveCount}
            onChange={(e) => onCountChange(Number(e.target.value))}
            className="min-w-0 flex-1 rounded-[8px] border border-[#e8e6e0] bg-white px-2 py-1.5 text-[16px] min-[900px]:text-[13px] text-[#1a1a1a] outline-none focus:border-[#2B3A6B]"
          >
            {RECURRENCE_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}回
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
