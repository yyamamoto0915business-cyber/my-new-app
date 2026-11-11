"use client";

import { Search, X } from "lucide-react";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
};

/** まちの情報（スマホ）：いちばん上の検索バー。絞り込みはすぐ下の帯に常に出す */
export function MobileTownSearchBar({ searchQuery, onSearchQueryChange }: Props) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur();
      }}
      className="flex h-12 items-center gap-2 rounded-full border border-[#e3ece5] bg-white pl-4 pr-2 shadow-[0_4px_14px_rgba(22,56,40,0.07)]"
    >
      <Search className="h-5 w-5 shrink-0 text-[#1f5e3a]" aria-hidden />
      {/* iPhone で入力時に拡大されないよう 16px。mg-hero-search-input（iOS で 0.625 倍に縮める）は付けない */}
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder="場所・キーワード・#タグで探す"
        aria-label="まちの情報を探す"
        className="min-w-0 flex-1 bg-transparent text-[16px] text-[#163828] outline-none placeholder:text-[#8a958d] [&::-webkit-search-cancel-button]:hidden"
      />
      {searchQuery ? (
        <button
          type="button"
          onClick={() => onSearchQueryChange("")}
          aria-label="検索語を消す"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6b776f] active:bg-[#f4f8f5]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </form>
  );
}
