"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

type Props = {
  bio: string;
};

export function OrganizerAboutTeaser({ bio }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="flex w-full items-start gap-2.5 text-left lg:gap-3"
      aria-expanded={expanded}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f5e4] lg:h-10 lg:w-10">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3a8040"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[13px] font-semibold text-[#1a2818] lg:mb-1 lg:text-[13.5px]">
          主催者について
        </div>
        <p
          className={`text-[12px] leading-[1.55] text-[#607060] lg:text-[12.5px] lg:leading-[1.65] ${
            expanded ? "whitespace-pre-wrap" : "line-clamp-2"
          }`}
        >
          {bio}
        </p>
      </div>
      <ChevronRight
        className={`mt-1 h-4 w-4 shrink-0 text-[#98a898] transition-transform ${
          expanded ? "rotate-90" : ""
        }`}
        aria-hidden
      />
    </button>
  );
}
