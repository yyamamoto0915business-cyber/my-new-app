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
    <section className="relative overflow-hidden bg-[#f5f8f5]" aria-label="イベントを探す">
      <div className="relative min-h-[168px]">
        <div className="absolute inset-0">
          <Image
            src={EVENTS_MOBILE_HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-[72%_40%]"
            sizes="100vw"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f7fbf8]/88 via-[#f7fbf8]/55 to-[#f5f8f5]/95"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-[#f7fbf8]/94 to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative z-10 px-4 pb-3.5 pt-2">
          <h1
            className="text-[20px] font-bold leading-[1.28] tracking-[-0.02em] text-[#163828]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            イベントを探す
          </h1>
          <p className="mt-1 max-w-[280px] text-[11px] leading-[1.5] text-[#3d5c48]">
            地域でひらかれる催しや活動を、見つけられます。
          </p>

          <div className="mt-3 flex h-10 items-center gap-2 rounded-full border border-[#dde9e1] bg-white px-3.5 shadow-[0_4px_16px_rgba(22,56,40,0.06)]">
            <Search className="h-4 w-4 shrink-0 text-[#8a9088]" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="地域やイベント名で探す"
              className="min-w-0 flex-1 bg-transparent text-[12px] text-[#163828] placeholder:text-[#6a7068] outline-none"
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
            <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              {quickChips.map(({ key, label, Icon, active, onClick, isAll }) => (
                <button
                  key={key}
                  type="button"
                  onClick={onClick}
                  className={cn(
                    "mg-mobile-chip",
                    isAll
                      ? "mg-mobile-chip-inactive"
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
      </div>
    </section>  );
}
