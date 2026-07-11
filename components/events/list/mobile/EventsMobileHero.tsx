"use client";

import Image from "next/image";
import { Search, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

export function EventsMobileHero({
  searchQuery,
  onSearchQueryChange,
  quickChips = [],
}: Props) {
  return (
    <section
      aria-label="イベントを探す"
      className="mg-mobile-section overflow-hidden p-0"
    >
      <div className="relative h-[84px] overflow-hidden bg-white">
        <Image
          src={EVENTS_MOBILE_HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-[72%_40%] saturate-[1.1] contrast-[1.04]"
          sizes="100vw"
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-white via-white/88 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/35"
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col justify-center px-3 py-1">
          <h1
            className="text-[18px] font-semibold leading-[1.28] text-[#163828] [text-shadow:0_1px_0_rgba(247,251,248,0.95),0_0_12px_rgba(247,251,248,0.85),0_0_20px_rgba(247,251,248,0.7)]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            イベントを探す
          </h1>
          <p className="mt-0.5 text-[10px] leading-snug text-[#3d5c48] [text-shadow:0_1px_0_rgba(247,251,248,0.95),0_0_10px_rgba(247,251,248,0.85),0_0_18px_rgba(247,251,248,0.7)]">
            地域でひらかれる催しや活動を、見つけられます。
          </p>
        </div>
      </div>

      <div className="space-y-1.5 bg-white px-3 pb-2.5 pt-1.5">
        <div className="flex h-9 items-center gap-1.5 rounded-full border border-[#dde9e1] bg-white px-3 shadow-[0_2px_10px_rgba(22,56,40,0.05)]">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#8a9088]" aria-hidden />
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
          ) : null}
        </div>

        {quickChips.length > 0 ? (
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
        ) : null}
      </div>
    </section>
  );
}
