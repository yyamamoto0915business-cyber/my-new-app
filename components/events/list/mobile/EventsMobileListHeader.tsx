"use client";

import { useRef, useState } from "react";
import { ChevronDown, LayoutGrid, List } from "lucide-react";
import type { EventSort } from "@/lib/events";
import { EventsMobileSelectPopover } from "./EventsMobileSelectPopover";

type Props = {
  totalCount: number;
  sortOrder: EventSort;
  onSortChange: (sort: EventSort) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
};

const SORT_OPTIONS = [
  { value: "date_asc", label: "開催日が近い順" },
  { value: "date_desc", label: "開催日が遠い順" },
  { value: "newest", label: "新着順" },
] as const;

function getSortLabel(sort: EventSort): string {
  return SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "並び替え";
}

export function EventsMobileListHeader({
  totalCount,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
}: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <p className="shrink-0 text-[12px] leading-none text-[#666666]">
        全{" "}
        <span className="font-semibold text-[#223344]">{totalCount}</span>
        件
      </p>

      <div className="flex min-w-0 items-center justify-end gap-1.5">
        <div ref={sortAnchorRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            className={`inline-flex h-8 max-w-[148px] items-center gap-0.5 rounded-full border px-2.5 text-[10px] font-medium transition ${
              sortOpen
                ? "border-[#b8dcc8] bg-[#eef6f2] text-[#2f6b4f]"
                : "border-[#e0e6de] bg-white text-[#666666] active:bg-[#f7f8f6]"
            }`}
            aria-expanded={sortOpen}
            aria-haspopup="listbox"
          >
            <span className="truncate">{getSortLabel(sortOrder)}</span>
            <ChevronDown
              className={`h-2.5 w-2.5 shrink-0 opacity-70 transition ${sortOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          <EventsMobileSelectPopover
            open={sortOpen}
            anchorRef={sortAnchorRef}
            options={[...SORT_OPTIONS]}
            value={sortOrder}
            onSelect={(v) => {
              onSortChange(v as EventSort);
              setSortOpen(false);
            }}
            onDismiss={() => setSortOpen(false)}
          />
        </div>

        <div
          className="flex shrink-0 rounded-[8px] border border-[#e0e6de] bg-white p-px"
          role="group"
          aria-label="表示形式"
        >
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`flex h-7 w-8 items-center justify-center rounded-[7px] transition ${
              viewMode === "grid"
                ? "bg-[#2f7d4e] text-white"
                : "text-[#666666] active:bg-[#f7f8f6]"
            }`}
            aria-label="グリッド表示"
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid className="h-[14px] w-[14px]" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`flex h-7 w-8 items-center justify-center rounded-[7px] transition ${
              viewMode === "list"
                ? "bg-[#2f7d4e] text-white"
                : "text-[#666666] active:bg-[#f7f8f6]"
            }`}
            aria-label="リスト表示"
            aria-pressed={viewMode === "list"}
          >
            <List className="h-[14px] w-[14px]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
