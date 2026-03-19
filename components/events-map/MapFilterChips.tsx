"use client";

import type { ReactNode } from "react";
import type { DateRangeFilter } from "@/lib/events";

type Props = {
  priceFilter: "all" | "free" | "paid";
  onPriceFilterChange: (v: "all" | "free" | "paid") => void;
  childFriendlyOnly: boolean;
  onChildFriendlyOnlyChange: (v: boolean) => void;
  dateRange: DateRangeFilter;
  onDateRangeChange: (v: DateRangeFilter) => void;
};

const ChipButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 text-sm font-semibold ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-200 dark:hover:bg-zinc-900/50"
      }`}
    >
      {children}
    </button>
  );
};

export function MapFilterChips({
  priceFilter,
  onPriceFilterChange,
  childFriendlyOnly,
  onChildFriendlyOnlyChange,
  dateRange,
  onDateRangeChange,
}: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
      <ChipButton active={priceFilter === "all"} onClick={() => onPriceFilterChange("all")}>
        料金：すべて
      </ChipButton>
      <ChipButton active={priceFilter === "free"} onClick={() => onPriceFilterChange("free")}>
        無料
      </ChipButton>
      <ChipButton active={priceFilter === "paid"} onClick={() => onPriceFilterChange("paid")}>
        有料
      </ChipButton>
      <ChipButton
        active={childFriendlyOnly}
        onClick={() => onChildFriendlyOnlyChange(!childFriendlyOnly)}
      >
        子連れOK
      </ChipButton>
      <ChipButton
        active={dateRange === "today"}
        onClick={() => onDateRangeChange(dateRange === "today" ? "all" : "today")}
      >
        今日
      </ChipButton>
      <ChipButton
        active={dateRange === "weekend"}
        onClick={() => onDateRangeChange(dateRange === "weekend" ? "all" : "weekend")}
      >
        今週末
      </ChipButton>
    </div>
  );
}

