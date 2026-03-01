"use client";

import { useState, useEffect } from "react";

const PROFILE_TAB_KEY = "profile-dashboard-tab";

export type ProfileRoleTab = "participant" | "volunteer" | "organizer";

type Props = {
  activeTab: ProfileRoleTab;
  onTabChange: (tab: ProfileRoleTab) => void;
};

const TABS: { id: ProfileRoleTab; label: string }[] = [
  { id: "participant", label: "イベント参加者" },
  { id: "volunteer", label: "ボランティア" },
  { id: "organizer", label: "主催者" },
];

export function ProfileRoleTabs({ activeTab, onTabChange }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(PROFILE_TAB_KEY) as ProfileRoleTab | null;
    if (saved && TABS.some((t) => t.id === saved)) {
      onTabChange(saved);
    }
  }, [onTabChange]);

  const handleTabClick = (tab: ProfileRoleTab) => {
    onTabChange(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem(PROFILE_TAB_KEY, tab);
    }
  };

  if (!mounted) return null;

  return (
    <div
      role="tablist"
      className="flex gap-1 rounded-lg border border-[var(--border)] bg-zinc-50/80 p-1 dark:border-zinc-700 dark:bg-zinc-800/50"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-white text-[var(--accent)] shadow-sm dark:bg-zinc-900 dark:text-[var(--accent)]"
              : "text-[var(--foreground-muted)] hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
