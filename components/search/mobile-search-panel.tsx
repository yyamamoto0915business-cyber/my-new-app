"use client";

import { Search, SlidersHorizontal, Map, List } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipTone = "inactive" | "active";

function Chip({
  label,
  tone = "inactive",
  onClick,
}: {
  label: string;
  tone?: ChipTone;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-3.5 text-[12px] font-medium border transition-all whitespace-nowrap touch-manipulation",
        tone === "active"
          ? "border-[#b8d0c8] bg-[#eef6f2] text-[#1e3020]"
          : "border-[#ccc4b4] bg-white text-[#3a3428] active:bg-[#f0ece4]"
      )}
    >
      {label}
    </button>
  );
}

export type MobileSearchPanelDateRange =
  | "all"
  | "today"
  | "week"
  | "weekend"
  | "month"
  | "3months";

function getDateRangeLabel(v: MobileSearchPanelDateRange): string {
  if (v === "today") return "今日";
  if (v === "week") return "今週";
  if (v === "weekend") return "週末";
  if (v === "month") return "今月";
  if (v === "3months") return "3ヶ月";
  return "すべて";
}

type Props = {
  className?: string;
  title?: string;
  description?: string;

  searchQuery: string;
  onSearchQueryChange: (v: string) => void;

  regionLabel: string;
  dateRange: MobileSearchPanelDateRange;
  categoryLabel: string;

  onOpenFilters: () => void;
  onToggleMap: () => void;
  isMap: boolean;
};

export function MobileSearchPanel({
  className,
  title = "イベントを探す",
  description = "地域・日付・カテゴリで、やさしく絞り込めます。",
  searchQuery,
  onSearchQueryChange,
  regionLabel,
  dateRange,
  categoryLabel,
  onOpenFilters,
  onToggleMap,
  isMap,
}: Props) {
  return (
    <section
      className={cn(
        "mx-4 mt-2 overflow-hidden rounded-[20px] border border-[#ccc4b4] bg-[#faf8f2]",
        className
      )}
      aria-label="検索"
    >
      {/* ダークヘッダー帯 */}
      <div className="relative overflow-hidden px-4 py-3" style={{ background: "#1e3020" }}>
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <pattern id="msearch-shippou" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="8" fill="none" stroke="white" strokeWidth="0.6" />
              <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="0.6" />
              <circle cx="16" cy="0" r="8" fill="none" stroke="white" strokeWidth="0.6" />
              <circle cx="0" cy="16" r="8" fill="none" stroke="white" strokeWidth="0.6" />
              <circle cx="16" cy="16" r="8" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#msearch-shippou)" opacity="0.07" />
        </svg>
        <p
          className="relative text-[14px] font-bold text-[#f4f0e8]"
          style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
        >
          {title}
        </p>
        <p className="relative mt-0.5 text-[11px] text-[#a8c8a4]">{description}</p>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex h-11 items-center gap-3 rounded-full border border-[#ccc4b4] bg-white px-4">
          <Search className="h-4 w-4 shrink-0 text-[#a8a090]" aria-hidden />
          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-[#3a3428] placeholder:text-[#a8a090] outline-none"
            placeholder="地域やイベント名で探す"
            aria-label="地域やイベント名で探す"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip
            label={`地域：${regionLabel}`}
            tone={regionLabel !== "全国" ? "active" : "inactive"}
            onClick={onOpenFilters}
          />
          <Chip
            label={`日付：${getDateRangeLabel(dateRange)}`}
            tone={dateRange !== "all" ? "active" : "inactive"}
            onClick={onOpenFilters}
          />
          <Chip
            label={categoryLabel}
            tone={categoryLabel !== "カテゴリ：すべて" ? "active" : "inactive"}
            onClick={onOpenFilters}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex h-10 flex-1 touch-manipulation items-center justify-center gap-2 rounded-full border border-[#ccc4b4] bg-white text-[12px] font-medium text-[#3a3428] transition-colors active:bg-[#f0ece4]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            絞り込み
          </button>
          <button
            type="button"
            onClick={onToggleMap}
            className="inline-flex h-10 flex-1 touch-manipulation items-center justify-center gap-2 rounded-full border border-[#ccc4b4] bg-white text-[12px] font-medium text-[#3a3428] transition-colors active:bg-[#f0ece4]"
          >
            {isMap ? (
              <>
                <List className="h-3.5 w-3.5" aria-hidden />
                一覧
              </>
            ) : (
              <>
                <Map className="h-3.5 w-3.5" aria-hidden />
                地図
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

