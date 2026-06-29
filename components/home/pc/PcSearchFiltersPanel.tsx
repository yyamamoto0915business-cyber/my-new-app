"use client";

import { PcRegionSection } from "./PcRegionSection";
import { PcCategoryGrid } from "./PcCategoryGrid";

type Props = {
  selectedArea: string;
  onAreaChange: (area: string) => void;
  selectedCategory: string;
  onCategoryChange: (key: string) => void;
};

/** 地域で探す + カテゴリから探す を横並び（スクロール削減） */
export function PcSearchFiltersPanel({ selectedArea, onAreaChange, selectedCategory, onCategoryChange }: Props) {
  return (
    <section
      aria-label="検索と絞り込み"
      className="grid grid-cols-2 gap-5 rounded-[16px] bg-white px-5 py-4 ring-1 ring-[#e8ebe6]"
    >
      <PcRegionSection compact selectedArea={selectedArea} onSelectArea={onAreaChange} />
      <PcCategoryGrid compact selectedCategory={selectedCategory} onSelectCategory={onCategoryChange} />
    </section>
  );
}
