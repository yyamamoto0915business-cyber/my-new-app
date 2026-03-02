"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type ProfileMode = "participant" | "volunteer" | "organizer";

const MODES: { id: ProfileMode; label: string; emoji: string }[] = [
  { id: "participant", label: "参加する", emoji: "🎟" },
  { id: "volunteer", label: "手伝う", emoji: "🤝" },
  { id: "organizer", label: "主催する", emoji: "📣" },
];

type Props = {
  activeMode: ProfileMode;
  onModeChange?: (mode: ProfileMode) => void;
};

/** モード切替タブ（セグメント風・URL と連動） */
export function ModeSwitcher({ activeMode, onModeChange }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabClick = (mode: ProfileMode) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("mode", mode);
    router.replace(`/profile?${next.toString()}`, { scroll: false });
    if (typeof window !== "undefined") {
      localStorage.setItem("mg.profile.mode", mode);
    }
    onModeChange?.(mode);
  };

  return (
    <div
      role="tablist"
      className="flex gap-0.5 rounded-lg border border-[var(--border)] bg-zinc-50/80 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/50"
    >
      {MODES.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeMode === tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex-1 rounded-md px-2 py-2.5 text-sm font-medium transition-colors sm:px-3 ${
            activeMode === tab.id
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
              : "text-[var(--foreground-muted)] hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <span className="mr-0.5">{tab.emoji}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
