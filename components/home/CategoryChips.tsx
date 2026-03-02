"use client";

import type { CategoryKey } from "@/lib/inferCategory";
import { CATEGORY_KEYS } from "@/lib/inferCategory";
import {
  getCategoryPrefs,
  setCategoryPrefs,
  toggleCategoryPref,
  clearCategoryPrefs,
} from "@/lib/category-preference-storage";

type Props = {
  selected: CategoryKey[];
  onChange: (selected: CategoryKey[]) => void;
  className?: string;
};

export function CategoryChips({ selected, onChange, className = "" }: Props) {
  const handleToggleAll = () => {
    clearCategoryPrefs();
    onChange([]);
  };

  const handleToggle = (cat: CategoryKey) => {
    const next = toggleCategoryPref(cat);
    onChange(next);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="shrink-0 text-sm text-[var(--foreground-muted)]"
        aria-hidden="true"
      >
        カテゴリ：
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={handleToggleAll}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            selected.length === 0
              ? "border-2 border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border border-[var(--border)] bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-[var(--background)] dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          すべて
        </button>
        {CATEGORY_KEYS.map((cat) => {
          const isSelected = selected.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleToggle(cat)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-2 border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border border-[var(--border)] bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-[var(--background)] dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
