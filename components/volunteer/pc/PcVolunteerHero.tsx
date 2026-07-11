"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  MapPin,
  Grid3X3,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import { PREFECTURES } from "@/lib/prefectures";
import { VOLUNTEER_ROLE_LABELS } from "@/lib/volunteer-roles-mock";
import type { BenefitFilter } from "@/lib/volunteer-utils";
import {
  PcVolunteerConditionTags,
  type ConditionKey,
} from "./PcVolunteerConditionTags";

const HERO_IMAGE = "/home/pc-hero-bg.png";

const ROLE_OPTIONS = Object.entries(VOLUNTEER_ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const DATE_OPTIONS = [
  { value: "", label: "活動日" },
  { value: "today", label: "今日" },
  { value: "week", label: "今週" },
  { value: "month", label: "今月" },
] as const;

const CONDITION_OPTIONS: { value: BenefitFilter | ""; label: string }[] = [
  { value: "", label: "こだわり条件" },
  { value: "TRANSPORT", label: "交通費あり" },
  { value: "MEAL", label: "食事あり" },
  { value: "LODGING", label: "宿泊あり" },
  { value: "REWARD", label: "謝礼あり" },
  { value: "INSURANCE", label: "保険あり" },
  { value: "SHUTTLE", label: "送迎あり" },
];

type Props = {
  keyword: string;
  prefecture: string;
  roleType: string;
  dateFilter: string;
  benefitFilter: BenefitFilter | "";
  conditionTags: Set<ConditionKey>;
  onKeywordChange: (value: string) => void;
  onPrefectureChange: (value: string) => void;
  onRoleTypeChange: (value: string) => void;
  onDateFilterChange: (value: string) => void;
  onBenefitFilterChange: (value: BenefitFilter | "") => void;
  onToggleConditionTag: (key: ConditionKey) => void;
  onSearch: () => void;
};

function PillSelect({
  label,
  icon: Icon,
  value,
  onChange,
  children,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-[#566358]">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full cursor-pointer appearance-none truncate rounded-full border border-[#DDE8DF] bg-[#fafcf9] pl-8 pr-7 text-[12px] text-[#566358] outline-none transition hover:border-[#2D7A4F] focus:border-[#2D7A4F] focus:ring-1 focus:ring-[#2D7A4F]/20"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a9e98]"
        aria-hidden
      />
    </label>
  );
}

export function PcVolunteerHero({
  keyword,
  prefecture,
  roleType,
  dateFilter,
  benefitFilter,
  conditionTags,
  onKeywordChange,
  onPrefectureChange,
  onRoleTypeChange,
  onDateFilterChange,
  onBenefitFilterChange,
  onToggleConditionTag,
  onSearch,
}: Props) {
  return (
    <section aria-label="ボランティア募集" className="overflow-hidden rounded-t-[16px] bg-white">
      <div className="relative overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-[70%_38%]"
          sizes="1280px"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/96 via-white/78 to-white/25"
          aria-hidden
        />

        <div className="relative z-10 px-6 pb-12 pt-3">
          <nav
            aria-label="パンくず"
            className="mb-1.5 flex items-center gap-1 text-[11px] text-[#566358]"
          >
            <Link href="/" className="transition-colors hover:text-[#2D7A4F]">
              ホーム
            </Link>
            <span aria-hidden>&gt;</span>
            <span aria-current="page">ボランティア募集</span>
          </nav>

          <h1
            className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#1A2214]"
            style={{ fontFamily: "var(--font-shippori-mincho), 'Shippori Mincho', serif" }}
          >
            ボランティア募集
          </h1>
          <p className="mt-1.5 max-w-[440px] text-[12px] leading-[1.75] text-[#566358]">
            あなたの優しさが、まちの力になる。地域のイベントや活動で、お手伝いできる募集を見つけられます。
          </p>
        </div>
      </div>

      <div className="relative z-20 px-6 pb-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
          className="-mt-8 rounded-[12px] border border-[#DDE8DF] bg-white p-3.5 shadow-[0_2px_16px_rgba(45,122,79,0.07)]"
        >
          <div className="mb-2.5 flex items-center gap-2 border-b border-[#EAF4ED] pb-2.5">
            <Search className="h-4 w-4 shrink-0 text-[#8a9e98]" aria-hidden />
            <input
              type="search"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              placeholder="キーワードで探す（例：清掃、子ども、イベント）"
              className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-[#1A2214] outline-none placeholder:text-[#AABCAA]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PillSelect
              label="エリアを選択"
              icon={MapPin}
              value={prefecture}
              onChange={onPrefectureChange}
            >
              <option value="">エリアを選択</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </PillSelect>

            <PillSelect
              label="活動カテゴリ"
              icon={Grid3X3}
              value={roleType}
              onChange={onRoleTypeChange}
            >
              <option value="">活動カテゴリ</option>
              {ROLE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </PillSelect>

            <PillSelect
              label="活動日"
              icon={Calendar}
              value={dateFilter}
              onChange={onDateFilterChange}
            >
              {DATE_OPTIONS.map(({ value, label }) => (
                <option key={value || "all"} value={value}>
                  {label}
                </option>
              ))}
            </PillSelect>

            <PillSelect
              label="こだわり条件"
              icon={SlidersHorizontal}
              value={benefitFilter}
              onChange={(v) => onBenefitFilterChange(v as BenefitFilter | "")}
            >
              {CONDITION_OPTIONS.map(({ value, label }) => (
                <option key={value || "all"} value={value}>
                  {label}
                </option>
              ))}
            </PillSelect>

            <button
              type="submit"
              className="ml-auto shrink-0 rounded-full bg-[#2D7A4F] px-5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#3D8E61]"
            >
              検索する
            </button>
          </div>

          <div className="mt-2.5 border-t border-[#EAF4ED] pt-2.5">
            <PcVolunteerConditionTags
              active={conditionTags}
              onToggle={onToggleConditionTag}
            />
          </div>
        </form>
      </div>
    </section>
  );
}
