"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  filterOpen: boolean;
  onToggleFilter: () => void;
  /** 絞り込みが入っているとき、ボタンに点を出す */
  filterActive: boolean;
};

/** まちの情報（スマホ）：いちばん上の検索バー。右端のボタンで絞り込みを開く */
export function MobileTownSearchBar({
  searchQuery,
  onSearchQueryChange,
  filterOpen,
  onToggleFilter,
  filterActive,
}: Props) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur();
      }}
      className="flex h-12 items-center gap-2 rounded-full border border-[#e3ece5] bg-white pl-4 pr-1.5 shadow-[0_4px_14px_rgba(22,56,40,0.07)]"
    >
      <Search className="h-5 w-5 shrink-0 text-[#1f5e3a]" aria-hidden />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder="場所・キーワード・#タグで探す"
        aria-label="まちの情報を探す"
        className="mg-hero-search-input min-w-0 flex-1 bg-transparent text-[16px] text-[#163828] outline-none placeholder:text-[14px] placeholder:text-[#8a958d]"
      />
      <span className="h-6 w-px shrink-0 bg-[#e3ece5]" aria-hidden />
      <button
        type="button"
        onClick={onToggleFilter}
        aria-expanded={filterOpen}
        aria-label="絞り込み"
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
          filterOpen ? "bg-[#eaf4ed] text-[#1f5e3a]" : "text-[#1f5e3a] active:bg-[#f4f8f5]"
        )}
      >
        <SlidersHorizontal className="h-5 w-5" aria-hidden />
        {filterActive && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#e66b27]" aria-hidden />
        )}
      </button>
    </form>
  );
}
