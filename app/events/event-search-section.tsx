"use client";

import { useState } from "react";
import { EVENT_TAGS } from "@/lib/db/types";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearch: () => void;
};

export function EventSearchSection({
  selectedDate,
  onDateSelect,
  selectedTags,
  onTagsChange,
  searchQuery,
  onSearchChange,
  onSearch,
}: Props) {
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const firstDay = new Date(calMonth.year, calMonth.month, 1);
  const lastDay = new Date(calMonth.year, calMonth.month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date().toISOString().split("T")[0];

  const handlePrevMonth = () => {
    if (calMonth.month === 0) {
      setCalMonth({ year: calMonth.year - 1, month: 11 });
    } else {
      setCalMonth({ year: calMonth.year, month: calMonth.month - 1 });
    }
  };

  const handleNextMonth = () => {
    if (calMonth.month === 11) {
      setCalMonth({ year: calMonth.year + 1, month: 0 });
    } else {
      setCalMonth({ year: calMonth.year, month: calMonth.month + 1 });
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const days: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const y = calMonth.year;
    const m = String(calMonth.month + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
  }

  return (
    <section className="mt-12 border-t border-zinc-200 pt-10 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        イベント検索
      </h2>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          日付から選ぶ
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          ※日付を押すとその日を含む近日開催のイベントを見ることができます
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            前月
          </button>
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {calMonth.year}年 {calMonth.month + 1}月
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            次月
          </button>
          {selectedDate && (
            <button
              type="button"
              onClick={() => onDateSelect(null)}
              className="ml-2 text-xs text-[var(--accent)] hover:underline"
            >
              クリア
            </button>
          )}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-sm">
          {WEEKDAY.map((w) => (
            <div
              key={w}
              className="py-1 font-medium text-zinc-500 dark:text-zinc-400"
            >
              {w}
            </div>
          ))}
          {days.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            const isPast = d < today;
            const isSelected = selectedDate === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onDateSelect(isSelected ? null : d)}
                disabled={isPast}
                className={`py-1.5 text-sm rounded ${
                  isPast
                    ? "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                    : isSelected
                      ? "bg-[var(--accent)] text-white"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {d.split("-")[2]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          条件を指定して検索
        </h3>
        <div className="mt-3">
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            全てのカテゴリ
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
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="イベント名・主催者・場所で検索..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="flex-1 rounded border border-zinc-200 px-4 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
    </section>
  );
}
