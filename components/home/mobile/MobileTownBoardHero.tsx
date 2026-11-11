"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { SearchLeafIcon } from "@/components/home/DiscoverHeroCatchphrase";

const HERO_IMAGE = "/machi/hero-board-material-mobile.png";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
};

/** まちの情報 モバイルヒーロー（掲示板素材・中央にコピーと検索）。枠を減らしてシンプルにしている */
export function MobileTownBoardHero({ searchQuery, onSearchQueryChange }: Props) {
  // 外側の白い枠は付けず、木目の写真をそのまま角丸で出す
  return (
    <section className="relative z-[1]" aria-label="まちの情報を探す">
      <div className="relative aspect-[900/290] min-h-[118px] w-full tablet:aspect-[900/260] overflow-hidden rounded-[18px] shadow-[0_4px_16px_rgba(120,80,40,0.10)]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="relative w-full max-w-[330px] rounded-[10px] border border-[#e6dbc8]/70 bg-[#fdfaf3]/80 px-4 py-1.5 tablet:max-w-[420px] tablet:px-6 tablet:py-3 text-center shadow-[0_4px_18px_rgba(120,80,40,0.10)] backdrop-blur-[1px]">
            <div className="mb-0.5 flex items-center justify-center gap-2">
              <span className="h-px w-5 bg-[#cbbba0]" aria-hidden />
              <span className="text-[8px] font-medium tracking-[0.24em] tablet:text-[9.5px] text-[#a08a68]">
                MACHI INFORMATION
              </span>
              <span className="h-px w-5 bg-[#cbbba0]" aria-hidden />
            </div>
            <h1
              className="text-[17px] font-normal leading-[1.5] tablet:text-[23px] tracking-[0.08em] text-[#3a2a18]"
              style={{
                fontFamily:
                  "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif",
              }}
            >
              まちの魅力に、出会いにいく。
            </h1>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-2 flex h-8 w-full items-center tablet:mt-3 tablet:h-10 gap-1.5 rounded-full border border-[#e0d3bd] bg-white/92 pl-3 pr-1 shadow-[0_2px_8px_rgba(120,70,30,0.06)]"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-[#a08a68]" aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="キーワードで探す"
                className="mg-hero-search-input min-w-0 flex-1 bg-transparent text-[10px] text-[#3a2a18] tablet:text-[13px] placeholder:text-[#a89c8c] outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#3d7355] px-3 text-[10px] tablet:h-8 tablet:px-4 tablet:text-[12px] font-medium text-white"
              >
                <SearchLeafIcon className="h-3 w-3" />
                検索
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
