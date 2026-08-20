"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { SEASONS, type SeasonKey } from "@/lib/posts/group-my-posts-by-season";

const LEAF_ICON = "/assets/machiglyph/checkin/icons/leaf_icon.svg";
const TITLE_SPRIG = "/profile/album/title-sprig.png";

const SEASON_ART: Record<SeasonKey, string> = {
  spring: "/profile/album/season-spring.jpg",
  summer: "/profile/album/season-summer.jpg",
  autumn: "/profile/album/season-autumn.jpg",
  winter: "/profile/album/season-winter.jpg",
};

export function MypageMobileAlbum() {
  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-start justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-[#18181a]">
            <Image src={LEAF_ICON} alt="" width={16} height={16} aria-hidden unoptimized />
            マイアルバム
            <Image
              src={TITLE_SPRIG}
              alt=""
              width={18}
              height={28}
              className="h-5 w-auto"
              aria-hidden
            />
          </h2>
          <p className="mt-0.5 text-[11px] leading-snug text-[#8c8a84]">
            記録をアルバムのように振り返せます。
          </p>
        </div>
        <Link
          href="/profile/posts"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#e2eee4] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#216B43] shadow-sm"
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          記録・月別
        </Link>
      </header>

      <div className="mypage-season-book">
        <div className="mypage-season-book__spread">
          {SEASONS.map((season) => (
            <Link
              key={season.key}
              href="/posts/new"
              className={`mypage-season-pane mypage-season-pane--${season.key}`}
              aria-label={`${season.label}（${season.months}）の記録を残す`}
            >
              <span className="mypage-season-pane__tape" aria-hidden />
              <p className="mypage-season-pane__label">{season.label}</p>
              <span className="mypage-season-pane__shot">
                <Image
                  src={SEASON_ART[season.key]}
                  alt=""
                  width={240}
                  height={160}
                  className="mypage-season-pane__art"
                />
              </span>
              <span className="mypage-season-pane__cta">
                記録を残す
                <ChevronRight className="h-3 w-3" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
