"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { Event } from "@/lib/db/types";
import type { Story } from "@/lib/story-types";
import { getEventsByDateRange } from "@/lib/events";
import { getBookmarks, toggleBookmark, addToRecent } from "@/lib/bookmark-storage";
import { getAreaPreference } from "@/lib/area-preference-storage";
import { getCategoryPrefs } from "@/lib/category-preference-storage";
import type { CategoryKey } from "@/lib/categories";
import { useLanguage } from "./language-provider";
import { RegionFilter } from "./region-filter";
import { EventThumbnail } from "./event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { RecommendedHero } from "./home/RecommendedHero";
import { CollectionsShelf } from "./home/CollectionsShelf";
import { BookmarksSheet } from "@/components/ui/BookmarksSheet";
import { RecruitmentOrMissions } from "./home/RecruitmentOrMissions";
import { WeeklyPickup } from "./home/WeeklyPickup";

function CarouselSection({
  title,
  events,
  loading,
  bookmarkIds,
  onBookmarkToggle,
}: {
  title: string;
  events: Event[];
  loading: boolean;
  bookmarkIds: string[];
  onBookmarkToggle: (id: string) => void;
}) {
  const router = useRouter();
  if (events.length === 0 && !loading) return null;

  return (
    <section className="py-6 sm:py-8">
      <div className="mb-3">
        <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
          {title}
        </h2>
      </div>
      {loading ? (
        <div className="-mx-4 flex gap-4 overflow-x-hidden px-4 pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 w-[280px] shrink-0 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700"
            />
          ))}
        </div>
      ) : (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {events.map((e) => (
            <div
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                addToRecent(e.id);
                router.push(`/events/${e.id}`);
              }}
              onKeyDown={(ev) =>
                ev.key === "Enter" && (addToRecent(e.id), router.push(`/events/${e.id}`))
              }
              className="group relative flex w-[min(280px,85vw)] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.98] dark:bg-[var(--background)]"
            >
              <div className="relative aspect-[16/10]">
                <EventThumbnail
                  imageUrl={e.imageUrl}
                  alt={e.title}
                  rounded="none"
                  className="rounded-t-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                {getPrimaryCategory(e) && (
                  <div className="absolute left-2 top-2 z-10">
                    <CategoryBadge event={e} />
                  </div>
                )}
                <div
                  className="absolute right-2 top-2 z-10"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <BookmarkToggle
                    eventId={e.id}
                    isActive={bookmarkIds.includes(e.id)}
                    onToggle={onBookmarkToggle}
                  />
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-xs font-medium drop-shadow-md">{e.organizerName}</p>
                  <h3 className="mt-0.5 line-clamp-2 font-serif text-sm font-semibold drop-shadow-md">
                    {e.title}
                  </h3>
                </div>
                {e.price === 0 && (
                  <span className="absolute right-12 top-2 rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                    無料
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {e.date} {e.startTime}
                    {e.endTime ? `-${e.endTime}` : ""}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {e.location}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-[var(--accent)]">
                  {e.price === 0 ? "無料" : `¥${e.price}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function HomeOtonami() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [rankings, setRankings] = useState<Event[]>([]);
  const [collections, setCollections] = useState<{
    id: string;
    slug: string;
    title: string;
    eventIds: string[];
  }[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [recommendedRecruitments, setRecommendedRecruitments] = useState<
    { id: string; title: string; meeting_place: string | null; start_at: string | null }[]
  >([]);
  const [allRecruitments, setAllRecruitments] = useState<
    {
      id: string;
      title: string;
      description: string;
      meeting_place: string | null;
      organizers?: { organization_name: string | null };
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [areaPreference, setAreaPreferenceState] = useState("");
  const [categoryPrefs, setCategoryPrefsState] = useState<CategoryKey[]>([]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);

  const handleBookmarkToggle = useCallback((eventId: string) => {
    toggleBookmark(eventId);
    setBookmarkIds(getBookmarks());
  }, []);

  useEffect(() => {
    setBookmarkIds(getBookmarks());
    setAreaPreferenceState(getAreaPreference());
    setCategoryPrefsState(getCategoryPrefs());
  }, []);

  const handleAreaChange = useCallback((value: string) => {
    setAreaPreferenceState(value);
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    const qs = params.toString();

    Promise.all([
      fetchWithTimeout(`/api/events${qs ? `?${qs}` : ""}`, { cache: "no-store" }).then((r) =>
        r.json()
      ),
      fetchWithTimeout("/api/events/rankings?type=popular&limit=8", { cache: "no-store" }).then(
        (r) => r.json()
      ),
      fetchWithTimeout("/api/collections", { cache: "no-store" }).then((r) => r.json()),
      fetchWithTimeout("/api/stories?limit=5", { cache: "no-store" }).then((r) => r.json()),
      fetchWithTimeout("/api/recruitments?recommended=true&limit=3", { cache: "no-store" }).then(
        (r) => r.json()
      ),
      fetchWithTimeout("/api/recruitments?limit=20", { cache: "no-store" }).then((r) =>
        r.json()
      ),
    ])
      .then(([events, ranked, colls, storyList, recRecommended, recAll]) => {
        setAllEvents(Array.isArray(events) ? events : []);
        setRankings(Array.isArray(ranked) ? ranked : []);
        setCollections(Array.isArray(colls) ? colls : []);
        setStories(Array.isArray(storyList) ? storyList : []);
        setRecommendedRecruitments(Array.isArray(recRecommended) ? recRecommended : []);
        setAllRecruitments(Array.isArray(recAll) ? recAll : []);
      })
      .catch(() => {
        setAllEvents([]);
        setRankings([]);
        setCollections([]);
        setStories([]);
        setRecommendedRecruitments([]);
        setAllRecruitments([]);
      })
      .finally(() => setLoading(false));
  }, [prefecture, city]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && allEvents.length > 0) {
      console.log("event sample", allEvents[0]);
    }
  }, [allEvents]);

  const pickupEvents = getEventsByDateRange(allEvents, "week");
  const displayPickup = pickupEvents.length > 0 ? pickupEvents : allEvents;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm dark:bg-[var(--background)] pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <h1 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
                {t.platformTitle}
              </h1>
              <RegionFilter variant="compact" className="shrink-0" />
              <Link
                href="/stories"
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] active:bg-[var(--accent-soft)] dark:bg-[var(--background)] dark:hover:bg-[var(--accent-soft)] sm:px-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                ストーリー
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* 1) おすすめヒーロー（主役） */}
        <RecommendedHero
          events={allEvents}
          loading={loading}
          areaPreference={areaPreference}
          onAreaChange={handleAreaChange}
          categoryPrefs={categoryPrefs}
          onCategoryChange={setCategoryPrefsState}
          bookmarkIds={bookmarkIds}
          onBookmarkToggle={handleBookmarkToggle}
          onOpenBookmarks={() => setBookmarksOpen(true)}
        />

        {/* 2) テーマ別コレクション（棚） */}
        <CollectionsShelf
          events={allEvents}
          areaPreference={areaPreference}
          categoryPrefs={categoryPrefs}
          bookmarkIds={bookmarkIds}
          onBookmarkToggle={handleBookmarkToggle}
        />

        {/* 3) 募集一覧（空ならすきまサポート） */}
        <RecruitmentOrMissions recruitments={allRecruitments} loading={loading} />

        {/* 4) 今週のまち便り */}
        <WeeklyPickup
          events={displayPickup.slice(0, 10)}
          loading={loading}
          bookmarkIds={bookmarkIds}
          onBookmarkToggle={handleBookmarkToggle}
        />

        {/* コレクション（既存） */}
        {collections.slice(0, 2).map((c) => (
          <CarouselSection
            key={c.id}
            title={c.title}
            events={allEvents.filter((e) => c.eventIds?.includes(e.id)).slice(0, 8)}
            loading={false}
            bookmarkIds={bookmarkIds}
            onBookmarkToggle={handleBookmarkToggle}
          />
        ))}

        {/* 人気ランキング（既存） */}
        <CarouselSection
          title="人気ランキング"
          events={rankings}
          loading={loading}
          bookmarkIds={bookmarkIds}
          onBookmarkToggle={handleBookmarkToggle}
        />
      </main>

      <BookmarksSheet
        isOpen={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        events={allEvents}
        bookmarkIds={bookmarkIds}
        onBookmarkToggle={handleBookmarkToggle}
      />
    </div>
  );
}
