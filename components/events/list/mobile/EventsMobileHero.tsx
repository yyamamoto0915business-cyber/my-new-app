"use client";

import Image from "next/image";
import { Search, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchLeafIcon } from "@/components/home/DiscoverHeroCatchphrase";

/** ホーム（まちの情報）のヒーローと同じ、木目と紙の素材 */
const HERO_IMAGE = "/machi/hero-board-material-mobile.png";

export type EventsMobileQuickChip = {
  key: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  isAll?: boolean;
};

type Props = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  quickChips?: EventsMobileQuickChip[];
};

/**
 * イベント一覧（スマホ）のヒーロー。ホームのヒーローと同じ形
 * （木目の写真・紙のカード・英字ラベル・明朝体のコピー・カードの中の検索欄）にそろえている。
 */
export function EventsMobileHero({ searchQuery, onSearchQueryChange, quickChips = [] }: Props) {
  return (
    <section aria-label="イベントを探す" className="relative z-[1] space-y-2.5">
      <div className="relative aspect-[900/290] min-h-[118px] w-full overflow-hidden rounded-[18px] shadow-[0_4px_16px_rgba(120,80,40,0.10)] tablet:aspect-[900/260]">
        <Image src={HERO_IMAGE} alt="" fill priority className="object-cover object-center" sizes="100vw" />

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="relative w-full max-w-[330px] rounded-[10px] border border-[#e6dbc8]/70 bg-[#fdfaf3]/80 px-4 py-1.5 text-center shadow-[0_4px_18px_rgba(120,80,40,0.10)] backdrop-blur-[1px] tablet:max-w-[420px] tablet:px-6 tablet:py-3">
            <div className="mb-0.5 flex items-center justify-center gap-2">
              <span className="h-px w-5 bg-[#cbbba0]" aria-hidden />
              <span className="text-[8px] font-medium tracking-[0.24em] text-[#a08a68] tablet:text-[9.5px]">
                EVENTS
              </span>
              <span className="h-px w-5 bg-[#cbbba0]" aria-hidden />
            </div>
            <h1
              className="text-[17px] font-normal leading-[1.5] tracking-[0.08em] text-[#3a2a18] tablet:text-[23px]"
              style={{ fontFamily: "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif" }}
            >
              まちの出来事に、出会いにいく。
            </h1>

            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                (document.activeElement as HTMLElement | null)?.blur();
              }}
              className="mt-2 flex h-8 w-full items-center gap-1.5 rounded-full border border-[#e0d3bd] bg-white/92 pl-3 pr-1 shadow-[0_2px_8px_rgba(120,70,30,0.06)] tablet:mt-3 tablet:h-10"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-[#a08a68]" aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="地域やイベント名で探す"
                aria-label="イベントを探す"
                className="mg-hero-search-input min-w-0 flex-1 bg-transparent text-[10px] text-[#3a2a18] outline-none placeholder:text-[#a89c8c] tablet:text-[13px] [&::-webkit-search-cancel-button]:hidden"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange("")}
                  className="flex h-6 w-6 shrink-0 items-center justify-center text-[#8a7d6c]"
                  aria-label="検索をクリア"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
              <button
                type="submit"
                className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#3d7355] px-3 text-[10px] font-medium text-white tablet:h-8 tablet:px-4 tablet:text-[12px]"
              >
                <SearchLeafIcon className="h-3 w-3" />
                検索
              </button>
            </form>
          </div>
        </div>
      </div>

      {quickChips.length > 0 ? (
        // すぐ探せるボタン。画面の端まで広げ、横にスクロールしても途中で切れて見えないようにする
        <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 scrollbar-hide">
          {quickChips.map(({ key, label, Icon, active, onClick, isAll }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              aria-pressed={active}
              className={cn(
                "mg-mobile-chip",
                isAll && active ? "mg-mobile-chip-all" : active ? "mg-mobile-chip-active" : "mg-mobile-chip-inactive"
              )}
            >
              <Icon className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
