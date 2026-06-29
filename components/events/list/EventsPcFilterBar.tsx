"use client";

import { ChevronDown } from "lucide-react";
import type { DateRangeFilter } from "@/lib/events";
import { PREFECTURES } from "@/lib/prefectures";
import { EVENTS_PC_SIDEBAR_CATEGORIES } from "./events-pc-constants";

const DATE_LABELS: Record<DateRangeFilter, string> = {
  all: "すべて",
  today: "今日",
  week: "今週",
  weekend: "今週末",
  month: "今月",
  "3months": "3ヶ月",
};

const PRICE_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "free", label: "無料" },
  { value: "paid", label: "有料" },
] as const;

type Props = {
  selectedArea: string;
  onAreaChange: (area: string) => void;
  dateRange: DateRangeFilter;
  onDateRangeChange: (range: DateRangeFilter) => void;
  priceFilter: "all" | "free" | "paid";
  onPriceFilterChange: (v: "all" | "free" | "paid") => void;
  selectedCategory: string;
  onCategoryChange: (key: string) => void;
  childFriendlyOnly: boolean;
  onChildFriendlyChange: (v: boolean) => void;
  indoorOnly: boolean;
  onIndoorChange: (v: boolean) => void;
  sortOrder: "date_asc" | "newest";
  onSortChange: (sort: "date_asc" | "newest") => void;
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative inline-flex min-w-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 min-w-[80px] cursor-pointer appearance-none rounded-full border border-[#D5E5DA] bg-white pl-3 pr-7 text-[11px] font-medium text-[#1A2214] outline-none transition hover:border-[#2D7A4F]/50 focus:border-[#2D7A4F]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#566358]"
        aria-hidden
      />
    </label>
  );
}

export function EventsPcFilterBar({
  selectedArea,
  onAreaChange,
  dateRange,
  onDateRangeChange,
  priceFilter,
  onPriceFilterChange,
  selectedCategory,
  onCategoryChange,
  childFriendlyOnly,
  onChildFriendlyChange,
  indoorOnly,
  onIndoorChange,
  sortOrder,
  onSortChange,
}: Props) {
  const areaOptions = [
    { value: "", label: "地域" },
    ...PREFECTURES.slice(0, 10).map((p) => ({ value: p, label: p })),
  ];

  const dateOptions = [
    { value: "all", label: "開催日" },
    { value: "today", label: "今日" },
    { value: "weekend", label: "今週末" },
    { value: "week", label: "今週" },
    { value: "month", label: "今月" },
  ];

  const categoryOptions = EVENTS_PC_SIDEBAR_CATEGORIES.map((c) => ({
    value: c.key,
    label: c.key ? c.label : "カテゴリ",
  }));

  const chips = [
    {
      label: "親子向け",
      active: childFriendlyOnly,
      onClick: () => onChildFriendlyChange(!childFriendlyOnly),
    },
    {
      label: "無料",
      active: priceFilter === "free",
      onClick: () => onPriceFilterChange(priceFilter === "free" ? "all" : "free"),
    },
    {
      label: "今日・今週末",
      active: dateRange === "today" || dateRange === "weekend",
      onClick: () =>
        onDateRangeChange(dateRange === "weekend" ? "all" : "weekend"),
    },
    {
      label: "屋内",
      active: indoorOnly,
      onClick: () => onIndoorChange(!indoorOnly),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterSelect
          label="地域"
          value={selectedArea}
          options={areaOptions}
          onChange={onAreaChange}
        />
        <FilterSelect
          label="開催日"
          value={dateRange}
          options={dateOptions.map((o) => ({
            value: o.value,
            label: o.value === "all" ? "開催日" : o.label,
          }))}
          onChange={(v) => onDateRangeChange(v as DateRangeFilter)}
        />
        <FilterSelect
          label="料金"
          value={priceFilter}
          options={PRICE_OPTIONS.map((o) => ({
            value: o.value,
            label: o.value === "all" ? "料金" : o.label,
          }))}
          onChange={(v) => onPriceFilterChange(v as "all" | "free" | "paid")}
        />
        <FilterSelect
          label="カテゴリ"
          value={selectedCategory}
          options={categoryOptions}
          onChange={onCategoryChange}
        />
      </div>

      <div className="hidden h-5 w-px bg-[#C5D9CC] sm:block" aria-hidden />

      <div className="flex flex-wrap gap-1">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={chip.onClick}
            className={`h-7 rounded-full border px-2.5 text-[10px] font-medium transition ${
              chip.active
                ? "border-[#2D7A4F] bg-white text-[#2D7A4F]"
                : "border-[#C5D9CC] bg-white/80 text-[#566358] hover:border-[#2D7A4F]/60 hover:bg-white"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => onSortChange("date_asc")}
          className={`font-semibold transition ${
            sortOrder === "date_asc"
              ? "text-[#2D7A4F]"
              : "text-[#566358] hover:text-[#1A2214]"
          }`}
        >
          人気順
        </button>
        <span className="text-[#C5D9CC]" aria-hidden>
          |
        </span>
        <button
          type="button"
          onClick={() => onSortChange("newest")}
          className={`transition ${
            sortOrder === "newest"
              ? "font-semibold text-[#2D7A4F]"
              : "text-[#566358] hover:text-[#1A2214]"
          }`}
        >
          新着順
        </button>
      </div>
      <p className="sr-only">
        現在の絞り込み: {selectedArea || "全国"}, {DATE_LABELS[dateRange]},
        {priceFilter === "free" ? "無料" : priceFilter === "paid" ? "有料" : "料金すべて"}
      </p>
    </div>
  );
}
