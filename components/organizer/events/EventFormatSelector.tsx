"use client";

import { MapPin, Monitor, Users } from "lucide-react";
import {
  EVENT_FORMAT_OPTIONS,
  type EventFormat,
} from "@/lib/event-online";

type Props = {
  value: EventFormat;
  onChange: (value: EventFormat) => void;
};

const ICONS: Record<EventFormat, React.ReactNode> = {
  onsite: <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />,
  online: <Monitor className="h-3.5 w-3.5 shrink-0" aria-hidden />,
  hybrid: <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />,
};

export function EventFormatSelector({ value, onChange }: Props) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-semibold text-[#1f2a24]">開催形式</div>
      <div
        className="grid grid-cols-3 gap-1"
        role="radiogroup"
        aria-label="開催形式"
      >
        {EVENT_FORMAT_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={[
                "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[12px] border px-1 py-1.5 text-center transition min-[900px]:min-h-0 min-[900px]:flex-row min-[900px]:rounded-[8px]",
                selected
                  ? "border-[1.5px] border-[#173f2c] bg-[#eef4ef] text-[#173f2c]"
                  : "border-[#e6e2d6] bg-white text-[#5c5a54] hover:bg-[#f5f4f0]",
              ].join(" ")}
            >
              <span className={selected ? "text-[#173f2c]" : "text-[#9aa29c]"}>
                {ICONS[opt.value]}
              </span>
              <span className="whitespace-nowrap text-[12px] font-semibold leading-tight">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
