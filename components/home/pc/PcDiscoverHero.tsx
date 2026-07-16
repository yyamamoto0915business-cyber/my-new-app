"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Check, Calendar, CircleDollarSign, Baby, Sparkles, Users } from "lucide-react";
import {
  DiscoverHeroCatchphrase,
  SearchLeafIcon,
} from "@/components/home/DiscoverHeroCatchphrase";

const HERO_IMAGE = "/home/pc/hero-townscape.png";

type ChipDef = {
  key: string;
  label: string;
  Icon: React.ElementType | null;
};

const FILTER_CHIPS: ChipDef[] = [
  { key: "today", label: "今日・明日", Icon: Calendar },
  { key: "free", label: "無料", Icon: CircleDollarSign },
  { key: "family", label: "親子向け", Icon: Baby },
  { key: "workshop", label: "体験", Icon: Sparkles },
  { key: "community", label: "交流会", Icon: Users },
  { key: "all", label: "すべて", Icon: null },
];

const ABOUT_POINTS = [
  "地域のイベント・ボランティアを探せます",
  "主催者と直接つながれます",
  "参加・お手伝いの記録が残ります",
];

type Props = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  activeChip: string;
  onChipClick: (key: string) => void;
};

export function PcDiscoverHero({ searchQuery, onSearchQueryChange, activeChip, onChipClick }: Props) {
  return (
    <section
      className="relative overflow-hidden rounded-[16px] shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
      aria-label="まちの出来事を探す"
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-[82%_center]"
        sizes="(min-width: 900px) 1280px, 100vw"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#eef4ee]/94 via-[#eef4ee]/62 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[48%] bg-gradient-to-r from-[#eef4ee]/96 to-transparent"
        aria-hidden
      />

      <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(220px,260px)] items-center gap-4 px-5 py-3 lg:gap-6 lg:px-6 lg:py-3.5">
        {/* 左：コピー＋検索 */}
        <div className="flex min-w-0 flex-col gap-2.5">
          <DiscoverHeroCatchphrase size="pc" className="max-w-full" />

          <div className="w-full max-w-[34rem]">
            <div className="flex h-10 items-center gap-2 rounded-full border border-[#cfe0d4] bg-white px-3.5 shadow-[0_3px_14px_rgba(22,59,46,0.08)]">
              <Search className="h-3.5 w-3.5 shrink-0 text-[#5B9E5A]" aria-hidden />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="地域やイベント名で探す"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1a2e22] placeholder:text-[#8a938c] outline-none"
              />
              <SearchLeafIcon className="h-3.5 w-3.5" />
            </div>

            <div className="mt-1.5 flex flex-nowrap gap-1.5">
              {FILTER_CHIPS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChipClick(key)}
                  className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium shadow-sm transition ${
                    activeChip === key
                      ? "border-[#2D7A4F]/60 bg-[#2D7A4F] text-white"
                      : "border-white/85 bg-white/92 text-[#3d5c48] hover:bg-white"
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3" aria-hidden />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右：紹介パネル */}
        <aside className="self-center">
          <div className="w-full rounded-[12px] border border-white/80 bg-white/95 px-4 py-3.5 shadow-[0_8px_28px_rgba(15,23,42,0.09)] backdrop-blur-[2px]">
            <h2
              className="text-[13px] font-semibold text-[#0e1610]"
              style={{
                fontFamily:
                  "var(--font-shippori-mincho), 'Shippori Mincho', 'Noto Serif JP', serif",
              }}
            >
              MachiGlyphとは
            </h2>
            <p className="mt-1 text-[10px] leading-relaxed text-[#5a6a60]">
              地域のイベントやボランティアを、ひとつの場所で見つけられます。
            </p>
            <ul className="mt-2 space-y-1.5">
              {ABOUT_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-1.5 text-[10px] leading-snug text-[#3d5c48]"
                >
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#4a9a68]" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/guide"
              className="mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1 rounded-[9px] bg-[#1a2b3c] text-[11px] font-medium text-white transition hover:opacity-90"
            >
              詳しく見る
              <span aria-hidden>→</span>
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
