"use client";

import { cn } from "@/lib/utils";

export type EventListTab = "all" | "public" | "draft" | "ended" | "archived";

type Props = {
  activeTab: EventListTab;
  onTabChange: (tab: EventListTab) => void;
  counts: {
    all: number;
    public: number;
    draft: number;
    ended: number;
    archived: number;
  };
  showEndedInAll: boolean;
  onShowEndedInAllChange: (value: boolean) => void;
};

const TABS: { id: EventListTab; label: string; countKey: keyof Props["counts"] }[] = [
  { id: "all", label: "すべて", countKey: "all" },
  { id: "public", label: "公開中", countKey: "public" },
  { id: "draft", label: "下書き", countKey: "draft" },
  { id: "ended", label: "終了したイベント", countKey: "ended" },
  { id: "archived", label: "アーカイブ", countKey: "archived" },
];

export function EventListFilterTabs({
  activeTab,
  onTabChange,
  counts,
  showEndedInAll,
  onShowEndedInAllChange,
}: Props) {
  return (
    <div className="org-events-list-tabs">
      <div className="org-events-list-tabs__row" role="tablist" aria-label="イベント一覧の切り替え">
        {TABS.map(({ id, label, countKey }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={cn(
                "org-events-list-tabs__tab",
                active && "is-active",
                id === "archived" && "org-events-list-tabs__tab--archive"
              )}
            >
              {label}
              <span className="org-events-list-tabs__count">({counts[countKey]})</span>
            </button>
          );
        })}
      </div>

      {activeTab === "all" ? (
        <label className="org-events-list-tabs__toggle">
          <span className="org-events-list-tabs__toggle-label">終了したイベントを表示</span>
          <button
            type="button"
            role="switch"
            aria-checked={showEndedInAll}
            onClick={() => onShowEndedInAllChange(!showEndedInAll)}
            className={cn("org-events-list-tabs__switch", showEndedInAll && "is-on")}
          >
            <span className="org-events-list-tabs__switch-knob" aria-hidden />
          </button>
        </label>
      ) : null}
    </div>
  );
}
