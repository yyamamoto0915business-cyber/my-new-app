"use client";

import { useState } from "react";
import Link from "next/link";
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

/** 統一イベントカード（1枚） */
function UnifiedEventCard({
  event,
  isBookmarked,
  onBookmarkToggle,
  onClick,
}: {
  event: Event;
  isBookmarked: boolean;
  onBookmarkToggle: (id: string) => void;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.995] dark:bg-[var(--background)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        {getPrimaryCategory(event) && (
          <div className="absolute left-2 top-2 z-10">
            <CategoryBadge event={event} />
          </div>
        )}
        <div
          className="absolute right-2 top-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkToggle
            eventId={event.id}
            isActive={isBookmarked}
            onToggle={onBookmarkToggle}
          />
        </div>
        <div className="absolute bottom-2 left-2 right-2 text-white">
          <p className="text-xs font-medium drop-shadow-md">{event.organizerName}</p>
          <h3 className="mt-0.5 line-clamp-2 font-serif text-sm font-semibold drop-shadow-md">
            {event.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs drop-shadow-md opacity-95">
            {event.date} {event.startTime}
            {event.endTime ? `〜${event.endTime}` : ""} ・ {event.location}
          </p>
        </div>
        {event.price === 0 ? (
          <span className="absolute right-10 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            無料
          </span>
        ) : (
          <span className="absolute right-10 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-zinc-800">
            ¥{event.price}
          </span>
        )}
      </div>
    </div>
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
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const heroEvents = getHeroEventsWithFallback(
    events,
    areaPreference,
    categoryPrefs,
    3
  );

  const handleCardClick = (eventId: string) => {
    addToRecent(eventId);
    router.push(`/events/${eventId}`);
  };

  const handleFilterReset = () => {
    clearCategoryPrefs();
    onCategoryChange([]);
    setFilterOpen(false);
  };

  if (loading) {
    return (
      <section className="space-y-6" aria-label="おすすめ">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
            おすすめ
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[200px] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-label="おすすめ">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
          おすすめ
        </h2>
        <button
          type="button"
          onClick={onOpenBookmarks}
          className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2.5 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] dark:bg-[var(--background)] dark:hover:bg-[var(--accent-soft)]"
          aria-label={`保存${bookmarkIds.length > 0 ? `（${bookmarkIds.length}件）` : ""}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
            <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
          </svg>
          <span>保存</span>
          {bookmarkIds.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent)]/20 px-1 text-xs font-medium text-[var(--accent)]">
              {bookmarkIds.length}
            </span>
          )}
        </button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <CategoryChips selected={categoryPrefs} onChange={onCategoryChange} className="min-w-0 flex-1" hideLabel />
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

      {heroEvents.length === 0 ? (
        <EmptyState onOpenFilter={() => setFilterOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {heroEvents.map((e) => (
            <UnifiedEventCard
              key={e.id}
              event={e}
              isBookmarked={bookmarkIds.includes(e.id)}
              onBookmarkToggle={onBookmarkToggle}
              onClick={() => handleCardClick(e.id)}
            />
          ))}
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
