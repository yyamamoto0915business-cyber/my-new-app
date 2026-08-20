"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { SearchLeafIcon } from "@/components/home/DiscoverHeroCatchphrase";

const HERO_IMAGE = "/machi/hero-board-material-mobile.png";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
};

/** まちの情報 モバイルヒーロー（掲示板素材・中央にコピーと検索） */
export function MobileTownBoardHero({ searchQuery, onSearchQueryChange }: Props) {
  return (
    <section className="mg-mobile-section p-0" aria-label="まちの情報を探す">
      <div className="relative aspect-[900/340] min-h-[150px] w-full overflow-hidden rounded-[14px]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="relative w-full max-w-[292px] rounded-[10px] border border-[#e6dbc8]/70 bg-[#fdfaf3]/80 px-4 py-2.5 text-center shadow-[0_4px_18px_rgba(120,80,40,0.10)] backdrop-blur-[1px] before:pointer-events-none before:absolute before:inset-[3px] before:rounded-[7px] before:border before:border-[#e0d3bd]/45 before:content-['']">
            <div className="mb-1 flex items-center justify-center gap-2">
              <span className="h-px w-5 bg-[#cbbba0]" aria-hidden />
              <span className="text-[8px] font-medium tracking-[0.24em] text-[#a08a68]">
                MACHI INFORMATION
              </span>
              <span className="h-px w-5 bg-[#cbbba0]" aria-hidden />
            </div>
            <h1
              className="text-[17px] font-normal leading-[1.5] tracking-[0.08em] text-[#3a2a18]"
              style={{
                fontFamily:
                  "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif",
              }}
            >
              まちの魅力に、出会いにいく。
            </h1>
            <p className="mt-1.5 text-[10.5px] leading-[1.8] tracking-[0.03em] text-[#6b5b48]">
              イベント・お店・募集を、ひとつの場所で。
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-2.5 flex h-9 w-full items-center gap-1.5 rounded-full border border-[#e0d3bd] bg-white/92 pl-3 pr-1 shadow-[0_2px_8px_rgba(120,70,30,0.06)]"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-[#a08a68]" aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="イベントやお店を検索"
                className="min-w-0 flex-1 bg-transparent text-[11px] text-[#3a2a18] placeholder:text-[#a89c8c] outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#3d7355] px-3 text-[11px] font-medium text-white"
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
