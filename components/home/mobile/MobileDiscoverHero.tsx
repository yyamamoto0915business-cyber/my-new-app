"use client";

import Image from "next/image";
import {
  Search,
  Calendar,
  CircleDollarSign,
  Baby,
  Sparkles,
  Users,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/home/pc/hero-townscape.png";

const FILTER_CHIPS = [
  { key: "weekend", label: "今週末", Icon: Calendar },
  { key: "free", label: "¥0 無料", Icon: CircleDollarSign },
  { key: "family", label: "親子", Icon: Baby },
  { key: "workshop", label: "体験", Icon: Sparkles },
  { key: "community", label: "交流会", Icon: Users },
  { key: "all", label: "すべて", Icon: LayoutGrid, isAll: true },
] as const;

type Props = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  activeChip: string;
  onChipClick: (key: string) => void;
};

export function MobileDiscoverHero({
  searchQuery,
  onSearchQueryChange,
  activeChip,
  onChipClick,
}: Props) {
  return (
    <section
      className="mg-mobile-section overflow-hidden p-0"
      aria-label="まちの出来事を探す"
    >
      {/* イラスト＋コピー */}
      <div className="relative h-[104px]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-[68%_32%] brightness-[1.04] saturate-[1.18]"
          sizes="100vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f7fbf8]/68 via-[#f7fbf8]/28 to-[#f7fbf8]/6"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[68%] bg-gradient-to-r from-[#f7fbf8]/76 to-transparent"
          aria-hidden
        />

        <div className="relative flex h-full flex-col justify-center px-4 py-3">
          <p className="text-[10px] font-semibold text-[#d4843a]">イベントを探す</p>
          <h1
            className="mt-0.5 text-[18px] font-semibold leading-[1.28] text-[#163828]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            まちの出来事に、出会いにいく。
          </h1>
          <p className="mt-1 text-[10px] leading-snug text-[#3d5c48]">
            地域でひらかれる催しや活動を、見つけられます。
          </p>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="relative z-10 space-y-2 px-4 pb-3.5 pt-2.5">
        <div className="flex h-10 items-center gap-2 rounded-full border border-[#dde9e1] bg-white px-3.5 shadow-[0_4px_16px_rgba(22,56,40,0.06)]">
          <Search className="h-4 w-4 shrink-0 text-[#8a9088]" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="地域やイベント名で探す"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[#163828] placeholder:text-[#6a7068] outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTER_CHIPS.map(({ key, label, Icon, ...rest }) => {
            const isAll = "isAll" in rest;
            const isActive = activeChip === key;
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
                      : "mg-mobile-chip-inactive"
                )}
              >
                <Icon className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
