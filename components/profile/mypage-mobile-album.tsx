"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { SEASONS, seasonOfPost, type SeasonKey } from "@/lib/posts/group-my-posts-by-season";

const LEAF_ICON = "/assets/machiglyph/checkin/icons/leaf_icon.svg";
const TITLE_SPRIG = "/profile/album/title-sprig.png";

const SEASON_ART: Record<SeasonKey, string> = {
  spring: "/profile/album/season-spring.jpg",
  summer: "/profile/album/season-summer.jpg",
  autumn: "/profile/album/season-autumn.jpg",
  winter: "/profile/album/season-winter.jpg",
};

/** 季節ごとの文字の色（水彩の絵になじむ色） */
const SEASON_INK: Record<SeasonKey, string> = {
  spring: "#b4537a",
  summer: "#2f7d4e",
  autumn: "#b0582a",
  winter: "#3f6a96",
};

/**
 * マイページ（スマホ）のマイアルバム。
 * 前は4つの季節を本の見開きで並べていたが（どれも「記録を残す」で同じ）、場所を取るので、
 * 今の季節の水彩の絵を大きく1枚にして、季節感を前に出す。ほかの季節・月ごとの記録は「記録・月別」から。
 */
export function MypageMobileAlbum() {
  const key = seasonOfPost(new Date().toISOString());
  const season = SEASONS.find((s) => s.key === key) ?? SEASONS[0];
  const ink = SEASON_INK[season.key];

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-[#18181a]">
          <Image src={LEAF_ICON} alt="" width={16} height={16} aria-hidden unoptimized />
          マイアルバム
          <Image src={TITLE_SPRIG} alt="" width={18} height={28} className="h-5 w-auto" aria-hidden />
        </h2>
        <Link
          href="/profile/posts"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#e2eee4] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#216B43] shadow-sm"
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          記録・月別
        </Link>
      </header>

      <Link
        href="/posts/new"
        className="group relative block overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-[#f7f3ea] shadow-[0_2px_12px_rgba(0,0,0,.06),0_1px_3px_rgba(0,0,0,.04)]"
        aria-label={`${season.label}（${season.months}）の記録を残す`}
      >
        <span className="relative block aspect-[16/7] w-full">
          <Image
            src={SEASON_ART[season.key]}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover saturate-[1.05]"
          />
          {/* 左側を紙の色でぼかして、文字を読みやすくする */}
          <span
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(250,247,240,.96) 0%, rgba(250,247,240,.82) 34%, rgba(250,247,240,.2) 62%, transparent 80%)",
            }}
            aria-hidden
          />
          <span className="absolute inset-y-0 left-0 flex flex-col justify-center gap-1 pl-4">
            <span className="text-[10px] font-semibold tracking-[0.24em]" style={{ color: ink }}>
              {season.en}
            </span>
            <span
              className="text-[30px] font-bold leading-none"
              style={{ color: ink, fontFamily: "'Noto Serif JP', serif" }}
            >
              {season.label}
              <span className="ml-1 text-[13px] font-semibold text-[#5f5a50]">の記録</span>
            </span>
            <span className="text-[11px] text-[#7a7468]">{season.months}</span>
            <span
              className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold text-white shadow-sm"
              style={{ backgroundColor: ink }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
              記録を残す
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </span>
        </span>
      </Link>
    </section>
  );
}
