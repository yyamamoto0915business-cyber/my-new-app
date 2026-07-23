"use client";

import { useEffect, useState } from "react";
import {
  EventFormError,
  EventFormHint,
  EventFormLabel,
  eventFormInp,
} from "@/components/organizer/events/event-form-ui";

const PRICE_PRESETS = [
  { label: "無料", value: 0 },
  { label: "500", value: 500 },
  { label: "1,000", value: 1000 },
  { label: "3,000", value: 3000 },
  { label: "5,000", value: 5000 },
] as const;

function priceToText(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return "";
  return String(Math.floor(price));
}

/** 全角数字・全角カンマなどを半角数字のみに正規化 */
function normalizePriceDigits(raw: string): string {
  return raw
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[^\d]/g, "");
}

function textToPrice(text: string): number {
  if (text.trim() === "") return 0;
  const n = Number.parseInt(text, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

type EventPriceInputProps = {
  value: number;
  onChange: (price: number) => void;
  error?: string;
  hint?: string;
  inputClassName?: string;
  showLabel?: boolean;
};

export function EventPriceInput({
  value,
  onChange,
  error,
  hint = "空欄か 0 で無料。有料の場合はStripe設定が必要です",
  inputClassName = eventFormInp,
  showLabel = true,
}: EventPriceInputProps) {
  const [text, setText] = useState(() => priceToText(value));

  useEffect(() => {
    setText((prev) => (textToPrice(prev) === value ? prev : priceToText(value)));
  }, [value]);

  const applyPrice = (next: number, nextText?: string) => {
    setText(nextText ?? priceToText(next));
    onChange(next);
  };

  const current = textToPrice(text);

  return (
    <div className="min-w-0">
      {showLabel ? <EventFormLabel label="参加費（円）" /> : null}
      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="よく使う金額">
        {PRICE_PRESETS.map((preset) => {
          const pressed =
            preset.value === 0
              ? text.trim() === "" || current === 0
              : current === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              aria-pressed={pressed}
              onClick={() =>
                applyPrice(
                  preset.value,
                  preset.value === 0 ? "" : String(preset.value)
                )
              }
              className={`min-h-9 rounded-full border px-3 py-1.5 text-[12.5px] transition ${
                pressed
                  ? "border-[#2B3A6B] bg-[#eef0f6] font-semibold text-[#2B3A6B]"
                  : "border-[#e8e6e0] bg-white text-[#1a1a1a] hover:border-[#cfcbc2]"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <input
          name="price"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="例：1500"
          value={text}
          aria-invalid={Boolean(error)}
          onChange={(e) => {
            const cleaned = normalizePriceDigits(e.target.value);
            setText(cleaned);
            onChange(textToPrice(cleaned));
          }}
          className={`${inputClassName} ${error ? "!border-[#E8708A]" : ""}`}
        />
        <span className="shrink-0 text-[13px] text-[#5c5a54]">円</span>
      </div>
      {hint ? <EventFormHint text={hint} /> : null}
      <EventFormError msg={error} />
    </div>
  );
}
