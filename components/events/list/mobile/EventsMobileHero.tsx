"use client";

import Image from "next/image";
import {
  Search,
  X,
  Calendar,
  CircleDollarSign,
  Baby,
  Sparkles,
  Users,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { EVENTS_PC_HERO_IMAGE } from "../events-pc-constants";

export type EventsMobileQuickChip = {
  key: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  onClick: () => void;
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
    <section className="relative overflow-hidden bg-[#FAF8F2]" aria-label="イベントを探す">
      <div className="relative min-h-[188px]">
        <Image
          src={EVENTS_PC_HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-[center_42%]"
          sizes="100vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FDF9F0]/97 via-[#FBF7EE]/72 to-[#FBF7EE]/35"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FDFDFB] to-transparent"
          aria-hidden
        />

        <div className="relative z-10 px-4 pb-5 pt-1">
          <h1
            className="text-[24px] font-bold leading-[1.25] tracking-[-0.02em] text-[#223344]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            イベントを探す
          </h1>
          <p className="mt-1.5 max-w-[280px] text-[12px] leading-[1.55] text-[#666666]">
            地域でひらかれる催しや活動を見つけられます。
          </p>

          <div className="mt-4 flex h-[46px] items-center gap-2.5 rounded-full border border-[#E5E8E4] bg-white px-4 shadow-[0_2px_14px_rgba(34,51,68,0.07)]">
            <Search className="h-[18px] w-[18px] shrink-0 text-[#999999]" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="地域やイベント名で探す"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#223344] placeholder:text-[#AAAAAA] outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchQueryChange("")}
                className="text-[#666666]"
                aria-label="検索をクリア"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {quickChips.length > 0 ? (
            <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              {quickChips.map(({ key, label, Icon, active, onClick }) => (
                <button
                  key={key}
                  type="button"
                  onClick={onClick}
                  className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10px] font-medium transition ${
                    active
                      ? "bg-[#4A8C5E] text-white ring-1 ring-[#4A8C5E]/60"
                      : "bg-white/95 text-[#666666] ring-1 ring-[#E0E6DE] active:bg-[#F7F8F6]"
                  }`}
                >
                  <Icon className="h-3 w-3" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
