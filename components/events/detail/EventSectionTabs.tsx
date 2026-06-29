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
  variant?: "mobile" | "pc";
};

export function EventSectionTabs({
  tabs,
  value,
  onChange,
  className,
  variant = "mobile",
}: Props) {
  const isPc = variant === "pc";

  return (
    <div
      role="tablist"
      aria-label="イベントセクション"
      style={{ minHeight: isPc ? undefined : MOBILE_EVENT_TABS_ROW_PX }}
      className={cn(
        "scrollbar-hide flex touch-pan-x gap-1 overflow-x-auto scroll-smooth overscroll-x-contain",
        isPc
          ? "border-b border-[var(--mg-line)] bg-transparent px-0"
          : "border-t border-[var(--mg-line)]/50 bg-white/95 px-3 backdrop-blur-sm dark:bg-zinc-900/95 sm:px-4",
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
              "shrink-0 whitespace-nowrap text-sm font-semibold tracking-tight transition-colors",
              isPc
                ? "px-3 py-3"
                : "min-h-[var(--mg-touch-min)] px-3.5 py-3 sm:px-4",
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
