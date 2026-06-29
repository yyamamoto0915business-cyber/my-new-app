"use client";

import { useRef, useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import type { EventSort } from "@/lib/events";
import { EventsMobileSelectPopover } from "./EventsMobileSelectPopover";

type Props = {
  totalCount: number;
  sortOrder: EventSort;
  onSortChange: (sort: EventSort) => void;
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
}: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#E8EAE6] pt-3">
      <p className="shrink-0 text-[13px] leading-none text-[#666666]">
        全{" "}
        <span className="font-semibold text-[#223344]">{totalCount}</span>
        件
      </p>

      <div className="flex min-w-0 items-center justify-end gap-1.5">
        <div ref={sortAnchorRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            className={`inline-flex h-9 max-w-[160px] w-full items-center gap-0.5 rounded-full border px-2.5 text-[10px] font-medium transition ${
              sortOpen
                ? "border-[#C5D9C9] bg-[#E8F2EA] text-[#4A8C5E]"
                : "border-[#E0E6DE] bg-white text-[#666666] active:bg-[#F7F8F6]"
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

        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#4A8C5E] text-white"
          aria-hidden
        >
          <LayoutGrid className="h-[15px] w-[15px]" strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}
