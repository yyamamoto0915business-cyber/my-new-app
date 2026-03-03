"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { getBookmarks, toggleBookmark } from "@/lib/bookmark-storage";
import { getAreaPreference, setAreaPreference } from "@/lib/area-preference-storage";
import { getCategoryPrefs } from "@/lib/category-preference-storage";
import { useLanguage } from "./language-provider";
import { RegionFilter } from "./region-filter";
import { RecommendedHero } from "./home/RecommendedHero";
import { CollectionsShelf } from "./home/CollectionsShelf";
import { BookmarksSheet } from "@/components/ui/BookmarksSheet";
import { RecruitmentOrMissions } from "./home/RecruitmentOrMissions";

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
      title: string;
      description: string;
      meeting_place: string | null;
      organizers?: { organization_name: string | null };
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
    if (prefecture) {
      setAreaPreference(prefecture);
    }
  }, [prefecture]);

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
      fetchWithTimeout("/api/recruitments?limit=20", { cache: "no-store" }).then((r) =>
        r.json()
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

  return (
    <div className="min-h-screen">
      {/* Stickyヘッダー: 検索 + 地域チップ */}
      <header className="sticky top-0 z-[100] border-b border-[var(--border)] bg-white/90 backdrop-blur-md dark:bg-[var(--background)] pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-2 py-3 pr-12 sm:pr-4">
            <h1 className="min-w-0 shrink font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
              {t.platformTitle}
            </h1>
            <Link
              href="/stories"
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white/90 text-[var(--accent)] md:rounded-lg md:px-3"
              aria-label="ストーリー"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 md:mr-1"
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
              <span className="hidden md:inline">ストーリー</span>
            </Link>
          </div>
          <div className="flex flex-col gap-3 pb-3">
            <Link
              href="/events"
              className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[var(--border)] bg-white/80 px-4 text-left text-sm text-zinc-500 hover:bg-zinc-50 dark:bg-[var(--background)] dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label="イベントを検索"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>イベントを検索</span>
            </Link>
            <RegionFilter variant="chips" className="min-w-0" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        {/* ブロック1: おすすめ（3件統一カード） */}
        <RecommendedHero
          events={allEvents}
          loading={loading}
          areaPreference={effectiveArea}
          categoryPrefs={categoryPrefs}
          onCategoryChange={setCategoryPrefsState}
          bookmarkIds={bookmarkIds}
          onBookmarkToggle={handleBookmarkToggle}
          onOpenBookmarks={() => setBookmarksOpen(true)}
        />

        {/* ブロック2: テーマ別コレクション */}
        <CollectionsShelf
          events={allEvents}
          areaPreference={effectiveArea}
          categoryPrefs={categoryPrefs}
          bookmarkIds={bookmarkIds}
          onBookmarkToggle={handleBookmarkToggle}
          loading={loading}
        />

        {/* ブロック3: 募集一覧 */}
        <RecruitmentOrMissions recruitments={allRecruitments} loading={loading} />

        {/* もっと見る */}
        <div className="pt-4">
          <Link
            href="/events"
            className="block rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)]"
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-100">もっと見る</p>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              イベント一覧・今週のまち便り・人気ランキング
            </p>
          </Link>
        </div>
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
