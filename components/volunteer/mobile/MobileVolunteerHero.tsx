"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Search,
  MapPin,
  Grid3X3,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import {
  getMobileFilterButtonLabel,
  isMobileFilterActive,
  type MobileVolunteerFilterKind,
} from "./MobileVolunteerFilterSheet";
import type { BenefitFilter } from "@/lib/volunteer-utils";

const HERO_IMAGE = "/home/pc-hero-bg.png";

const FILTER_BUTTONS: {
  kind: MobileVolunteerFilterKind;
  icon: typeof MapPin;
}[] = [
  { kind: "area", icon: MapPin },
  { kind: "category", icon: Grid3X3 },
  { kind: "date", icon: Calendar },
  { kind: "benefit", icon: SlidersHorizontal },
];

type Props = {
  keyword: string;
  prefecture: string;
  roleType: string;
  dateFilter: string;
  benefitFilter: BenefitFilter | "";
  onKeywordChange: (value: string) => void;
  onSearch?: () => void;
  onOpenFilter: (kind: MobileVolunteerFilterKind) => void;
};

export function MobileVolunteerHero({
  keyword,
  prefecture,
  roleType,
  dateFilter,
  benefitFilter,
  onKeywordChange,
  onSearch,
  onOpenFilter,
}: Props) {
  const filterValues = { prefecture, roleType, dateFilter, benefitFilter };

  return (
    <section
      aria-label="ボランティア募集"
      className="mx-3 overflow-hidden rounded-[12px] border border-[#DDE8DF] bg-white shadow-[0_2px_8px_rgba(45,122,79,0.05)]"
    >
      <div className="relative min-h-[132px] overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-[68%_40%]"
          sizes="100vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/97 via-white/82 to-white/30"
          aria-hidden
        />

        <div className="relative z-10 px-3.5 py-2.5">
          <nav
            aria-label="パンくず"
            className="mb-1 flex items-center gap-1 text-[9px] text-[#566358]"
          >
            <Link href="/" className="transition-colors hover:text-[#2D7A4F]">
              ホーム
            </Link>
            <span aria-hidden>&gt;</span>
            <span aria-current="page">ボランティア募集</span>
          </nav>

          <h1
            className="text-[18px] font-bold leading-tight tracking-[-0.02em] text-[#1A2214]"
            style={{ fontFamily: "var(--font-shippori-mincho), 'Shippori Mincho', serif" }}
          >
            ボランティア募集
          </h1>
          <p className="mt-1 line-clamp-2 text-[10px] leading-[1.55] text-[#566358]">
            地域のイベントや活動で、お手伝いできる募集を見つけられます。
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-[#EAF4ED] px-3 pb-2.5 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch?.();
          }}
          className="flex items-center gap-2 rounded-full border border-[#DDE8DF] bg-white px-3.5 py-2 shadow-[0_1px_8px_rgba(45,122,79,0.06)]"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-[#8a9e98]" aria-hidden />
          <input
            type="search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="キーワードで探す"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[#1A2214] outline-none placeholder:text-[#AABCAA]"
          />
        </form>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTER_BUTTONS.map(({ kind, icon: Icon }) => {
            const active = isMobileFilterActive(kind, filterValues);
            const label = getMobileFilterButtonLabel(kind, filterValues);
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={active}
                onClick={() => onOpenFilter(kind)}
                className={`inline-flex max-w-[120px] shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] transition ${
                  active
                    ? "border-[#2D7A4F] bg-[#EAF4ED] font-medium text-[#2D7A4F]"
                    : "border-[#DDE8DF] bg-white text-[#566358] active:bg-[#f4f8f5]"
                }`}
              >
                <Icon className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
