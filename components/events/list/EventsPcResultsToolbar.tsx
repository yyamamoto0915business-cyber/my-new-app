"use client";

import { LayoutGrid, List } from "lucide-react";
import { EVENTS_PC_PAGE_SIZES } from "./events-pc-constants";

type Props = {
  totalCount: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
};

export function EventsPcResultsToolbar({
  totalCount,
  pageSize,
  onPageSizeChange,
  viewMode,
  onViewModeChange,
}: Props) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p className="text-[12px] text-[#566358]">
        全{" "}
        <span className="font-semibold text-[#1A2214]">{totalCount}</span>
        件
      </p>

      <div className="flex items-center gap-2">
        <label className="flex items-center">
          <span className="sr-only">表示件数</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 cursor-pointer rounded-[6px] border border-[#DDE8DF] bg-white px-2 text-[11px] text-[#1A2214] outline-none"
          >
            {EVENTS_PC_PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}件
              </option>
            ))}
          </select>
        </label>

        <div
          className="flex rounded-[6px] border border-[#DDE8DF] bg-white p-px"
          role="group"
          aria-label="表示形式"
        >
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`flex h-6 w-7 items-center justify-center rounded-[5px] transition ${
              viewMode === "grid"
                ? "bg-[#EAF4ED] text-[#2D7A4F]"
                : "text-[#566358] hover:bg-[#F5F8F5]"
            }`}
            aria-label="グリッド表示"
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`flex h-6 w-7 items-center justify-center rounded-[5px] transition ${
              viewMode === "list"
                ? "bg-[#EAF4ED] text-[#2D7A4F]"
                : "text-[#566358] hover:bg-[#F5F8F5]"
            }`}
            aria-label="リスト表示"
            aria-pressed={viewMode === "list"}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
