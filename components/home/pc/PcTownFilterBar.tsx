"use client";

import { ChevronDown } from "lucide-react";
import { PREFECTURES } from "@/lib/prefectures";
import { cn } from "@/lib/utils";

export type TownTimeRange = "all" | "today" | "weekend";
export type TownSortMode = "recommended" | "popular";

type Props = {
  selectedArea: string;
  onAreaChange: (v: string) => void;
  timeRange: TownTimeRange;
  onTimeRangeChange: (v: TownTimeRange) => void;
  sortMode: TownSortMode;
  onSortChange: (v: TownSortMode) => void;
  showEnded: boolean;
  onShowEndedChange: (v: boolean) => void;
  /** 「すべて」チップ：フィルタをリセット */
  onReset: () => void;
  /** フィルタ未適用（＝すべて状態）か */
  isDefault: boolean;
};

const ACCENT = "#E66B27";

function SelectField({
  value,
  onChange,
  children,
  active,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 cursor-pointer appearance-none rounded-full border bg-white pl-3 pr-7 text-[12px] font-medium outline-none transition",
          active
            ? "border-[#e0b890] text-[#b56a2e]"
            : "border-[#e5ddd2] text-[#5a4a38] hover:border-[#d4b898]",
        )}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9a8a78]"
        aria-hidden
      />
    </div>
  );
}

/** まちの情報：1行フィルタバー（種別チップ相当のリセット＋地域・時間・並び＋終了トグル） */
export function PcTownFilterBar({
  selectedArea,
  onAreaChange,
  timeRange,
  onTimeRangeChange,
  sortMode,
  onSortChange,
  showEnded,
  onShowEndedChange,
  onReset,
  isDefault,
}: Props) {
  return (
    <section
      aria-label="絞り込み"
      className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#e8ebe6] bg-white px-3 py-2"
    >
      <button
        type="button"
        onClick={onReset}
        className={cn(
          "h-8 rounded-full border px-3.5 text-[12px] font-medium transition",
          isDefault
            ? "border-transparent text-white"
            : "border-[#e5ddd2] bg-white text-[#5a4a38] hover:border-[#d4b898]",
        )}
        style={isDefault ? { background: ACCENT } : undefined}
      >
        すべて
      </button>

      <SelectField
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
      </SelectField>

      <SelectField
        value={timeRange}
        onChange={(v) => onTimeRangeChange(v as TownTimeRange)}
        active={timeRange !== "all"}
      >
        <option value="all">期間</option>
        <option value="today">今日</option>
        <option value="weekend">今週末</option>
      </SelectField>

      <SelectField
        value={sortMode}
        onChange={(v) => onSortChange(v as TownSortMode)}
        active={sortMode !== "recommended"}
      >
        <option value="recommended">おすすめ順</option>
        <option value="popular">人気順</option>
      </SelectField>

      <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[11.5px] text-[#6a6258]">
        <input
          type="checkbox"
          checked={showEnded}
          onChange={(e) => onShowEndedChange(e.target.checked)}
          className="h-3.5 w-3.5 cursor-pointer accent-[#E66B27]"
        />
        終了した情報を表示
      </label>
    </section>
  );
}
