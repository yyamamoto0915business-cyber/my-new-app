"use client";

import Image from "next/image";
import { Search, X } from "lucide-react";
import { EVENTS_PC_HERO_IMAGE, EVENTS_PC_MAX_WIDTH } from "./events-pc-constants";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

export function EventsPcHero({ searchQuery, onSearchQueryChange }: Props) {
  return (
    <section
      className="relative min-h-[180px] overflow-hidden bg-[#eef4ee]"
      aria-label="イベントを探す"
    >
      <Image
        src={EVENTS_PC_HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-[center_42%]"
        sizes="1280px"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f6fbf7]/72 via-[#f9fcfa]/48 to-[#f5f8f5]/94"
        aria-hidden
      />

      <div
        className={`relative z-10 mx-auto flex ${EVENTS_PC_MAX_WIDTH} flex-col items-center px-5 py-5 text-center`}
      >
        <h1
          className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-[#1A2214]"
          style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
        >
          イベントを探す
        </h1>
        <p className="mt-1 text-[12px] text-[#4A5C4E]">
          地域でひらかれる催しや活動を見つけられます。
        </p>

        <div className="mt-3 flex h-[40px] w-full max-w-[520px] items-center gap-2 rounded-full border border-white bg-white/98 px-4 shadow-[0_4px_20px_rgba(15,23,42,0.1)]">
          <Search className="h-4 w-4 shrink-0 text-[#8A9088]" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="イベント名・キーワードで探す"
            className="flex-1 bg-transparent text-[13px] text-[#1A2214] placeholder:text-[#AABCAA] outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              className="text-[#566358] transition hover:text-[#1A2214]"
              aria-label="検索をクリア"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
