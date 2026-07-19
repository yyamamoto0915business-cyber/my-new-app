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
      <div className="mb-1 text-[13px] font-semibold text-[#1a1a1a]">開催形式</div>
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
                "flex items-center justify-center gap-1 rounded-[8px] border px-1 py-1.5 text-center transition",
                selected
                  ? "border-[#6BBF3E] bg-[#eef8e8] text-[#1a2818] shadow-sm"
                  : "border-[#e8e6e0] bg-white text-[#5c5a54] hover:bg-[#f5f4f0]",
              ].join(" ")}
            >
              <span className={selected ? "text-[#3a7a10]" : "text-[#888]"}>
                {ICONS[opt.value]}
              </span>
              <span className="text-[11.5px] font-semibold leading-tight">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
