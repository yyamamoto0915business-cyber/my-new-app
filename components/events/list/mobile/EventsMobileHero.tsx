"use client";

import Image from "next/image";
import { Search, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SectionHeroCopy,
  SearchLeafIcon,
  HeroSparkRays,
} from "@/components/home/SectionHeroCopy";
import { EVENTS_MOBILE_HERO_IMAGE } from "../events-pc-constants";

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

function EventsCatchphraseTitle() {
  return (
    <>
      <span className="shrink-0">まちの</span>
      <span className="relative shrink-0 text-[#D97706]">
        出来事
        <HeroSparkRays
          color="#E8B84A"
          className="absolute left-[58%] top-0 h-3 w-3 -translate-x-1/2 -translate-y-full"
        />
      </span>
      <span className="shrink-0">に、</span>
      <span className="shrink-0 text-[#5B9E5A]">出会い</span>
      <span className="shrink-0">にいく。</span>
    </>
  );
}

export function EventsMobileHero({
  searchQuery,
  onSearchQueryChange,
  quickChips = [],
}: Props) {
  return (
    <section aria-label="イベントを探す" className="mg-mobile-section overflow-hidden p-0">
      <div className="relative overflow-hidden rounded-[14px]">
        <div className="absolute inset-0">
          <Image
            src={EVENTS_MOBILE_HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-[72%_36%] saturate-[1.1] contrast-[1.04]"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#fbfcfb] via-[#fbfcfb]/90 to-transparent"
            aria-hidden
          />
          <div
            className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-[#fbfcfb] to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative flex flex-col px-3 pb-1.5 pt-1.5">
          <SectionHeroCopy
            size="mobile"
            label="イベントを探す"
            title={<EventsCatchphraseTitle />}
            subcopy="地域でひらかれる催しや活動を、見つけられます。"
            underlineTail="見つけられます。"
          />

          <div className="mt-2 flex h-8 items-center gap-1.5 rounded-full border border-[#cfe0d4] bg-white px-3 shadow-[0_2px_10px_rgba(22,56,40,0.06)]">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#5B9E5A]" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="地域やイベント名で探す"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-[#163828] outline-none placeholder:text-[#6a7068]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchQueryChange("")}
                className="text-[#6a7068]"
                aria-label="検索をクリア"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <SearchLeafIcon className="h-3.5 w-3.5" />
            )}
          </div>
        </div>
      </div>

      {quickChips.length > 0 ? (
        <div className="relative z-10 px-0.5 pb-2 pt-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {quickChips.map(({ key, label, Icon, active, onClick, isAll }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                aria-pressed={active}
                className={cn(
                  "mg-mobile-chip",
                  isAll && active
                    ? "mg-mobile-chip-all"
                    : active
                      ? "mg-mobile-chip-active"
                      : "mg-mobile-chip-inactive"
                )}
              >
                <Icon className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
