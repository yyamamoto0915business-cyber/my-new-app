"use client";

import { cn } from "@/lib/utils";
import { MOBILE_EVENT_TABS_ROW_PX } from "./layout-constants";

const TAB_ACTIVE =
  "border-b-2 border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400";
const TAB_INACTIVE =
  "border-b-2 border-transparent text-zinc-400 dark:text-zinc-500";

type Props = {
  tabs: readonly string[] | string[];
  value: string;
  onChange: (tab: string) => void;
  className?: string;
};

export function EventSectionTabs({ tabs, value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="イベントセクション"
      style={{ minHeight: MOBILE_EVENT_TABS_ROW_PX }}
      className={cn(
        "scrollbar-hide flex touch-pan-x gap-0 overflow-x-auto scroll-smooth overscroll-x-contain border-t border-[var(--mg-line)]/50 bg-white/95 px-3 backdrop-blur-sm dark:bg-zinc-900/95 sm:px-4",
        className
      )}
    >
      {tabs.map((t) => {
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t)}
            className={cn(
              "min-h-[var(--mg-touch-min)] shrink-0 whitespace-nowrap px-3.5 py-3 text-sm font-semibold tracking-tight transition-colors sm:px-4",
              active ? TAB_ACTIVE : TAB_INACTIVE
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
