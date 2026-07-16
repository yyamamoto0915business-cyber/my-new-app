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
import {
  DiscoverHeroCatchphrase,
  SearchLeafIcon,
} from "@/components/home/DiscoverHeroCatchphrase";

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

/**
 * 完成図どおり：イラスト上にラベル／タイトル／サブコピー／検索を一体配置
 */
export function MobileDiscoverHero({
  searchQuery,
  onSearchQueryChange,
  activeChip,
  onChipClick,
}: Props) {
  return (
    <section className="mg-mobile-section overflow-hidden p-0" aria-label="まちの出来事を探す">
      <div className="relative overflow-hidden rounded-[14px]">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-[78%_35%] brightness-[1.05] saturate-[1.18]"
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
              placeholder="地域やイベント名で探す"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-[#163828] placeholder:text-[#7a847c] outline-none"
            />
            <SearchLeafIcon className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div className="relative z-10 px-0.5 pb-2 pt-2">
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
