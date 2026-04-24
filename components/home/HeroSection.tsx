"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { WaHeroBanner } from "@/components/wa-hero-banner";

const FILTER_TAGS = [
  { label: "無料", tags: "free" },
  { label: "親子", tags: "kids" },
  { label: "体験", tags: "beginner" },
  { label: "交流会", tags: "indoor" },
];

export function HeroSection() {
  return (
    <section aria-label="MachiGlyphのご紹介">
      {/* 和テイストヒーローバナー */}
      <WaHeroBanner
        eyebrow="MACHIGLYPH"
        title="まちの出来事と出会える場所"
        subtitle="近くで開かれる催しや活動を、見つけられます。"
        className="rounded-2xl sm:rounded-2xl"
      />

      {/* 検索バー */}
      <Link
        href="/events"
        className="mt-3 flex h-12 items-center gap-3 rounded-[20px] border border-[#ccc4b4] bg-[#faf8f2] px-4 text-left shadow-sm transition hover:border-[#a8c8a4] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c7a88]/30"
        aria-label="地域やイベント名で探す"
      >
        <Search className="h-4 w-4 shrink-0 text-[#a8a090]" aria-hidden />
        <span className="text-sm text-[#6a6258]">地域やイベント名で探す</span>
      </Link>

      {/* フィルタータグ横スクロール */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TAGS.map(({ label, tags }) => (
          <Link
            key={tags}
            href={`/events?tags=${tags}`}
            className="flex-none rounded-full border border-[#ccc4b4] bg-[#faf8f2] px-4 py-2 text-[12px] font-medium text-[#3a3428] transition hover:border-[#a8c8a4] hover:bg-[#eef6f2]"
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
