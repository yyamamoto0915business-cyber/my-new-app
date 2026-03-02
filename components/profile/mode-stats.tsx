"use client";

import type { ProfileMode } from "./mode-switcher";
import { MODE_CONFIG } from "./mode-config";

type Props = {
  mode: ProfileMode;
  stat1: number;
  stat2: number;
  stat3: number;
  /** 主催モードの「要対応」内訳（ボランティア/参加者） */
  stat2Breakdown?: { volunteer: number; participant: number };
};

/** ステータスカード3枚（モード別ラベル） */
export function ModeStats({ mode, stat1, stat2, stat3, stat2Breakdown }: Props) {
  const config = MODE_CONFIG[mode];
  const showBreakdown = mode === "organizer" && stat2Breakdown;

  return (
    <section className="mb-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat1}</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">{config.stat1.label}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat2}</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">{config.stat2.label}</p>
          {showBreakdown && (stat2Breakdown.volunteer > 0 || stat2Breakdown.participant > 0) && (
            <p className="mt-1.5 text-[10px] text-[var(--foreground-muted)]">
              ボラ {stat2Breakdown.volunteer} / 参加 {stat2Breakdown.participant}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat3}</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">{config.stat3.label}</p>
        </div>
      </div>
    </section>
  );
}
