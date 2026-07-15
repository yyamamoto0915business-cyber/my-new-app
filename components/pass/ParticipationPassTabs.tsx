"use client";

import { PASS_TABS, type PassTabId } from "@/lib/participation-pass";
import { cn } from "@/lib/utils";

type Props = {
  activeTab: PassTabId;
  onTabChange: (tab: PassTabId) => void;
  className?: string;
};

export function ParticipationPassTabs({ activeTab, onTabChange, className }: Props) {
  return (
    <div
      className={cn("flex shrink-0 border-b border-[#e4ebe4]", className)}
      role="tablist"
      aria-label="参加パスの絞り込み"
    >
      {PASS_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative -mb-px min-h-[44px] flex-1 px-2 py-2 text-[13px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a9a68]/40 focus-visible:ring-offset-2",
              active ? "text-[#2d7a4f]" : "text-[#6a7468] hover:text-[#3a4840]"
            )}
          >
            <span className="whitespace-nowrap">{tab.label}</span>
            {active && (
              <span
                className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-[#4a9a68]"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
