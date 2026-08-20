"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { SearchLeafIcon } from "@/components/home/DiscoverHeroCatchphrase";

const HERO_IMAGE = "/machi/hero-board-material-wide.png";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
};

/** まちの情報 PCヒーロー（横長の掲示板素材・中央クリーム紙にコピーと検索を載せる） */
export function PcTownBoardHero({ searchQuery, onSearchQueryChange }: Props) {
  return (
    <section
      className="group relative aspect-[1415/256] min-h-[185px] w-full overflow-hidden rounded-[16px] shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
      aria-label="まちの情報を探す"
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        sizes="(min-width: 900px) 1216px, 100vw"
      />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="relative w-full max-w-[540px] rounded-[10px] border border-[#e6dbc8]/70 bg-[#fdfaf3]/82 px-8 py-4 text-center shadow-[0_6px_28px_rgba(120,80,40,0.10)] backdrop-blur-[2px]">
          <div className="mb-1.5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#cbbba0]" aria-hidden />
            <span className="text-[9.5px] font-medium tracking-[0.28em] text-[#a08a68]">
              MACHI INFORMATION
            </span>
            <span className="h-px w-8 bg-[#cbbba0]" aria-hidden />
          </div>

          <h1
            className="text-[24px] font-normal leading-[1.45] tracking-[0.06em] text-[#3a2a18] lg:text-[26px]"
            style={{
              fontFamily:
                "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif",
            }}
          >
            まちの魅力に、出会いにいく。
          </h1>

          <p className="mt-2 text-[11px] leading-[1.75] tracking-[0.04em] text-[#6b5b48]">
            イベント、キッチンカー、お店、ボランティアまで。
            <br />
            あなたの「気になる」が、きっと見つかります。
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-2.5 flex h-9 w-full max-w-[400px] items-center gap-2 rounded-full border border-[#e0d3bd] bg-white/90 pl-4 pr-1.5 shadow-[0_2px_8px_rgba(120,70,30,0.06)] transition focus-within:border-[#c9b394] focus-within:shadow-[0_3px_14px_rgba(120,70,30,0.10)]"
          >
            <Search className="h-4 w-4 shrink-0 text-[#a08a68]" aria-hidden />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="イベントやお店を検索"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[#3a2a18] placeholder:text-[#a89c8c] outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#3d7355] px-4 text-[11.5px] font-medium tracking-[0.06em] text-white transition hover:bg-[#33624a]"
            >
              <SearchLeafIcon className="h-3.5 w-3.5" />
              検索
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
