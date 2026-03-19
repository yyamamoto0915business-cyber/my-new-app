"use client";

import { EVENT_TAGS } from "@/lib/db/types";
import { PREFECTURES } from "@/lib/prefectures";
import type { DateRangeFilter } from "@/lib/events";

type Props = {
  dateRange: DateRangeFilter;
  onDateRangeChange: (range: DateRangeFilter) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearch: () => void;
  /**
   * full: 日付/地域/カテゴリ/キーワード全部を表示
   * drawer: カテゴリ/キーワードだけを表示
   */
  variant?: "full" | "drawer";
};

const DATE_RANGE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "today", label: "今日" },
  { value: "week", label: "今週" },
  { value: "weekend", label: "週末" },
  { value: "month", label: "今月" },
  { value: "3months", label: "3ヶ月" },
];

export function EventSearchSection({
  dateRange,
  onDateRangeChange,
  selectedTags,
  onTagsChange,
  selectedArea,
  onAreaChange,
  searchQuery,
  onSearchChange,
  onSearch,
  variant = "full",
}: Props) {
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  return (
    <section className="space-y-5">
      {variant !== "drawer" && (
        <>
          <div>
            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              日付
            </h3>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value as DateRangeFilter)}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm dark:bg-zinc-800 dark:text-zinc-100"
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              地域
            </h3>
            <div className="mt-2 space-y-3">
              <select
                value={selectedArea}
                onChange={(e) => onAreaChange(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">全国</option>
                {PREFECTURES.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      <div>
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          カテゴリ
        </h3>
        <div
          className={`mt-2 -mx-4 flex gap-2 px-4 pb-1 ${
            variant === "drawer"
              ? "overflow-x-auto scrollbar-hide"
              : "flex-wrap overflow-x-visible"
          }`}
        >
          {EVENT_TAGS.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                selectedTags.includes(tag.id)
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          キーワード
        </h3>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="イベント名・主催者・場所で検索..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={onSearch}
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            検索する
          </button>
        </div>
      </div>
    </section>
  );
}
