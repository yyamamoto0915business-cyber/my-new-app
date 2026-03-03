"use client";

import type { CategoryKey } from "@/lib/categories";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "@/lib/categories";
import {
  toggleCategoryPref,
  clearCategoryPrefs,
} from "@/lib/category-preference-storage";

type Props = {
  selected: CategoryKey[];
  onChange: (selected: CategoryKey[]) => void;
  className?: string;
  /** チップを折り返し表示（Bottom Sheet用） */
  wrap?: boolean;
  /** カテゴリラベルを非表示（1行要約時） */
  hideLabel?: boolean;
};

export function CategoryChips({ selected, onChange, className = "", wrap = false, hideLabel = false }: Props) {
  const handleToggleAll = () => {
    clearCategoryPrefs();
    onChange([]);
  };

  const handleToggle = (key: CategoryKey) => {
    const next = toggleCategoryPref(key);
    onChange(next);
  };

  return (
    <div className={`flex items-start gap-2 sm:items-center ${className}`}>
      {!hideLabel && (
        <span
          className="mt-2 shrink-0 text-sm text-[var(--foreground-muted)] sm:mt-0"
          aria-hidden="true"
        >
          カテゴリ：
        </span>
      )}
      <div
        className={`flex flex-1 gap-2 pb-1 sm:min-h-0 ${
          wrap ? "min-h-0 flex-wrap" : "min-h-[44px] overflow-x-auto scrollbar-hide"
        }`}
      >
        <button
          type="button"
          onClick={handleToggleAll}
          className={`flex shrink-0 items-center rounded-full px-3 py-2 text-xs font-medium transition-colors active:scale-95 sm:py-1.5 ${
            selected.length === 0
              ? "border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border border-[var(--border)] bg-white/80 text-zinc-600 hover:bg-zinc-50 dark:bg-[var(--background)] dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          すべて
        </button>
        {CATEGORY_KEYS.map((key) => {
          const isSelected = selected.includes(key);
          const label = CATEGORY_LABELS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleToggle(key)}
              className={`flex shrink-0 items-center rounded-full px-3 py-2 text-xs font-medium transition-colors active:scale-95 sm:py-1.5 ${
                isSelected
                  ? "border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border border-[var(--border)] bg-white/80 text-zinc-600 hover:bg-zinc-50 dark:bg-[var(--background)] dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
