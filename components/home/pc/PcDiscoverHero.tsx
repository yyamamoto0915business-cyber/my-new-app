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
      className="relative min-h-[248px] overflow-hidden rounded-[16px] shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
      aria-label="まちの出来事を探す"
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-[72%_center]"
        sizes="(min-width: 900px) 1280px, 100vw"
      />
      {/* 左側UI用の軽いグラデーション */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#eef4ee]/90 via-[#eef4ee]/45 to-transparent"
        aria-hidden
      />

      <div className="relative flex min-h-[248px]">
        <div className="flex flex-1 flex-col justify-between p-5 pr-[232px]">
          <div>
            <h1
              className="text-[24px] font-semibold leading-[1.25] tracking-[0.01em] text-[#1a2e22]"
              style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
            >
              まちの出来事に、
              <br />
              出会いにいく。
            </h1>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#3d5c48]">
              地域でひらかれる催しや活動を、見つけられます。
            </p>
          </div>

          <div className="mt-4 max-w-[520px]">
            <div className="flex h-[44px] items-center gap-2.5 rounded-full border border-white/95 bg-white px-4 shadow-[0_4px_20px_rgba(15,23,42,0.1)]">
              <Search className="h-4 w-4 shrink-0 text-[#8a9088]" aria-hidden />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="地域やイベント名で探す"
                className="flex-1 bg-transparent text-[13px] text-[#1a2e22] placeholder:text-[#6a7068] outline-none"
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {FILTER_CHIPS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChipClick(key)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium shadow-sm transition ${
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

        <div className="absolute right-5 top-1/2 w-[220px] -translate-y-1/2">
          <div className="rounded-[14px] border border-white/80 bg-white/98 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.1)]">
            <h2
              className="text-[13px] font-semibold text-[#0e1610]"
              style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
            >
              MachiGlyphとは
            </h2>
            <p className="mt-1.5 text-[10px] leading-relaxed text-[#5a6a60]">
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
              className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1 rounded-[10px] bg-[#1a2b3c] text-[11px] font-medium text-white transition hover:opacity-90"
            >
              詳しく見る
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
