"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { getBookmarks, toggleBookmark } from "@/lib/bookmark-storage";
import { getAreaPreference, setAreaPreference } from "@/lib/area-preference-storage";
import { getCategoryPrefs } from "@/lib/category-preference-storage";
import { getEventsByDateRange, filterEventsByRegion } from "@/lib/events";
import { eventMatchesCategory } from "@/lib/inferCategory";
import { takeWithoutSeen } from "@/lib/utils";
import { useLanguage } from "./language-provider";
import { HomeHeader } from "./home/HomeHeader";
import { HeroSection } from "./home/HeroSection";
import { HomeFooter } from "./home/HomeFooter";
import { RecommendedHero } from "./home/RecommendedHero";
import { WeeklyPickupSection } from "./home/WeeklyPickupSection";
import { CollectionsShelf } from "./home/CollectionsShelf";
import { RecruitmentOrMissions } from "./home/RecruitmentOrMissions";
import { MachiBinyoriPreview } from "./home/MachiBinyoriPreview";
import { FeaturedOrganizersSection } from "./home/FeaturedOrganizersSection";
import { BookmarksSheet } from "@/components/ui/BookmarksSheet";

const THEME_FILTERS = [
  (e: Event) =>
    e.price === 0 || e.tags?.includes("free") || /無料/.test(e.title),
  (e: Event) =>
    e.childFriendly ||
    e.tags?.includes("kids") ||
    /親子|キッズ|子供/.test(e.title),
  (e: Event) =>
    /体験|ワークショップ|教室/.test(e.title) || e.tags?.includes("beginner"),
  (e: Event) =>
    /文化|アート|歴史|地域/.test(e.title) ||
    /体験|ワークショップ/.test(e.title),
];

function pickCollectionEvents(
  source: Event[],
  limit: number,
  excludeIds: Set<string>,
  categoryPrefs: CategoryKey[]
): Event[] {
  const used = new Set<string>();
  const result: Event[] = [];
  const hasCategory = categoryPrefs.length > 0;

  for (const filter of THEME_FILTERS) {
    const candidates = source.filter(
      (e) =>
        filter(e) &&
        !excludeIds.has(e.id) &&
        !used.has(e.id) &&
        (!hasCategory || eventMatchesCategory(e, categoryPrefs))
    );
    const take = candidates.slice(0, limit - result.length);
    take.forEach((e) => {
      used.add(e.id);
      result.push(e);
    });
    if (result.length >= limit) break;
  }
  if (result.length < limit) {
    const rest = source.filter((e) => !excludeIds.has(e.id) && !used.has(e.id));
    result.push(...rest.slice(0, limit - result.length));
  }
  return result.slice(0, limit);
}

export function HomeOtonami() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const effectiveArea = prefecture || city || getAreaPreference();

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [allRecruitments, setAllRecruitments] = useState<
    {
      id: string;
      organizer_id?: string;
      title: string;
      description: string;
      meeting_place: string | null;
      start_at?: string | null;
      organizers?: { organization_name: string | null };
      events?: { title: string; date: string } | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [categoryPrefs, setCategoryPrefsState] = useState<CategoryKey[]>([]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);

  const handleBookmarkToggle = useCallback((eventId: string) => {
    toggleBookmark(eventId);
    setBookmarkIds(getBookmarks());
  }, []);

  useEffect(() => {
    setBookmarkIds(getBookmarks());
    setCategoryPrefsState(getCategoryPrefs());
  }, []);
  useEffect(() => {
    if (prefecture) setAreaPreference(prefecture);
  }, [prefecture]);

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    const qs = params.toString();
    Promise.all([
      fetchWithTimeout(`/api/events${qs ? `?${qs}` : ""}`, { cache: "no-store" }).then(
        (r) => r.json()
      ),
      fetchWithTimeout("/api/recruitments?limit=20", { cache: "no-store" }).then(
        (r) => r.json()
      ),
    ])
      .then(([events, recAll]) => {
        setAllEvents(Array.isArray(events) ? events : []);
        setAllRecruitments(Array.isArray(recAll) ? recAll : []);
      })
      .catch(() => {
        setAllEvents([]);
        setAllRecruitments([]);
      })
      .finally(() => setLoading(false));
  }, [prefecture, city]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const areaEvents =
    effectiveArea.trim().length > 0
      ? filterEventsByRegion(allEvents, effectiveArea)
      : allEvents;
  const weekEvents = getEventsByDateRange(allEvents, "week");
  const weekendEvents = getEventsByDateRange(allEvents, "weekend");
  const freeFilter = (e: Event) =>
    e.price === 0 || e.tags?.includes("free") || /無料/.test(e.title);

  const { pickupEvents, collectionEvents, machiEvents } = useMemo(() => {
    const { getHeroWithSubCards } = require("@/lib/filterEvents");
    const { featured, subCards } = getHeroWithSubCards(
      allEvents,
      effectiveArea,
      categoryPrefs,
      3
    );
    const heroIds = new Set(
      [featured, ...subCards].filter((e): e is Event => e != null).map((e) => e.id)
    );
    const pickupCandidates = weekendEvents.filter(
      (e) => freeFilter(e) && !heroIds.has(e.id)
    );
    const { items: pickup, updatedSeen: seen1 } = takeWithoutSeen(
      pickupCandidates,
      heroIds,
      8
    );
    const collection = pickCollectionEvents(
      areaEvents,
      8,
      seen1,
      categoryPrefs
    );
    const seen2 = new Set(seen1);
    collection.forEach((e) => seen2.add(e.id));
    const { items: machi } = takeWithoutSeen(weekEvents, seen2, 2);

    return {
      pickupEvents: pickup,
      collectionEvents: collection,
      machiEvents: machi,
    };
  }, [allEvents, effectiveArea, categoryPrefs, areaEvents, weekEvents, weekendEvents]);

  return (
    <div className="min-h-screen">
      <HomeHeader
        platformTitle={t.platformTitle}
        onOpenBookmarks={() => setBookmarksOpen(true)}
        bookmarkCount={bookmarkIds.length}
      />

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-8 sm:pb-8">
        {/* ファーストビュー */}
        <HeroSection />

        {/* 1) おすすめイベント */}
        <RecommendedHero
          events={allEvents}
          loading={loading}
          areaPreference={effectiveArea}
          categoryPrefs={categoryPrefs}
          onCategoryChange={setCategoryPrefsState}
          bookmarkIds={bookmarkIds}
          onBookmarkToggle={handleBookmarkToggle}
        />

        {/* 2) 今週のピックアップ */}
        <WeeklyPickupSection
          events={pickupEvents}
          loading={loading}
          bookmarkIds={bookmarkIds}
          onBookmarkToggle={handleBookmarkToggle}
        />

        {/* 3) テーマ別コレクション */}
        <CollectionsShelf
          events={collectionEvents}
          loading={loading}
          bookmarkIds={bookmarkIds}
          onBookmarkToggle={handleBookmarkToggle}
        />

        {/* 4) 注目の主催者 */}
        <FeaturedOrganizersSection />

        {/* 5) すきまサポート */}
        <RecruitmentOrMissions
          recruitments={allRecruitments}
          loading={loading}
        />

        {/* 6) 今週のまち便り */}
        <MachiBinyoriPreview
          events={machiEvents}
          loading={loading}
          bookmarkIds={bookmarkIds}
          onBookmarkToggle={handleBookmarkToggle}
        />

        {/* MachiGlyph案内と3軸への再導線 */}
        <HomeFooter />
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
