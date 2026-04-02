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
        "h-10 rounded-full px-4 text-sm font-medium border transition-all whitespace-nowrap",
        tone === "active"
          ? "border-green-100 bg-green-50 text-green-700"
          : "border-slate-200 bg-white text-slate-600 active:bg-slate-50"
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
        "mx-4 mt-2 rounded-[24px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]",
        className
      )}
      aria-label="検索"
    >
      <div className="space-y-3">
        <div>
          <p className="text-[15px] font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
          <Search className="h-4 w-4 text-slate-400" aria-hidden />
          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
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
            className="h-11 flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors active:bg-slate-50"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            絞り込み
          </button>
          <button
            type="button"
            onClick={onToggleMap}
            className="h-11 flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors active:bg-slate-50"
          >
            {isMap ? (
              <>
                <List className="h-4 w-4" aria-hidden />
                一覧
              </>
            ) : (
              <>
                <Map className="h-4 w-4" aria-hidden />
                地図
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

