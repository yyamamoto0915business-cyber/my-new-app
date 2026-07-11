"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Check, Calendar, CircleDollarSign, Baby, Sparkles, Users } from "lucide-react";

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
      className="relative min-h-[260px] overflow-hidden rounded-[16px] shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
      aria-label="まちの出来事を探す"
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-[78%_center]"
        sizes="(min-width: 900px) 1280px, 100vw"
      />
      {/* 左〜中央の可読性を保ちつつ、右の町並みを残す */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#eef4ee]/92 via-[#eef4ee]/55 to-transparent"
        aria-hidden
      />

      <div className="relative grid min-h-[260px] grid-cols-[minmax(0,1fr)_minmax(240px,280px)] items-stretch gap-6 px-7 py-4 lg:gap-10 lg:px-8 lg:py-5">
        {/* 左：コピー＋検索 */}
        <div className="flex min-w-0 flex-col justify-start gap-4">
          <div className="max-w-[28rem]">
            <h1
              className="text-[26px] font-semibold leading-[1.3] tracking-[0.01em] text-[#1a2e22] lg:text-[28px]"
              style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
            >
              まちの出来事に、
              <br />
              出会いにいく。
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#3d5c48]">
              地域でひらかれる催しや活動を、見つけられます。
            </p>
          </div>

          <div className="w-full max-w-[32rem]">
            <div className="flex h-11 items-center gap-2.5 rounded-full border border-white/95 bg-white px-4 shadow-[0_4px_20px_rgba(15,23,42,0.1)]">
              <Search className="h-4 w-4 shrink-0 text-[#8a9088]" aria-hidden />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="地域やイベント名で探す"
                className="flex-1 bg-transparent text-[13px] text-[#1a2e22] placeholder:text-[#6a7068] outline-none"
              />
            </div>

            <div className="mt-2 flex flex-nowrap gap-1.5">
              {FILTER_CHIPS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChipClick(key)}
                  className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium shadow-sm transition ${
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

        {/* 右：紹介パネル（町並みの上に乗るカウンターウェイト） */}
        <aside className="flex items-center self-center">
          <div className="w-full rounded-[14px] border border-white/80 bg-white/95 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.1)] backdrop-blur-[2px]">
            <h2
              className="text-[14px] font-semibold text-[#0e1610]"
              style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
            >
              MachiGlyphとは
            </h2>
            <p className="mt-2 text-[11px] leading-relaxed text-[#5a6a60]">
              地域のイベントやボランティアを、ひとつの場所で見つけられます。
            </p>
            <ul className="mt-3 space-y-2">
              {ABOUT_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-1.5 text-[11px] leading-snug text-[#3d5c48]"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4a9a68]" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/guide"
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1 rounded-[10px] bg-[#1a2b3c] text-[12px] font-medium text-white transition hover:opacity-90"
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
