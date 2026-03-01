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
}: Props) {
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  return (
    <section className="mt-12 border-t border-zinc-200 pt-10 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        イベント検索
      </h2>

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            日付範囲
          </h3>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value as DateRangeFilter)}
            className="mt-2 rounded border border-[var(--border)] bg-white px-4 py-2.5 text-sm dark:bg-zinc-800 dark:text-zinc-100"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            条件を指定して検索
          </h3>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="area-select" className="mb-2 block text-xs text-zinc-500 dark:text-zinc-400">
                地域で絞り込み（都道府県）
              </label>
              <select
                id="area-select"
                value={selectedArea}
                onChange={(e) => onAreaChange(e.target.value)}
                className="w-full max-w-xs rounded border border-[var(--border)] px-4 py-2.5 text-sm dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">全国</option>
                {PREFECTURES.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                カテゴリ
              </p>
              <div className="flex flex-wrap gap-2">
                {EVENT_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded px-3 py-1.5 text-sm ${
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
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              placeholder="イベント名・主催者・場所で検索..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              className="flex-1 rounded border border-[var(--border)] px-4 py-2.5 text-sm dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={onSearch}
              className="rounded bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              検索する
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
