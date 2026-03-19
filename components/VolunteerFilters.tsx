"use client";

import type { ReactNode } from "react";
import { PREFECTURES } from "@/lib/prefectures";
import { VOLUNTEER_ROLE_LABELS } from "@/lib/volunteer-roles-mock";
import type { VolunteerSort } from "@/lib/volunteer-utils";

type QuickFilters = {
  urgentOnly: boolean;
  travelFee: boolean;
  lodging: boolean;
  meal: boolean;
  reward: boolean;
  insurance: boolean;
  pickup: boolean;
};

type VolunteerFiltersProps = {
  category: string;
  prefecture?: string;
  quickFilters: QuickFilters;
  sort: VolunteerSort;
  onChangeCategory: (value: string) => void;
  onChangePrefecture?: (value: string) => void;
  onToggleQuickFilter: (key: string) => void;
  onChangeSort: (value: VolunteerSort) => void;
  onReset?: () => void;
};

const CATEGORY_CHIPS: { value: string; label: string }[] = [
  { value: "", label: "すべて" },
  { value: "operation", label: VOLUNTEER_ROLE_LABELS.operation },
  { value: "reception", label: VOLUNTEER_ROLE_LABELS.reception },
  { value: "guidance", label: VOLUNTEER_ROLE_LABELS.guidance },
  { value: "cleaning", label: VOLUNTEER_ROLE_LABELS.cleaning },
  { value: "photo", label: VOLUNTEER_ROLE_LABELS.photo },
  { value: "translation", label: VOLUNTEER_ROLE_LABELS.translation },
  { value: "streaming", label: VOLUNTEER_ROLE_LABELS.streaming },
  { value: "system", label: VOLUNTEER_ROLE_LABELS.system },
  { value: "tech_other", label: VOLUNTEER_ROLE_LABELS.tech_other },
  { value: "setup", label: VOLUNTEER_ROLE_LABELS.setup },
  { value: "disaster", label: VOLUNTEER_ROLE_LABELS.disaster },
];

const QUICK_CHIPS: { key: keyof QuickFilters; label: string; icon: string }[] = [
  { key: "urgentOnly", label: "緊急のみ", icon: "⚡" },
  { key: "travelFee", label: "交通費", icon: "🚃" },
  { key: "lodging", label: "宿泊", icon: "🏨" },
  { key: "meal", label: "食事", icon: "🍱" },
  { key: "reward", label: "謝礼", icon: "🎁" },
  { key: "insurance", label: "保険", icon: "🛡️" },
  { key: "pickup", label: "送迎", icon: "🚌" },
];

function ChipButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--border)] bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/20 dark:text-zinc-200 dark:hover:bg-zinc-800/40"
      }`}
    >
      {children}
    </button>
  );
}

export function VolunteerFilters({
  category,
  prefecture,
  quickFilters,
  sort,
  onChangeCategory,
  onChangePrefecture,
  onToggleQuickFilter,
  onChangeSort,
  onReset,
}: VolunteerFiltersProps) {
  return (
    <section className="mb-6 rounded-3xl border border-zinc-200/60 bg-white/80 p-4 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/80">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            条件で絞り込み
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            気になる募集を、気軽に見つけてください。
          </p>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-[36px] rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/20 dark:text-zinc-200 dark:hover:bg-zinc-800/40"
          >
            リセット
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:gap-5">
        {/* 種別チップ（横スクロール） */}
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400">種別</label>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide">
            {CATEGORY_CHIPS.map((c) => (
              <ChipButton
                key={c.value || c.label}
                selected={category === c.value}
                onClick={() => onChangeCategory(c.value)}
              >
                {c.label}
              </ChipButton>
            ))}
          </div>
        </div>

        {/* クイックフィルターチップ（横スクロール） */}
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400">
            クイックフィルター
          </label>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide">
            {QUICK_CHIPS.map((c) => (
              <ChipButton
                key={c.key}
                selected={quickFilters[c.key]}
                onClick={() => onToggleQuickFilter(c.key)}
              >
                <span aria-hidden className="mr-1 text-[12px]">
                  {c.icon}
                </span>
                {c.label}
              </ChipButton>
            ))}
          </div>
        </div>

        {/* 並び替え */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              並び替え
            </label>
            <select
              value={sort}
              onChange={(e) => onChangeSort(e.target.value as VolunteerSort)}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900/20 dark:text-zinc-100"
            >
              <option value="recommended">おすすめ</option>
              <option value="newest">新着</option>
              <option value="soonest">日程が近い</option>
            </select>
          </div>
        </div>

        {/* 地域（既存のクエリ保持） */}
        {typeof onChangePrefecture === "function" && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              地域
            </label>
            <select
              value={prefecture ?? ""}
              onChange={(e) => onChangePrefecture(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900/20 dark:text-zinc-100"
            >
              <option value="">全国</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </section>
  );
}

