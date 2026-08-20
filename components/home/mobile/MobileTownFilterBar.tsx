"use client";

import { ChevronDown } from "lucide-react";
import { PREFECTURES } from "@/lib/prefectures";
import type {
  TownTimeRange,
  TownSortMode,
} from "@/components/home/pc/PcTownFilterBar";
import { cn } from "@/lib/utils";

const ACCENT = "#E66B27";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "community", label: "まつり・イベント" },
  { value: "sports", label: "スポーツ・健康" },
  { value: "workshop", label: "体験・ワークショップ" },
  { value: "study", label: "学び・講座" },
  { value: "music", label: "音楽・ライブ" },
  { value: "volunteer", label: "ボランティア" },
];

type Props = {
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
  selectedArea: string;
  onAreaChange: (v: string) => void;
  timeRange: TownTimeRange;
  onTimeRangeChange: (v: TownTimeRange) => void;
  sortMode: TownSortMode;
  onSortChange: (v: TownSortMode) => void;
  onReset: () => void;
  isDefault: boolean;
};

function SelectChip({
  value,
  onChange,
  active,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 cursor-pointer appearance-none rounded-full border bg-white pl-3 pr-7 text-[11px] font-medium outline-none transition",
          active
            ? "border-[#e0b890] text-[#b56a2e]"
            : "border-[#e5ddd2] text-[#5a4a38]",
        )}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#9a8a78]"
        aria-hidden
      />
    </div>
  );
}

/** まちの情報 モバイル：カテゴリ・地域・期間・並びを1行に集約したフィルタ */
export function MobileTownFilterBar({
  selectedCategory,
  onCategoryChange,
  selectedArea,
  onAreaChange,
  timeRange,
  onTimeRangeChange,
  sortMode,
  onSortChange,
  onReset,
  isDefault,
}: Props) {
  return (
    <section
      aria-label="絞り込み"
      className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-0.5 scrollbar-hide"
    >
      <button
        type="button"
        onClick={onReset}
        className={cn(
          "h-8 shrink-0 rounded-full border px-3.5 text-[11px] font-medium transition",
          isDefault
            ? "border-transparent text-white"
            : "border-[#e5ddd2] bg-white text-[#5a4a38]",
        )}
        style={isDefault ? { background: ACCENT } : undefined}
      >
        すべて
      </button>

      <SelectChip
        value={selectedCategory}
        onChange={onCategoryChange}
        active={selectedCategory !== ""}
      >
        <option value="">カテゴリ</option>
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </SelectChip>

      <SelectChip
        value={selectedArea}
        onChange={onAreaChange}
        active={selectedArea !== ""}
      >
        <option value="">地域</option>
        {PREFECTURES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </SelectChip>

      <SelectChip
        value={timeRange}
        onChange={(v) => onTimeRangeChange(v as TownTimeRange)}
        active={timeRange !== "all"}
      >
        <option value="all">期間</option>
        <option value="today">今日</option>
        <option value="weekend">今週末</option>
      </SelectChip>

      <SelectChip
        value={sortMode}
        onChange={(v) => onSortChange(v as TownSortMode)}
        active={sortMode !== "recommended"}
      >
        <option value="recommended">おすすめ順</option>
        <option value="popular">人気順</option>
      </SelectChip>
    </section>
  );
}
