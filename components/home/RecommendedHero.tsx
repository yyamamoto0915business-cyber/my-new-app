"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { getHeroEventsWithFallback } from "@/lib/filterEvents";
import { addToRecent } from "@/lib/bookmark-storage";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CategoryChips } from "./CategoryChips";
import { clearCategoryPrefs } from "@/lib/category-preference-storage";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  events: Event[];
  loading: boolean;
  areaPreference: string;
  categoryPrefs: CategoryKey[];
  onCategoryChange: (prefs: CategoryKey[]) => void;
  bookmarkIds: string[];
  onBookmarkToggle: (eventId: string) => void;
  onOpenBookmarks: () => void;
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
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const heroEvents = getHeroEventsWithFallback(
    events,
    areaPreference,
    categoryPrefs,
    3
  );
  const [featured, ...subCards] = heroEvents;

  const handleCardClick = (eventId: string) => {
    addToRecent(eventId);
    router.push(`/events/${eventId}`);
  };

  const areaPart = areaPreference ? `${areaPreference} の` : "";
  const catLabels =
    categoryPrefs.length > 0
      ? categoryPrefs
          .slice(0, 2)
          .map((k) => CATEGORY_LABELS[k])
          .join("・")
      : "";
  const catPart =
    categoryPrefs.length > 0
      ? categoryPrefs.length <= 2
        ? `${catLabels} の`
        : `${catLabels}…他${categoryPrefs.length - 2}件 の`
      : "";
  const subText =
    areaPart || catPart
      ? `${areaPart}${catPart}おすすめ`
      : "地域・カテゴリを選ぶと絞り込めます";

  if (loading) {
    return (
      <section className="py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              おすすめ
            </h2>
            <div className="h-9 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-9 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700 sm:col-span-2" />
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-28 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </section>
    );
  }

  if (heroEvents.length === 0) return null;

  const handleFilterReset = () => {
    clearCategoryPrefs();
    onCategoryChange([]);
    setFilterOpen(false);
  };

  return (
    <section className="py-6 sm:py-8" aria-label="おすすめ">
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
            おすすめ
          </h2>
          <button
            type="button"
            onClick={onOpenBookmarks}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2.5 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] active:bg-[var(--accent-soft)] dark:bg-[var(--background)] dark:hover:bg-[var(--accent-soft)]"
            aria-label={`保存済み${bookmarkIds.length > 0 ? `（${bookmarkIds.length}件）` : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                clipRule="evenodd"
              />
            </svg>
            <span>保存</span>
            {bookmarkIds.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent)]/20 px-1 text-xs font-medium text-[var(--accent)]">
                {bookmarkIds.length}
              </span>
            )}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <CategoryChips
            selected={categoryPrefs}
            onChange={onCategoryChange}
            className="min-w-0 flex-1 sm:flex-initial"
            hideLabel
          />
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-[var(--background)] dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="絞り込み"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-[var(--foreground-muted)] line-clamp-2 sm:line-clamp-none">{subText}</p>

      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        categoryPrefs={categoryPrefs}
        onCategoryChange={onCategoryChange}
        onReset={handleFilterReset}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {/* 推し：大きいカード */}
        {featured && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(featured.id)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleCardClick(featured.id)
            }
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.995] dark:bg-[var(--background)] sm:col-span-2"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <EventThumbnail
                imageUrl={featured.imageUrl}
                alt={featured.title}
                rounded="none"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              {getPrimaryCategory(featured) && (
                <div className="absolute left-3 top-3 z-10">
                  <CategoryBadge event={featured} />
                </div>
              )}
              <div
                className="absolute right-3 top-3 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <BookmarkToggle
                  eventId={featured.id}
                  isActive={bookmarkIds.includes(featured.id)}
                  onToggle={onBookmarkToggle}
                />
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-xs font-medium drop-shadow-md sm:text-xs">
                  {featured.organizerName}
                </p>
                <h3 className="mt-1 line-clamp-2 font-serif text-base font-semibold drop-shadow-md sm:text-lg">
                  {featured.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-xs drop-shadow-md">
                  {featured.date} {featured.startTime}
                  {featured.endTime ? `〜${featured.endTime}` : ""} ・ {featured.location}
                </p>
              </div>
              {featured.price === 0 && (
                <span className="absolute right-12 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                  無料
                </span>
              )}
            </div>
          </div>
        )}

        {/* 小カード2件 */}
        <div className="flex flex-col gap-4">
          {subCards.map((e) => {
            const d = new Date(e.date + "T12:00:00");
            const dayLabel = WEEKDAY[d.getDay()];
            const dateStr = e.date
              .replace(/-/g, "/")
              .replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
            const timeStr = e.endTime
              ? `${e.startTime}〜${e.endTime}`
              : e.startTime;
            return (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick(e.id)}
                onKeyDown={(ev) =>
                  ev.key === "Enter" && handleCardClick(e.id)
                }
                className="group flex min-h-[88px] cursor-pointer gap-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:scale-[0.98] dark:bg-[var(--background)] sm:min-h-0 sm:p-2"
              >
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl">
                  <EventThumbnail
                    imageUrl={e.imageUrl}
                    alt={e.title}
                    rounded="none"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                  {getPrimaryCategory(e) && (
                    <div className="absolute left-1.5 top-1.5 z-10">
                      <CategoryBadge event={e} className="px-1.5 py-0.5 text-[10px]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {e.title}
                  </h4>
                  <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                    {dayLabel} {dateStr} {timeStr}
                  </p>
                </div>
                <div
                  className="shrink-0 self-start"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <BookmarkToggle
                    eventId={e.id}
                    isActive={bookmarkIds.includes(e.id)}
                    onToggle={onBookmarkToggle}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
