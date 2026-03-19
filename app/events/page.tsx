"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParamsNoSuspend } from "@/lib/use-search-params-no-suspend";
import {
  getEventsByDateRange,
  filterEventsByPrice,
  filterEventsByChildFriendly,
  filterEventsByAvailableOnly,
  filterEventsByTags,
  filterEventsByRegion,
  searchEvents,
  sortEvents,
  type Event,
  type DateRangeFilter,
  type EventSort,
} from "../../lib/events";
import { isPrefecture, PREFECTURES } from "../../lib/prefectures";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { ProfileLink } from "@/components/profile-link";
import { Breadcrumb } from "@/components/breadcrumb";
import { GlyphSectionTitle } from "@/components/glyph/glyph-section-title";
import { GlyphCardShell } from "@/components/glyph/glyph-card-shell";
import { EventCard } from "./event-card";
import { EventCardSkeleton } from "./event-card-skeleton";
import { EventSearchSection } from "./event-search-section";
import { MapPageContainer } from "@/components/events-map/MapPageContainer";

type EventWithDistance = Event & { distanceKm?: number };

function EventsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParamsNoSuspend();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const tagsParam = searchParams.get("tags") ?? "";
  const urlTags = useMemo(
    () => (tagsParam ? tagsParam.split(",").filter(Boolean) : []),
    [tagsParam]
  );

  const eventListRef = useRef<HTMLElement | null>(null);

  // Hydration mismatch防止のため、初期レンダは常に同じ分岐に寄せる
  const [view, setView] = useState<"list" | "map">("list");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    setView(isMobile ? "map" : "list");
  }, []);
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [sortOrder, setSortOrder] = useState<EventSort>("date_asc");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [childFriendlyOnly, setChildFriendlyOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState(
    () => searchParams.get("prefecture") ?? ""
  );
  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [mapEvents, setMapEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tags.length) params.set("tags", tags.join(","));
      else params.delete("tags");
      const qs = params.toString();
      router.push("/events" + (qs ? `?${qs}` : ""), { scroll: false });
    },
    [router, searchParams]
  );

  const handleAreaChange = useCallback(
    (area: string) => {
      setSelectedArea(area);
      const params = new URLSearchParams(searchParams.toString());
      if (area) params.set("prefecture", area);
      else params.delete("prefecture");
      params.delete("city");
      const qs = params.toString();
      router.push("/events" + (qs ? `?${qs}` : ""), { scroll: false });
    },
    [router, searchParams]
  );

  const { today, end } = useMemo(() => {
    const now = new Date();
    const t = now.toISOString().split("T")[0];
    const addDays = (d: number) => {
      const x = new Date(now.getTime());
      x.setDate(x.getDate() + d);
      return x.toISOString().split("T")[0];
    };
    const e =
      dateRange === "today"
        ? t
        : dateRange === "week" || dateRange === "weekend"
          ? addDays(7)
          : dateRange === "month"
            ? addDays(30)
            : dateRange === "3months"
              ? addDays(90)
              : addDays(365);
    return { today: t, end: e };
  }, [dateRange]);

  const start = today;

  useEffect(() => {
    setListError(null);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    if (urlTags.length) params.set("tags", urlTags.join(","));
    const qs = params.toString();
    fetchWithTimeout(`/api/events${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((data: Event[]) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {
        setEvents([]);
        setListError("通信に失敗しました");
      })
      .finally(() => setLoading(false));
  }, [prefecture, city, tagsParam, urlTags]);

  useEffect(() => {
    if (view !== "map") return;
    setMapLoading(true);
    const lat = userPos?.lat ?? 35.6812;
    const lng = userPos?.lng ?? 139.7671;
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: "50",
      start,
      end,
      price: priceFilter,
      child_friendly: String(childFriendlyOnly),
      limit: "100",
    });
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    if (urlTags.length) params.set("tags", urlTags.join(","));
    fetchWithTimeout(`/api/events/map?${params}`)
      .then((res) => res.json())
      .then((data) => setMapEvents(Array.isArray(data?.events) ? data.events : []))
      .catch(() => setMapEvents([]))
      .finally(() => setMapLoading(false));
  }, [view, userPos, start, end, priceFilter, childFriendlyOnly, prefecture, city, urlTags]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { enableHighAccuracy: false }
      );
    }
  }, []);

  const filteredEvents = useMemo(() => {
    let result = events;
    result = getEventsByDateRange(result, dateRange);
    if (selectedArea) {
      result = filterEventsByRegion(
        result,
        isPrefecture(selectedArea) ? selectedArea : undefined,
        isPrefecture(selectedArea) ? undefined : selectedArea
      );
    }
    result = filterEventsByPrice(result, priceFilter);
    result = filterEventsByChildFriendly(result, childFriendlyOnly);
    result = filterEventsByAvailableOnly(result, availableOnly);
    result = filterEventsByTags(result, urlTags);
    result = searchEvents(result, searchQuery);
    result = sortEvents(result, sortOrder);
    return result;
  }, [
    events,
    dateRange,
    selectedArea,
    priceFilter,
    childFriendlyOnly,
    availableOnly,
    urlTags,
    searchQuery,
    sortOrder,
  ]);

  const handleSearch = useCallback(() => {
    eventListRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleCenterToCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { enableHighAccuracy: false }
      );
    }
  }, []);

  const handleSearchInBounds = useCallback(
    async (bounds: {
      north: number;
      south: number;
      west: number;
      east: number;
      centerLat: number;
      centerLng: number;
      zoom: number;
    }) => {
      setMapLoading(true);
      try {
        const params = new URLSearchParams({
          north: String(bounds.north),
          south: String(bounds.south),
          west: String(bounds.west),
          east: String(bounds.east),
          lat: String(bounds.centerLat),
          lng: String(bounds.centerLng),
          start,
          end,
          price: priceFilter,
          child_friendly: String(childFriendlyOnly),
          limit: "200",
        });

        if (prefecture) params.set("prefecture", prefecture);
        if (city) params.set("city", city);
        if (urlTags.length) params.set("tags", urlTags.join(","));

        const data = await fetchWithTimeout(`/api/events/map?${params}`).then((r) => r.json());
        setMapEvents(Array.isArray(data?.events) ? data.events : []);
      } catch {
        setMapEvents([]);
      } finally {
        setMapLoading(false);
      }
    },
    [start, end, priceFilter, childFriendlyOnly, prefecture, city, urlTags]
  );

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm dark:bg-zinc-900/95 [border-color:var(--mg-line)]">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumb
              items={[
                { label: "トップ", href: "/" },
                { label: "イベント情報", href: "/events" },
                { label: "イベント検索" },
              ]}
              className="hidden sm:flex"
            />
            <ProfileLink />
          </div>
          <GlyphSectionTitle as="h1" className="mt-2">
            全国のイベント
          </GlyphSectionTitle>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-4 hidden gap-2 sm:flex">
          <button
            onClick={() => setView("list")}
            className={`rounded px-4 py-2 text-sm font-medium ${
              view === "list"
                ? "bg-[var(--accent)] text-white"
                : "border border-zinc-200 dark:border-zinc-700"
            }`}
          >
            一覧
          </button>
          <button
            onClick={() => setView("map")}
            className={`rounded px-4 py-2 text-sm font-medium ${
              view === "map"
                ? "bg-[var(--accent)] text-white"
                : "border border-zinc-200 dark:border-zinc-700"
            }`}
          >
            地図
          </button>
        </div>

        {view === "list" ? (
          <>
            {/* モバイル：重要な条件だけ＋絞り込みボタン */}
            <div className="mb-4 flex flex-col gap-3 border-b border-zinc-200 pb-4 text-sm dark:border-zinc-700 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
                  className="min-h-[40px] rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="all">日付：すべて</option>
                  <option value="today">日付：今日</option>
                  <option value="week">日付：今週</option>
                  <option value="weekend">日付：週末</option>
                  <option value="month">日付：今月</option>
                  <option value="3months">日付：3ヶ月</option>
                </select>
                <details className="relative">
                  <summary className="min-h-[40px] cursor-pointer list-none rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                    地域：
                    <span className="font-medium">
                      {selectedArea ? selectedArea : "全国"}
                    </span>
                  </summary>
                  <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
                    <select
                      value={selectedArea}
                      onChange={(e) => handleAreaChange(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="">全国</option>
                      {PREFECTURES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </details>
                <div className="inline-flex overflow-hidden rounded-full border border-zinc-200 text-xs dark:border-zinc-600">
                  {(["all", "free", "paid"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPriceFilter(f)}
                      className={`px-3 py-1 ${
                        priceFilter === f
                          ? "bg-[var(--accent)] text-white"
                          : "bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {f === "all" ? "料金：すべて" : f === "free" ? "料金：無料" : "料金：有料"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto"
              >
                絞り込み
              </button>
            </div>

            <section ref={eventListRef} className="scroll-mt-4">
              {loading ? (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <li key={i}>
                      <GlyphCardShell>
                        <EventCardSkeleton />
                      </GlyphCardShell>
                    </li>
                  ))}
                </ul>
              ) : listError ? (
                <div className="rounded border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="text-sm text-red-600">{listError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm text-[var(--accent)] underline"
                  >
                    再読み込み
                  </button>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="rounded border border-zinc-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    該当するイベントがありません
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDateRange("all");
                      setSelectedArea("");
                      setAvailableOnly(false);
                      setPriceFilter("all");
                      setChildFriendlyOnly(false);
                      setSearchQuery("");
                      handleTagsChange([]);
                      router.push("/events", { scroll: false });
                    }}
                    className="mt-4 rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    条件を緩める
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                    全{filteredEvents.length}件
                  </p>
                  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredEvents.map((event) => (
                      <li key={event.id}>
                        <GlyphCardShell>
                          <EventCard event={event} />
                        </GlyphCardShell>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            {/* PC向けの詳細検索セクション（モバイルでは下のドロワーに含める） */}
            <div className="hidden sm:block">
              <EventSearchSection
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                selectedTags={urlTags}
                onTagsChange={handleTagsChange}
                selectedArea={selectedArea}
                onAreaChange={handleAreaChange}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearch={handleSearch}
              />
            </div>

            {/* モバイル用フィルタードロワー */}
            {filtersOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
                  onClick={() => setFiltersOpen(false)}
                  aria-hidden="true"
                />
                <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-hidden rounded-t-2xl border-t border-[var(--border)] bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-xl dark:bg-[var(--background)] sm:hidden">
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      絞り込み
                    </h2>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="min-h-[40px] min-w-[40px] rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      aria-label="閉じる"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-[65dvh] overflow-y-auto px-4 py-4 space-y-5">
                    <EventSearchSection
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      selectedTags={urlTags}
                      onTagsChange={handleTagsChange}
                      selectedArea={selectedArea}
                      onAreaChange={handleAreaChange}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      onSearch={handleSearch}
                      variant="drawer"
                    />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={availableOnly}
                            onChange={(e) => setAvailableOnly(e.target.checked)}
                            className="rounded border-zinc-300"
                          />
                          <span className="text-zinc-700 dark:text-zinc-200">
                            募集中のみ
                          </span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={childFriendlyOnly}
                            onChange={(e) => setChildFriendlyOnly(e.target.checked)}
                            className="rounded border-zinc-300"
                          />
                          <span className="text-zinc-700 dark:text-zinc-200">
                            親子歓迎
                          </span>
                        </label>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                          並び替え
                        </label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as EventSort)}
                          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          <option value="date_asc">開催日が近い順</option>
                          <option value="date_desc">開催日が遠い順</option>
                          <option value="newest">新着順</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border)] bg-white px-4 py-3 dark:bg-[var(--background)]">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDateRange("all");
                          setSelectedArea("");
                          setAvailableOnly(false);
                          setPriceFilter("all");
                          setChildFriendlyOnly(false);
                          setSearchQuery("");
                          // クエリ（都道府県/タグ等）もまとめて初期化
                          router.push("/events", { scroll: false });
                          setFiltersOpen(false);
                        }}
                        className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        条件をクリア
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFiltersOpen(false);
                          handleSearch();
                        }}
                        className="min-h-[44px] flex-1 rounded-xl bg-[var(--accent)] text-sm font-medium text-white hover:opacity-90"
                      >
                        適用する
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="mt-4">
            {!userPos && (
              <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                位置情報が許可されていません。デフォルトの地域を表示しています。
                <button
                  type="button"
                  onClick={handleCenterToCurrentLocation}
                  className="ml-2 underline"
                >
                  現在地を取得
                </button>
              </div>
            )}

            <MapPageContainer
              mapEvents={mapEvents}
              mapLoading={mapLoading}
              userPos={userPos}
              availableOnly={availableOnly}
              sortOrder={sortOrder}
              onCenterToCurrentLocation={handleCenterToCurrentLocation}
              onSearchInBounds={handleSearchInBounds}
            />
          </div>
        )}

        <div className="mt-8 pb-8">
          <Link
            href="/organizer/events"
            className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            主催者向け：イベント管理 →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function EventsPage() {
  return <EventsPageContent />;
}
