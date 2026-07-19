"use client";

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
  compact?: boolean;
};

export function RecurrenceSelector({
  value,
  count,
  onChange,
  onCountChange,
  compact = false,
}: Props) {
  const showCount = value !== "none";
  const effectiveCount = normalizeRecurrenceCount(count, value) ?? DEFAULT_RECURRENCE_COUNT;

  const handlePatternChange = (next: EventRecurrence) => {
    onChange(next);
    if (next === "none") {
      onCountChange(null);
    } else {
      onCountChange(normalizeRecurrenceCount(count, next));
    }
  };

  const activeOption = EVENT_RECURRENCE_OPTIONS.find((o) => o.value === value);

  return (
    <div className="rounded-[10px] border border-[#e8e6e0] bg-white" role="radiogroup" aria-label="開催パターン">
      <div className={`grid grid-cols-3 gap-1 ${compact ? "p-1" : "p-1.5"}`}>
        {EVENT_RECURRENCE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handlePatternChange(opt.value)}
              className={[
                "rounded-[8px] px-1 text-center transition",
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
            className="min-w-0 flex-1 rounded-[8px] border border-[#e8e6e0] bg-white px-2 py-1.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#2B3A6B]"
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
