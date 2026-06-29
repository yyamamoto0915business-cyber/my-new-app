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

const HERO_IMAGE = "/home/pc/hero-townscape.png";

const FILTER_CHIPS = [
  { key: "weekend", label: "今週末", Icon: Calendar },
  { key: "free", label: "¥0 無料", Icon: CircleDollarSign },
  { key: "family", label: "親子", Icon: Baby },
  { key: "workshop", label: "体験", Icon: Sparkles },
  { key: "community", label: "交流会", Icon: Users },
  { key: "all", label: "すべて", Icon: LayoutGrid },
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
      className="overflow-hidden rounded-[14px] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
      aria-label="まちの出来事を探す"
    >
      <div className="relative min-h-[148px]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-[70%_30%]"
          sizes="100vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#eef4ee]/90 via-[#eef4ee]/40 to-transparent"
          aria-hidden
        />

        <div className="relative px-2.5 pt-2.5">
          <p className="text-[10px] font-semibold text-[#d4843a]">イベントを探す</p>
          <h1
            className="mt-0.5 text-[20px] font-semibold leading-[1.28] text-[#1a2e22]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            まちの出来事に、
            <br />
            出会いにいく。
          </h1>
          <p className="mt-1 text-[11px] leading-snug text-[#3d5c48]">
            地域でひらかれる催しや活動を、見つけられます。
          </p>
        </div>
      </div>

      <div className="space-y-2 px-2.5 pb-2.5 pt-1">
        <div className="flex h-11 items-center gap-2 rounded-full bg-white px-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.08)] ring-1 ring-[#e8ebe6]">
          <Search className="h-4 w-4 shrink-0 text-[#8a9088]" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="地域やイベント名で探す"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[#1a2e22] placeholder:text-[#6a7068] outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTER_CHIPS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChipClick(key)}
              className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10px] font-medium transition ${
                activeChip === key
                  ? "bg-[#2D7A4F] text-white ring-1 ring-[#2D7A4F]/60"
                  : "bg-white text-[#3d5c48] ring-1 ring-[#e8ebe6] active:bg-[#f5f7f4]"
              }`}
            >
              <Icon className="h-3 w-3" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
