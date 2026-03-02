"use client";

import { useState } from "react";

const CHIP_OPTIONS = [
  { id: "today", label: "今日" },
  { id: "weekend", label: "週末" },
  { id: "free", label: "無料" },
  { id: "kids", label: "親子" },
  { id: "workshop", label: "体験" },
];

type Props = {
  /** 将来のフィルタ用 state（UIのみでもOK） */
  chipFilter?: string;
  onChipChange?: (id: string) => void;
};

export function HomeHero({ chipFilter = "", onChipChange }: Props) {
  const [activeChip, setActiveChip] = useState(chipFilter);

  const handleChip = (id: string) => {
    const next = activeChip === id ? "" : id;
    setActiveChip(next);
    onChipChange?.(next);
  };

  return (
    <section className="mb-8" aria-label="ヒーロー">
      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--mg-line)] px-5 py-6 sm:px-6 sm:py-7"
        style={{ backgroundColor: "var(--mg-paper)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply dark:mix-blend-overlay dark:opacity-[0.03]"
          style={{
            backgroundImage: `repeating-conic-gradient(var(--mg-ink) 0% 0.25%, transparent 0% 0.5%)`,
            backgroundSize: "2px 2px",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-xl font-semibold text-zinc-800 dark:text-zinc-200 sm:text-2xl">
              今日の&quot;まちグリフ&quot;
            </h1>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              近くで起きてる出来事を、足あとでつなぐ
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CHIP_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleChip(c.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeChip === c.id
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white/80 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
