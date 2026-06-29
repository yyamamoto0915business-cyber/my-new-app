"use client";

import { useRef, useState } from "react";
import {
  Baby,
  Building2,
  Calendar,
  ChevronDown,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";
import type { DateRangeFilter } from "@/lib/events";
import { PREFECTURES } from "@/lib/prefectures";
import {
  EVENTS_PC_DATE_OPTIONS,
  EVENTS_PC_SIDEBAR_CATEGORIES,
} from "../events-pc-constants";
import { EventsMobileSelectPopover } from "./EventsMobileSelectPopover";

export type EventsMobileFilterMenu = "category" | "date" | "area" | null;

type Props = {
  selectedCategory: string;
  dateRange: DateRangeFilter;
  selectedArea: string;
  childFriendlyOnly: boolean;
  priceFilter: "all" | "free" | "paid";
  indoorOnly: boolean;
  sortOrder: "date_asc" | "date_desc" | "newest";
  onCategoryChange: (key: string) => void;
  onChildFriendlyChange: (v: boolean) => void;
  onPriceFilterChange: (v: "all" | "free" | "paid") => void;
  onDateRangeChange: (range: DateRangeFilter) => void;
  onAreaChange: (area: string) => void;
  onIndoorChange: (v: boolean) => void;
  onSortChange: (sort: "date_asc" | "newest") => void;
};

function FilterChip({
  label,
  active,
  open,
  onClick,
  icon: Icon,
  compact,
}: {
  label: string;
  active?: boolean;
  open?: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border px-1.5 text-[10px] font-medium leading-tight transition sm:text-[11px] ${
        active || open
          ? "border-[#C5D9C9] bg-[#E8F2EA] text-[#4A8C5E]"
          : "border-[#E0E6DE] bg-white text-[#666666] active:bg-[#F7F8F6]"
      } ${compact ? "px-1" : "px-2"}`}
    >
      {Icon ? (
        <Icon
          className={`h-3 w-3 shrink-0 ${active || open ? "text-[#4A8C5E]" : "text-[#666666]"}`}
          aria-hidden
        />
      ) : null}
      <span className="truncate">{label}</span>
      {!Icon ? (
        <ChevronDown
          className={`h-2.5 w-2.5 shrink-0 opacity-70 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      ) : null}
    </button>
  );
}

function FilterMenuAnchor({
  menu,
  openMenu,
  options,
  value,
  onSelect,
  onToggle,
  scrollable,
  chip,
}: {
  menu: Exclude<EventsMobileFilterMenu, null>;
  openMenu: EventsMobileFilterMenu;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
  onToggle: () => void;
  scrollable?: boolean;
  chip: React.ReactNode;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const open = openMenu === menu;

  return (
    <div ref={anchorRef} className="relative">
      {chip}
      <EventsMobileSelectPopover
        open={open}
        anchorRef={anchorRef}
        options={options}
        value={value}
        onSelect={(v) => {
          onSelect(v);
          onToggle();
        }}
        onDismiss={onToggle}
        scrollable={scrollable}
      />
    </div>
  );
}

function getCategoryLabel(key: string): string {
  if (!key) return "カテゴリ";
  return EVENTS_PC_SIDEBAR_CATEGORIES.find((c) => c.key === key)?.label ?? "カテゴリ";
}

function getDateLabel(range: DateRangeFilter): string {
  if (range === "today") return "今日";
  if (range === "weekend") return "今週末";
  if (range === "week") return "来週以降";
  if (range === "month") return "今月";
  return "開催日";
}

const CATEGORY_OPTIONS = EVENTS_PC_SIDEBAR_CATEGORIES.map((c) => ({
  value: c.key,
  label: c.key ? c.label : "すべてのカテゴリ",
}));

const AREA_OPTIONS = [
  { value: "", label: "全国" },
  ...PREFECTURES.map((p) => ({ value: p, label: p })),
];

export function EventsMobileFilterBar({
  selectedCategory,
  dateRange,
  selectedArea,
  childFriendlyOnly,
  priceFilter,
  indoorOnly,
  sortOrder,
  onCategoryChange,
  onChildFriendlyChange,
  onPriceFilterChange,
  onDateRangeChange,
  onAreaChange,
  onIndoorChange,
  onSortChange,
}: Props) {
  const [openMenu, setOpenMenu] = useState<EventsMobileFilterMenu>(null);

  const toggle = (menu: Exclude<EventsMobileFilterMenu, null>) => {
    setOpenMenu((cur) => (cur === menu ? null : menu));
  };

  const popularActive = sortOrder === "newest";
  const weekendActive = dateRange === "today" || dateRange === "weekend";

  return (
    <div className="relative grid grid-cols-4 gap-2">
      <FilterMenuAnchor
        menu="category"
        openMenu={openMenu}
        options={CATEGORY_OPTIONS}
        value={selectedCategory}
        onSelect={onCategoryChange}
        onToggle={() => toggle("category")}
        chip={
          <FilterChip
            label={getCategoryLabel(selectedCategory)}
            active={Boolean(selectedCategory)}
            open={openMenu === "category"}
            onClick={() => toggle("category")}
          />
        }
      />

      <FilterMenuAnchor
        menu="date"
        openMenu={openMenu}
        options={EVENTS_PC_DATE_OPTIONS}
        value={dateRange}
        onSelect={(v) => onDateRangeChange(v as DateRangeFilter)}
        onToggle={() => toggle("date")}
        chip={
          <FilterChip
            label={getDateLabel(dateRange)}
            active={dateRange !== "all"}
            open={openMenu === "date"}
            onClick={() => toggle("date")}
          />
        }
      />

      <FilterMenuAnchor
        menu="area"
        openMenu={openMenu}
        scrollable
        options={AREA_OPTIONS}
        value={selectedArea}
        onSelect={onAreaChange}
        onToggle={() => toggle("area")}
        chip={
          <FilterChip
            label={selectedArea || "エリア"}
            active={Boolean(selectedArea)}
            open={openMenu === "area"}
            onClick={() => toggle("area")}
          />
        }
      />

      <FilterChip
        label="親子向け"
        active={childFriendlyOnly}
        onClick={() => onChildFriendlyChange(!childFriendlyOnly)}
        icon={Baby}
        compact
      />

      <FilterChip
        label="無料"
        active={priceFilter === "free"}
        onClick={() => onPriceFilterChange(priceFilter === "free" ? "all" : "free")}
        icon={CircleDollarSign}
        compact
      />
      <FilterChip
        label="今日・今週末"
        active={weekendActive}
        onClick={() => onDateRangeChange(weekendActive ? "all" : "weekend")}
        icon={Calendar}
        compact
      />
      <FilterChip
        label="屋内"
        active={indoorOnly}
        onClick={() => onIndoorChange(!indoorOnly)}
        icon={Building2}
        compact
      />
      <FilterChip
        label="人気順"
        active={popularActive}
        onClick={() => onSortChange(popularActive ? "date_asc" : "newest")}
        icon={TrendingUp}
        compact
      />
    </div>
  );
}
