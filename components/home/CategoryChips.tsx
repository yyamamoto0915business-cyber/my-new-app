"use client";

import type { CategoryKey } from "@/lib/categories";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "@/lib/categories";
import {
  toggleCategoryPref,
  clearCategoryPrefs,
} from "@/lib/category-preference-storage";

const CHIP_BASE =
  "flex min-h-[40px] shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-95 whitespace-nowrap";

type Props = {
  selected: CategoryKey[];
  onChange: (selected: CategoryKey[]) => void;
  /** 保存済みフィルタ */
  savedOnly?: boolean;
  onSavedOnlyChange?: (v: boolean) => void;
  /** 絞り込みクリック時（BottomSheet用） */
  onFilterClick?: () => void;
  className?: string;
  /** チップを折り返し表示（Bottom Sheet用） */
  wrap?: boolean;
  /** カテゴリラベルを非表示 */
  hideLabel?: boolean;
};

export function CategoryChips({
  selected,
  onChange,
  savedOnly = false,
  onSavedOnlyChange,
  onFilterClick,
  className = "",
  wrap = false,
  hideLabel = false,
}: Props) {
  const handleToggleAll = () => {
    clearCategoryPrefs();
    onChange([]);
  };

  const handleToggle = (key: CategoryKey) => {
    const next = toggleCategoryPref(key);
    onChange(next);
  };

  const chipButtons = (
    <>
      <button
        type="button"
        onClick={handleToggleAll}
        className={`${CHIP_BASE} ${
            selected.length === 0
              ? "border border-zinc-300 bg-zinc-100/80 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-300"
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
              className={`${CHIP_BASE} ${
                isSelected
                  ? "border border-zinc-300 bg-zinc-100/80 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-300"
                  : "border border-[var(--border)] bg-white/80 text-zinc-600 hover:bg-zinc-50 dark:bg-[var(--background)] dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {label}
            </button>
          );
        })}
        {onSavedOnlyChange != null && (
          <button
            type="button"
            onClick={() => onSavedOnlyChange(!savedOnly)}
            className={`${CHIP_BASE} ${
              savedOnly
                ? "border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border border-[var(--border)] bg-white/80 text-zinc-600 hover:bg-zinc-50 dark:bg-[var(--background)] dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            保存済み
          </button>
        )}
      {onFilterClick != null && (
        <button
          type="button"
          onClick={onFilterClick}
          className={`${CHIP_BASE} border border-[var(--border)] bg-white/80 text-zinc-600 hover:bg-zinc-50 dark:bg-[var(--background)] dark:text-zinc-400 dark:hover:bg-zinc-800`}
          aria-label="絞り込み"
        >
          絞り込み
        </button>
      )}
    </>
  );

  if (wrap) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {!hideLabel && (
          <span className="shrink-0 text-sm text-[var(--foreground-muted)]" aria-hidden>
            カテゴリ：
          </span>
        )}
        <div className="flex flex-1 flex-wrap gap-2">{chipButtons}</div>
      </div>
    );
  }

  return (
    <div className={`relative flex min-h-[44px] items-center gap-2 ${className}`}>
      {!hideLabel && (
        <span className="shrink-0 text-sm text-[var(--foreground-muted)]" aria-hidden>
          カテゴリ：
        </span>
      )}
      <div className="relative flex-1 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {chipButtons}
        </div>
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-1 w-6 shrink-0 bg-gradient-to-l from-[var(--mg-paper,white)] to-transparent dark:from-[var(--background)]"
          aria-hidden
        />
      </div>
    </div>
  );
}
