"use client";

import Image from "next/image";
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
import {
  SectionHeroCopy,
  SearchLeafIcon,
} from "@/components/home/SectionHeroCopy";

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

function VolunteerTitle() {
  return (
    <>
      <span className="shrink-0 text-[#5B9E5A]">ボランティア</span>
      <span className="shrink-0">募集</span>
    </>
  );
}

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
    <section aria-label="ボランティア募集" className="mg-mobile-section overflow-hidden p-0">
      <div className="relative overflow-hidden rounded-[14px]">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-right saturate-[1.14] contrast-[1.06]"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#fbfcfb] via-[#fbfcfb]/88 to-transparent"
            aria-hidden
          />
          <div
            className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-[#fbfcfb] to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative flex flex-col px-3 pb-1.5 pt-1.5">
          <SectionHeroCopy
            size="mobile"
            label="ボランティアを探す"
            title={<VolunteerTitle />}
            subcopy="地域のイベントや活動で、お手伝いできる募集を見つけられます。"
            underlineTail="見つけられます。"
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch?.();
            }}
            className="mt-2 flex h-8 items-center gap-1.5 rounded-full border border-[#cfe0d4] bg-white px-3 shadow-[0_2px_10px_rgba(22,56,40,0.06)]"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-[#5B9E5A]" aria-hidden />
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
            ) : (
              <SearchLeafIcon className="h-3.5 w-3.5" />
            )}
          </form>
        </div>
      </div>

      <div className="space-y-1.5 bg-white px-3 pb-2.5 pt-2">
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
