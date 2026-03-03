"use client";

import { useState } from "react";
import Link from "next/link";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getHeroWithSubCards } from "@/lib/filterEvents";
import { CategoryChips } from "./CategoryChips";
import { SectionHeader } from "./SectionHeader";
import { EventHeroCard } from "./EventHeroCard";
import { clearCategoryPrefs } from "@/lib/category-preference-storage";

type Props = {
  events: Event[];
  loading: boolean;
  areaPreference: string;
  categoryPrefs: CategoryKey[];
  onCategoryChange: (prefs: CategoryKey[]) => void;
  bookmarkIds: string[];
  onBookmarkToggle: (eventId: string) => void;
  onOpenBookmarks?: () => void;
};

function FilterBottomSheet({
  isOpen,
  onClose,
  categoryPrefs,
  onCategoryChange,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  categoryPrefs: CategoryKey[];
  onCategoryChange: (prefs: CategoryKey[]) => void;
  onReset: () => void;
}) {
  if (!isOpen) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="絞り込み"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-hidden rounded-t-2xl border-t border-[var(--border)] bg-white shadow-lg dark:bg-[var(--background)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">絞り込み</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full p-2 text-[var(--foreground-muted)] hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="閉じる"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">カテゴリ</p>
            <CategoryChips selected={categoryPrefs} onChange={onCategoryChange} wrap />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onReset}
              className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              リセット
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] flex-1 rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white hover:opacity-90"
            >
              適用
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** おすすめ0件時の空状態UI */
function EmptyState({ onOpenFilter }: { onOpenFilter: () => void }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-zinc-50/80 p-8 text-center dark:bg-zinc-800/40">
      <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
        おすすめのイベントがありません
      </p>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        地域やカテゴリを変えると見つかるかも
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenFilter}
          className="min-h-[44px] rounded-xl border border-[var(--accent)] bg-white px-6 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] dark:bg-[var(--background)]"
        >
          絞り込みを変える
        </button>
        <Link
          href="/events"
          className="min-h-[44px] inline-flex items-center rounded-xl bg-[var(--accent)] px-6 text-sm font-medium text-white hover:opacity-90"
        >
          イベント一覧を見る
        </Link>
      </div>
    </div>
  );
}

export function RecommendedHero({
  events,
  loading,
  areaPreference,
  categoryPrefs,
  onCategoryChange,
  bookmarkIds,
  onBookmarkToggle,
  onOpenBookmarks,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);

  const { featured, subCards } = getHeroWithSubCards(
    events,
    areaPreference,
    categoryPrefs,
    3
  );

  const allHero = [featured, ...subCards].filter((e): e is NonNullable<typeof e> => e != null);
  const displayEvents = savedOnly
    ? allHero.filter((e) => bookmarkIds.includes(e.id))
    : allHero;
  const displayFeatured = displayEvents[0] ?? null;
  const displaySubCards = displayEvents.slice(1, 3);

  const handleFilterReset = () => {
    clearCategoryPrefs();
    onCategoryChange([]);
    setFilterOpen(false);
  };

  const categoryBadge =
    categoryPrefs.length === 1
      ? CATEGORY_LABELS[categoryPrefs[0]]
      : categoryPrefs.length > 1
        ? `${CATEGORY_LABELS[categoryPrefs[0]]}他`
        : undefined;

  if (loading) {
    return (
      <section className="space-y-6" aria-label="おすすめ">
        <SectionHeader title="おすすめ（あなた向け）" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-[200px] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700 sm:col-span-2" />
          <div className="space-y-4">
            <div className="h-[88px] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-[88px] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-label="おすすめ">
      <SectionHeader title="おすすめ（あなた向け）" badge={categoryBadge} />
      <CategoryChips
        selected={categoryPrefs}
        onChange={onCategoryChange}
        savedOnly={savedOnly}
        onSavedOnlyChange={setSavedOnly}
        onFilterClick={() => setFilterOpen(true)}
        className="min-w-0"
        hideLabel
      />

      {displayEvents.length === 0 ? (
        <EmptyState onOpenFilter={() => setFilterOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {displayFeatured && (
            <div className="sm:col-span-2">
              <EventHeroCard
                event={displayFeatured}
                isBookmarked={bookmarkIds.includes(displayFeatured.id)}
                onBookmarkToggle={onBookmarkToggle}
              />
            </div>
          )}
          <div className="flex flex-col gap-4">
            {displaySubCards.map((e) => (
              <EventHeroCard
                key={e.id}
                event={e}
                isBookmarked={bookmarkIds.includes(e.id)}
                onBookmarkToggle={onBookmarkToggle}
              />
            ))}
          </div>
        </div>
      )}

      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        categoryPrefs={categoryPrefs}
        onCategoryChange={onCategoryChange}
        onReset={handleFilterReset}
      />
    </section>
  );
}
