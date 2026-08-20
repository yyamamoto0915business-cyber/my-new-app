"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DiscoverHeroCatchphrase,
  SearchLeafIcon,
} from "@/components/home/DiscoverHeroCatchphrase";
import { TOWN_INFO_KIND_CHIPS } from "@/components/home/pc/PcDiscoverHero";

const HERO_IMAGE = "/machi/hero-town-info.png";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  activeChip: string;
  onChipClick: (key: string) => void;
};

/**
 * まちの情報モバイルヒーロー
 */
export function MobileDiscoverHero({
  searchQuery,
  onSearchQueryChange,
  activeChip,
  onChipClick,
}: Props) {
  return (
    <section className="mg-mobile-section overflow-hidden p-0" aria-label="まちの情報を探す">
      <div className="relative overflow-hidden rounded-[14px]">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-[70%_35%] brightness-[1.05] saturate-[1.12]"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#fbfcfb] via-[#fbfcfb]/90 to-transparent"
            aria-hidden
          />
          <div
            className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-[#fbfcfb] to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative flex flex-col px-3 pb-1.5 pt-1.5">
          <DiscoverHeroCatchphrase size="mobile" />

          <div className="mt-2 flex h-8 items-center gap-2 rounded-full border border-[#cfe0d4] bg-white px-3 shadow-[0_2px_12px_rgba(22,56,40,0.07)]">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#5B9E5A]" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="イベント・お店・募集で探す"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-[#163828] placeholder:text-[#7a847c] outline-none"
            />
            <SearchLeafIcon className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div className="relative z-10 px-0.5 pb-2 pt-2">
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {TOWN_INFO_KIND_CHIPS.map(({ key, label, Icon }) => {
            const isActive = activeChip === key;
            const isAll = key === "all";
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChipClick(key)}
                className={cn(
                  "mg-mobile-chip",
                  isAll && isActive
                    ? "mg-mobile-chip-all"
                    : isActive
                      ? "mg-mobile-chip-active"
                      : "mg-mobile-chip-inactive",
                )}
              >
                {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
