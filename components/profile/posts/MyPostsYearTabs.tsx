"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  years: number[];
  selectedYear: number;
  onSelect: (year: number) => void;
};

export function MyPostsYearTabs({ years, selectedYear, onSelect }: Props) {
  // 表示は昇順（左→右で古い→新しい）
  const ordered = [...years].sort((a, b) => a - b);
  const idx = ordered.indexOf(selectedYear);
  const canPrev = idx > 0;
  const canNext = idx >= 0 && idx < ordered.length - 1;

  return (
    <nav className="my-album-years" aria-label="年で切り替え">
      <button
        type="button"
        className="my-album-years__nav"
        onClick={() => canPrev && onSelect(ordered[idx - 1])}
        disabled={!canPrev}
        aria-label="前の年"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      <div className="my-album-years__track" role="tablist">
        {ordered.map((year) => {
          const active = year === selectedYear;
          return (
            <button
              key={year}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(year)}
              className={cn("my-album-years__tab", active && "is-active")}
            >
              {year}年
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="my-album-years__nav"
        onClick={() => canNext && onSelect(ordered[idx + 1])}
        disabled={!canNext}
        aria-label="次の年"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
