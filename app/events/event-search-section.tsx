"use client";

import { useState } from "react";
import { EVENT_TAGS } from "@/lib/db/types";
import { PREFECTURES } from "@/lib/prefectures";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearch: () => void;
};

function MonthCalendar({
  year,
  month,
  selectedDate,
  onDateSelect,
}: {
  year: number;
  month: number;
  selectedDate: string | null;
  onDateSelect: (d: string | null) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date().toISOString().split("T")[0];

  const days: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    days.push(`${year}-${m}-${day}`);
  }

  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {year}年 {month + 1}月
      </p>
      <table className="w-full min-w-[280px] border-collapse text-sm">
        <thead>
          <tr>
            {WEEKDAY.map((w) => (
              <th
                key={w}
                className="border border-zinc-200 py-1.5 text-center font-medium text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil((startPad + daysInMonth) / 7) }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {WEEKDAY.map((_, colIdx) => {
                const idx = rowIdx * 7 + colIdx;
                const d = days[idx];
                if (!d) {
                  return (
                    <td
                      key={colIdx}
                      className="border border-zinc-200 p-0 dark:border-zinc-600"
                    />
                  );
                }
                const isPast = d < today;
                const isSelected = selectedDate === d;
                return (
                  <td
                    key={colIdx}
                    className="border border-zinc-200 p-0.5 dark:border-zinc-600"
                  >
                    <button
                      type="button"
                      onClick={() => onDateSelect(isSelected ? null : d)}
                      disabled={isPast}
                      className={`flex h-8 w-full items-center justify-center rounded text-center ${
                        isPast
                          ? "cursor-not-allowed text-zinc-300 dark:text-zinc-600"
                          : isSelected
                            ? "bg-[var(--accent)] text-white"
                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {d.split("-")[2]}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EventSearchSection({
  selectedDate,
  onDateSelect,
  selectedTags,
  onTagsChange,
  selectedArea,
  onAreaChange,
  searchQuery,
  onSearchChange,
  onSearch,
}: Props) {
  const [calOffset, setCalOffset] = useState(0);
  const baseDate = new Date();
  const monthsToShow = 3;

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
            onClick={() => setCalOffset((o) => o - 1)}
            className="rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            前月
          </button>
          <button
            type="button"
            onClick={() => setCalOffset((o) => o + 1)}
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
        <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: monthsToShow }).map((_, i) => {
            const d = new Date(
              baseDate.getFullYear(),
              baseDate.getMonth() + calOffset + i,
              1
            );
            return (
              <MonthCalendar
                key={`${d.getFullYear()}-${d.getMonth()}`}
                year={d.getFullYear()}
                month={d.getMonth()}
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-8">
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
              className="w-full max-w-xs rounded border border-zinc-200 px-4 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
