"use client";

import { ChevronDown, LayoutGrid, Map as MapIcon, Search } from "lucide-react";
import { PREFECTURES } from "@/lib/prefectures";
import { cn } from "@/lib/utils";
import type { TownSortMode, TownTimeRange } from "@/components/home/pc/PcTownFilterBar";
import type { BrowsePriceFilter } from "@/components/home/pc/town-browse";

export type BrowseViewMode = "card" | "map";

const CATEGORY_OPTIONS = [
  { value: "", label: "カテゴリ" },
  { value: "workshop", label: "体験" },
  { value: "food", label: "グルメ" },
  { value: "community", label: "交流会" },
  { value: "family", label: "親子" },
  { value: "music", label: "音楽" },
  { value: "sports", label: "スポーツ" },
  { value: "study", label: "学び" },
  { value: "volunteer", label: "ボランティア" },
];

type Props = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  timeRange: TownTimeRange;
  onTimeRangeChange: (value: TownTimeRange) => void;
  selectedArea: string;
  onAreaChange: (value: string) => void;
  priceFilter: BrowsePriceFilter;
  onPriceFilterChange: (value: BrowsePriceFilter) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sortMode: TownSortMode;
  onSortChange: (value: TownSortMode) => void;
  viewMode: BrowseViewMode;
  onViewModeChange: (value: BrowseViewMode) => void;
};

function FilterSelect({
  label,
  value,
  onChange,
  children,
  active,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 cursor-pointer appearance-none rounded-full border bg-white pl-3 pr-7 text-[12px] font-medium outline-none",
          active
            ? "border-[#b7d7be] text-[#1f6b3a]"
            : "border-[#d7e0d6] text-[#3d4a40] hover:border-[#b7cbb8]",
        )}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7d8d80]"
        aria-hidden
      />
    </label>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-full px-3 text-[12px] font-medium transition",
        active
          ? "bg-[#2f7d4e] text-white"
          : "border border-[#d7e0d6] bg-white text-[#3d4a40] hover:border-[#b7cbb8]",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** ヒーロー下の検索と絞り込み、カード／地図の切替 */
export function PcTownBrowseToolbar({
  searchQuery,
  onSearchQueryChange,
  timeRange,
  onTimeRangeChange,
  selectedArea,
  onAreaChange,
  priceFilter,
  onPriceFilterChange,
  selectedCategory,
  onCategoryChange,
  sortMode,
  onSortChange,
  viewMode,
  onViewModeChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-[#d7e0d6] bg-white pl-3 pr-1"
        onSubmit={(e) => e.preventDefault()}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-[#7d8d80]" aria-hidden />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="イベントやお店を検索"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[#1e3d2c] outline-none placeholder:text-[#9aa89c]"
        />
        <button
          type="submit"
          className="h-7 shrink-0 rounded-full bg-[#2f7d4e] px-3 text-[12px] font-medium text-white hover:bg-[#276844]"
        >
          検索
        </button>
      </form>

      <FilterSelect
        label="開催日"
        value={timeRange}
        onChange={(value) => onTimeRangeChange(value as TownTimeRange)}
        active={timeRange !== "all"}
      >
        <option value="all">開催日</option>
        <option value="today">今日</option>
        <option value="weekend">今週末</option>
        <option value="next_week">来週</option>
        <option value="month">今月</option>
        {timeRange === "date" ? <option value="date">日付を指定</option> : null}
      </FilterSelect>

      <FilterSelect
        label="エリア"
        value={selectedArea}
        onChange={onAreaChange}
        active={selectedArea !== ""}
      >
        <option value="">エリア</option>
        {PREFECTURES.map((prefecture) => (
          <option key={prefecture} value={prefecture}>
            {prefecture}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="料金"
        value={priceFilter}
        onChange={(value) => onPriceFilterChange(value as BrowsePriceFilter)}
        active={priceFilter !== "all"}
      >
        <option value="all">料金</option>
        <option value="free">無料</option>
        <option value="paid">有料</option>
      </FilterSelect>

      <FilterSelect
        label="カテゴリ"
        value={selectedCategory}
        onChange={onCategoryChange}
        active={selectedCategory !== ""}
      >
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="並び替え"
        value={sortMode}
        onChange={(value) => onSortChange(value as TownSortMode)}
        active={sortMode !== "recommended"}
      >
        <option value="recommended">おすすめ順</option>
        <option value="popular">人気順</option>
      </FilterSelect>

      <div className="ml-auto flex items-center gap-1.5">
        <ViewButton
          active={viewMode === "card"}
          onClick={() => onViewModeChange("card")}
          icon={<LayoutGrid className="h-3.5 w-3.5" aria-hidden />}
        >
          カード表示
        </ViewButton>
        <ViewButton
          active={viewMode === "map"}
          onClick={() => onViewModeChange("map")}
          icon={<MapIcon className="h-3.5 w-3.5" aria-hidden />}
        >
          地図表示
        </ViewButton>
      </div>
    </div>
  );
}
