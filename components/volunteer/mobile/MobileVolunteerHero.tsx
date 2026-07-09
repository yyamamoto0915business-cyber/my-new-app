"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Search,
  MapPin,
  Grid3X3,
  Calendar,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMobileFilterButtonLabel,
  isMobileFilterActive,
  type MobileVolunteerFilterKind,
} from "./MobileVolunteerFilterSheet";
import type { BenefitFilter } from "@/lib/volunteer-utils";

const HERO_IMAGE = "/volunteer/mobile-hero-watercolor.png";

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
  onSettingsClick?: () => void;
  hasActiveFilters?: boolean;
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
  onSettingsClick,
  hasActiveFilters = false,
}: Props) {
  const filterValues = { prefecture, roleType, dateFilter, benefitFilter };

  return (
    <section
      aria-label="ボランティア募集"
      className="mg-mobile-section overflow-hidden p-0"
    >
      <div className="relative h-[84px] overflow-hidden bg-white">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-right saturate-[1.14] contrast-[1.06]"
          sizes="100vw"
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-white via-white/82 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col justify-center px-3 py-1">
          <nav
            aria-label="パンくず"
            className="mb-0.5 flex items-center gap-1 text-[9px] text-[#6a7068]"
          >
            <Link href="/" className="transition-colors hover:text-[#2f6b4f]">
              ホーム
            </Link>
            <span aria-hidden>&gt;</span>
            <span aria-current="page">ボランティア募集</span>
          </nav>

          <h1
            className="text-[18px] font-semibold leading-[1.28] text-[#163828]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            ボランティア募集
          </h1>
          <p className="mt-0.5 whitespace-nowrap text-[10px] leading-snug text-[#3d5c48]">
            地域のイベントや活動で、お手伝いできる募集を見つけられます。
          </p>
        </div>
      </div>

      <div className="space-y-1.5 bg-white px-3 pb-2.5 pt-1.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch?.();
          }}
          className="flex h-9 items-center gap-1.5 rounded-full border border-[#dde9e1] bg-white px-3 shadow-[0_2px_10px_rgba(22,56,40,0.05)]"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-[#8a9088]" aria-hidden />
          <input
            type="search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="キーワードで探す"
            className="min-w-0 flex-1 bg-transparent text-[11px] text-[#163828] outline-none placeholder:text-[#6a7068]"
          />
          {keyword ? (
            <button
              type="button"
              onClick={() => onKeywordChange("")}
              className="text-[#6a7068]"
              aria-label="検索をクリア"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </form>

        <div className="flex items-center gap-1.5">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {FILTER_BUTTONS.map(({ kind, icon: Icon }) => {
              const active = isMobileFilterActive(kind, filterValues);
              const label = getMobileFilterButtonLabel(kind, filterValues);
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onOpenFilter(kind)}
                  className={cn(
                    "mg-mobile-chip max-w-[108px]",
                    active ? "mg-mobile-chip-active" : "mg-mobile-chip-inactive"
                  )}
                >
                  <Icon className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onSettingsClick}
            aria-label={hasActiveFilters ? "フィルターをリセット" : "詳細フィルター"}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] shadow-[0_2px_8px_rgba(22,56,40,0.12)] transition",
              hasActiveFilters
                ? "bg-[#163828] text-white"
                : "bg-[#2f6b4f] text-white active:bg-[#2a5a42]"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
