"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import type { DateRangeFilter } from "@/lib/events";
import { PREFECTURES } from "@/lib/prefectures";
import { EVENTS_PC_SIDEBAR_CATEGORIES, EVENTS_PC_DATE_OPTIONS } from "./events-pc-constants";

type Props = {
  regionLabel: string;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  selectedCategory: string;
  onCategoryChange: (key: string) => void;
  dateRange: DateRangeFilter;
  onDateRangeChange: (range: DateRangeFilter) => void;
  childFriendlyOnly: boolean;
  onChildFriendlyChange: (v: boolean) => void;
  priceFilter: "all" | "free" | "paid";
  onPriceFilterChange: (v: "all" | "free" | "paid") => void;
  reservationOnly: boolean;
  onReservationOnlyChange: (v: boolean) => void;
  indoorOnly: boolean;
  onIndoorChange: (v: boolean) => void;
};

export function EventsPcFilterSidebar({
  regionLabel,
  selectedArea,
  onAreaChange,
  selectedCategory,
  onCategoryChange,
  dateRange,
  onDateRangeChange,
  childFriendlyOnly,
  onChildFriendlyChange,
  priceFilter,
  onPriceFilterChange,
  reservationOnly,
  onReservationOnlyChange,
  indoorOnly,
  onIndoorChange,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const areaDisplay = selectedArea || regionLabel || "全国";

  return (
    <aside className="sticky top-14 w-[168px] shrink-0 self-start">
      <p className="mb-2.5 text-[12px] font-bold text-[#1A2214]">絞り込み</p>

      <div className="space-y-3.5">
        <div>
          <p className="mb-1 text-[10px] font-semibold text-[#8A9088]">開催エリア</p>
          <label className="relative block">
            <span className="sr-only">都道府県</span>
            <select
              value={selectedArea}
              onChange={(e) => onAreaChange(e.target.value)}
              className="flex h-8 w-full cursor-pointer appearance-none items-center rounded-[8px] border border-[#DDE8DF] bg-[#FAFCFA] pl-2 pr-7 text-[11px] text-[#1A2214] outline-none focus:border-[#2D7A4F]"
            >
              <option value="">{areaDisplay}</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#566358]"
              aria-hidden
            />
          </label>
          <Link
            href="/profile/edit"
            className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-[#2D7A4F] hover:underline"
          >
            <MapPin className="h-2.5 w-2.5" aria-hidden />
            エリアを変更
          </Link>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold text-[#8A9088]">カテゴリ</p>
          <ul className="space-y-px">
            {EVENTS_PC_SIDEBAR_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              const Icon = cat.Icon;
              return (
                <li key={`${cat.key}-${cat.label}`}>
                  <button
                    type="button"
                    onClick={() => onCategoryChange(cat.key)}
                    className={`flex w-full items-center gap-1.5 rounded-[6px] px-1.5 py-1 text-[11px] transition ${
                      active
                        ? "bg-[#EAF4ED] font-semibold text-[#2D7A4F]"
                        : "text-[#566358] hover:bg-[#F5F8F5]"
                    }`}
                  >
                    <Icon
                      className={`h-3 w-3 shrink-0 ${active ? "text-[#2D7A4F]" : "text-[#8A9088]"}`}
                      aria-hidden
                    />
                    <span className="truncate">{cat.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold text-[#8A9088]">日付</p>
          <ul className="space-y-px">
            {EVENTS_PC_DATE_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => onDateRangeChange(opt.value as DateRangeFilter)}
                  className={`w-full rounded-[6px] px-1.5 py-1 text-left text-[11px] transition ${
                    dateRange === opt.value
                      ? "bg-[#EAF4ED] font-semibold text-[#2D7A4F]"
                      : "text-[#566358] hover:bg-[#F5F8F5]"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setDetailOpen((o) => !o)}
          className="flex w-full items-center justify-between text-[11px] font-medium text-[#2D7A4F] hover:underline"
        >
          こだわり条件
          {detailOpen ? (
            <ChevronUp className="h-3 w-3" aria-hidden />
          ) : (
            <ChevronDown className="h-3 w-3" aria-hidden />
          )}
        </button>
        {detailOpen ? (
          <ul className="space-y-1.5 border-t border-[#EEF2EE] pt-1.5">
            {[
              {
                id: "family",
                label: "親子向け",
                checked: childFriendlyOnly,
                onChange: onChildFriendlyChange,
              },
              {
                id: "free",
                label: "無料",
                checked: priceFilter === "free",
                onChange: (v: boolean) => onPriceFilterChange(v ? "free" : "all"),
              },
              {
                id: "reservation",
                label: "要予約",
                checked: reservationOnly,
                onChange: onReservationOnlyChange,
              },
              {
                id: "indoor",
                label: "屋内",
                checked: indoorOnly,
                onChange: onIndoorChange,
              },
            ].map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-[#566358]">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.onChange(e.target.checked)}
                    className="h-3 w-3 rounded border-[#DDE8DF] accent-[#2D7A4F]"
                  />
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
