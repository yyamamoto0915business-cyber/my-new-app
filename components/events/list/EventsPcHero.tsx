"use client";

import Image from "next/image";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SectionHeroCopy,
  SearchLeafIcon,
  HeroSparkRays,
} from "@/components/home/SectionHeroCopy";
import { EVENTS_PC_HERO_IMAGE, EVENTS_PC_MAX_WIDTH } from "./events-pc-constants";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

function EventsCatchphraseTitle({ size }: { size: "pc" | "mobile" }) {
  const isPc = size === "pc";
  return (
    <>
      <span className="shrink-0">まちの</span>
      <span className="relative shrink-0 text-[#D97706]">
        出来事
        <HeroSparkRays
          color="#E8B84A"
          className={cn(
            "absolute left-[58%] -translate-x-1/2",
            isPc ? "-top-4 h-4 w-4" : "-top-3 h-3 w-3"
          )}
        />
      </span>
      <span className="shrink-0">に、</span>
      <span className="shrink-0 text-[#5B9E5A]">出会い</span>
      <span className="shrink-0">にいく。</span>
    </>
  );
}

export function EventsPcHero({ searchQuery, onSearchQueryChange }: Props) {
  return (
    <section className="relative overflow-hidden bg-[#eef4ee]" aria-label="イベントを探す">
      <Image
        src={EVENTS_PC_HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-[78%_40%]"
        sizes="1280px"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f7fbf8]/96 via-[#f7fbf8]/72 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-[#f7fbf8] to-transparent"
        aria-hidden
      />

      <div
        className={`relative z-10 mx-auto flex ${EVENTS_PC_MAX_WIDTH} flex-col px-5 py-3.5 lg:px-6 lg:py-4`}
      >
        <SectionHeroCopy
          size="pc"
          label="イベントを探す"
          title={<EventsCatchphraseTitle size="pc" />}
          subcopy="地域でひらかれる催しや活動を、見つけられます。"
          underlineTail="見つけられます。"
          className="max-w-[40rem]"
        />

        <div className="mt-3 flex h-10 w-full max-w-[36rem] items-center gap-2 rounded-full border border-[#cfe0d4] bg-white px-4 shadow-[0_3px_14px_rgba(22,59,46,0.08)]">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#5B9E5A]" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="イベント名・キーワードで探す"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1A2214] placeholder:text-[#AABCAA] outline-none"
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
          ) : (
            <SearchLeafIcon className="h-3.5 w-3.5" />
          )}
        </div>
      </div>
    </section>
  );
}
