"use client";

import { ChevronRight, LayoutGrid } from "lucide-react";
import { VOLUNTEER_DISCOVER_CATEGORIES } from "@/lib/volunteer-discover-categories";

type Props = {
  activeRoleType: string;
  onSelect: (categoryId: string) => void;
};

export function PcVolunteerCategorySidebar({ activeRoleType, onSelect }: Props) {
  return (
    <aside aria-label="カテゴリから探す" className="w-[260px] shrink-0 px-4 py-4">
      <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-3 shadow-sm">
        <h2 className="mb-2 px-1 text-[14px] font-semibold leading-none text-[#1A2214]">
          カテゴリから探す
        </h2>

        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => onSelect("")}
              className={`flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-left transition ${
                activeRoleType === ""
                  ? "bg-[#EAF4ED] text-[#1B2D1B]"
                  : "text-[#566358] hover:bg-[#f4f8f5] hover:text-[#2D7A4F]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[#f4f6f4]">
                  <LayoutGrid className="h-3.5 w-3.5 text-[#6a9080]" aria-hidden />
                </span>
                <span className="text-[12px] font-medium">すべて</span>
              </span>
              <ChevronRight className="h-3 w-3 shrink-0 text-[#c8d4cc]" aria-hidden />
            </button>
          </li>
          {VOLUNTEER_DISCOVER_CATEGORIES.map(({ id, label, emoji, iconBg }) => {
            const isActive = activeRoleType === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  className={`flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-left transition ${
                    isActive
                      ? "bg-[#EAF4ED] text-[#1B2D1B]"
                      : "text-[#566358] hover:bg-[#f4f8f5] hover:text-[#2D7A4F]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-sm"
                      style={{ backgroundColor: iconBg }}
                      aria-hidden
                    >
                      {emoji}
                    </span>
                    <span className="text-[12px] font-medium leading-snug">{label}</span>
                  </span>
                  <ChevronRight className="h-3 w-3 shrink-0 text-[#c8d4cc]" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
