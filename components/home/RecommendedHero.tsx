"use client";

import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/inferCategory";
import {
  filterEventsByCategory,
  eventMatchesCategory,
  getPrimaryCategory,
} from "@/lib/inferCategory";
import { addToRecent } from "@/lib/bookmark-storage";
import { filterEventsByRegion, getRecommendedEvents } from "@/lib/events";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { AreaPreference } from "./AreaPreference";
import { CategoryChips } from "./CategoryChips";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  events: Event[];
  loading: boolean;
  areaPreference: string;
  onAreaChange: (value: string) => void;
  categoryPrefs: CategoryKey[];
  onCategoryChange: (prefs: CategoryKey[]) => void;
  bookmarkIds: string[];
  onBookmarkToggle: (eventId: string) => void;
  onOpenBookmarks: () => void;
};

function collectWithFallback(
  events: Event[],
  limit: number,
  usedIds: Set<string>
): { result: Event[]; nextUsed: Set<string> } {
  const available = events.filter((e) => !usedIds.has(e.id));
  const take = getRecommendedEvents(available, limit);
  take.forEach((e) => usedIds.add(e.id));
  return { result: take, nextUsed: usedIds };
}

function getHeroEvents(
  events: Event[],
  areaPreference: string,
  categoryPrefs: CategoryKey[]
): Event[] {
  const usedIds = new Set<string>();
  const result: Event[] = [];
  const limit = 3;

  const hasArea = areaPreference.trim().length > 0;
  const hasCategory = categoryPrefs.length > 0;

  if (hasArea && hasCategory) {
    const byArea = filterEventsByRegion(events, areaPreference);
    const byAreaAndCat = byArea.filter((e) =>
      eventMatchesCategory(e, categoryPrefs)
    );
    const { result: r } = collectWithFallback(byAreaAndCat, limit, usedIds);
    result.push(...r);
  }
  if (result.length < limit && hasArea) {
    const byArea = filterEventsByRegion(events, areaPreference);
    const { result: r } = collectWithFallback(byArea, limit - result.length, usedIds);
    result.push(...r);
  }
  if (result.length < limit && hasCategory) {
    const byCat = filterEventsByCategory(events, categoryPrefs);
    const { result: r } = collectWithFallback(byCat, limit - result.length, usedIds);
    result.push(...r);
  }
  if (result.length < limit) {
    const { result: r } = collectWithFallback(
      events,
      limit - result.length,
      usedIds
    );
    result.push(...r);
  }

  return result.slice(0, limit);
}

export function RecommendedHero({
  events,
  loading,
  areaPreference,
  onAreaChange,
  categoryPrefs,
  onCategoryChange,
  bookmarkIds,
  onBookmarkToggle,
  onOpenBookmarks,
}: Props) {
  const router = useRouter();
  const heroEvents = getHeroEvents(events, areaPreference, categoryPrefs);
  const [featured, ...subCards] = heroEvents;

  const handleCardClick = (eventId: string) => {
    addToRecent(eventId);
    router.push(`/events/${eventId}`);
  };

  const areaPart = areaPreference ? `${areaPreference} の` : "";
  const catPart =
    categoryPrefs.length > 0
      ? categoryPrefs.length <= 2
        ? `${categoryPrefs.join("・")} の`
        : `${categoryPrefs.slice(0, 2).join("・")}…他${categoryPrefs.length - 2}件 の`
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

  return (
    <section className="py-8" aria-label="おすすめ">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            おすすめ
          </h2>
          <AreaPreference value={areaPreference} onChange={onAreaChange} />
          <CategoryChips
            selected={categoryPrefs}
            onChange={onCategoryChange}
            className="min-w-0 flex-1 sm:flex-initial"
          />
        </div>
        <button
          type="button"
          onClick={onOpenBookmarks}
          className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] dark:bg-[var(--background)] dark:hover:bg-[var(--accent-soft)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
              clipRule="evenodd"
            />
          </svg>
          保存済み
        </button>
      </div>
      <p className="mb-4 text-sm text-[var(--foreground-muted)]">{subText}</p>

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
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)] sm:col-span-2"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <EventThumbnail
                imageUrl={featured.imageUrl}
                alt={featured.title}
                rounded="none"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
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
                <p className="text-xs font-medium drop-shadow-md">
                  {featured.organizerName}
                </p>
                <h3 className="mt-1 line-clamp-2 font-serif text-lg font-semibold drop-shadow-md">
                  {featured.title}
                </h3>
                <p className="mt-1 text-xs drop-shadow-md">
                  {featured.date} {featured.startTime}
                  {featured.endTime ? `〜${featured.endTime}` : ""} ・{" "}
                  {featured.location}
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
                className="group flex cursor-pointer gap-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-2 shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)]"
              >
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl">
                  <EventThumbnail
                    imageUrl={e.imageUrl}
                    alt={e.title}
                    rounded="none"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
