"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
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
import { getJstTodayYmd } from "@/lib/jst-date";
import { ProfileLink } from "@/components/profile-link";
import { Breadcrumb } from "@/components/breadcrumb";
import { GlyphSectionTitle } from "@/components/glyph/glyph-section-title";
import { EventCard } from "./event-card";
import { EventCardSkeleton } from "./event-card-skeleton";
import { EventSearchSection } from "./event-search-section";
import { MapPageContainer } from "@/components/events-map/MapPageContainer";
import {
  MobileSearchPanel,
  type MobileSearchPanelDateRange,
} from "@/components/search/mobile-search-panel";

type EventWithDistance = Event & { distanceKm?: number };

/** 現在地取得済みのときの地図の絞り込み半径（km） */
const MAP_RADIUS_NEAR_ME_KM = 50;
/**
 * 位置情報が許可されていないときは一覧APIと同様に全国を対象にする。
 * デフォルト座標（東京）＋狭い半径だと関西以降のイベントが一切出ない。
 */
const MAP_RADIUS_NATIONWIDE_KM = 2800;

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

  // マップ表示に切り替わる最初のフレームで mapLoading が false のままだと
  // 「イベントなし」と誤表示される。paint 前にローディングへ寄せる。
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (isMobile) {
      setMapLoading(true);
      setView("map");
    } else {
      setView("list");
    }
  }, []);

  const openMapView = useCallback(() => {
    setMapLoading(true);
    setView("map");
  }, []);

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
    const t = getJstTodayYmd(now);
    const addDays = (d: number) => {
      const x = new Date(now.getTime());
      x.setDate(x.getDate() + d);
      return getJstTodayYmd(x);
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
    fetchWithTimeout(`/api/events${qs ? `?${qs}` : ""}`, { cache: "no-store" })
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
    const radiusKm = userPos ? MAP_RADIUS_NEAR_ME_KM : MAP_RADIUS_NATIONWIDE_KM;
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radiusKm),
      price: priceFilter,
      child_friendly: String(childFriendlyOnly),
      limit: "100",
    });
    // 日付「すべて」は一覧の getEventsByDateRange("all") と揃え、過去イベントも含める（map API は start/end があると今日以降に限定される）
    if (dateRange !== "all") {
      params.set("start", start);
      params.set("end", end);
    }
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    if (urlTags.length) params.set("tags", urlTags.join(","));
    fetchWithTimeout(`/api/events/map?${params}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setMapEvents(Array.isArray(data?.events) ? data.events : []))
      .catch(() => setMapEvents([]))
      .finally(() => setMapLoading(false));
  }, [
    view,
    userPos,
    dateRange,
    start,
    end,
    priceFilter,
    childFriendlyOnly,
    prefecture,
    city,
    urlTags,
  ]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false }
    );
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
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false }
    );
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
          price: priceFilter,
          child_friendly: String(childFriendlyOnly),
          limit: "200",
        });
        if (dateRange !== "all") {
          params.set("start", start);
          params.set("end", end);
        }

        if (prefecture) params.set("prefecture", prefecture);
        if (city) params.set("city", city);
        if (urlTags.length) params.set("tags", urlTags.join(","));

        const data = await fetchWithTimeout(`/api/events/map?${params}`, {
          cache: "no-store",
        }).then((r) => r.json());
        setMapEvents(Array.isArray(data?.events) ? data.events : []);
      } catch {
        setMapEvents([]);
      } finally {
        setMapLoading(false);
      }
    },
    [dateRange, start, end, priceFilter, childFriendlyOnly, prefecture, city, urlTags]
  );

  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <header className="sticky top-[var(--mg-mobile-top-header-h)] z-50 border-b border-[#ccc4b4] bg-[#faf8f2]/95 backdrop-blur-sm sm:top-0">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
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
          <h1
            className="mt-1 font-serif text-[18px] font-bold text-[#0e1610] hidden sm:block"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            全国のイベント
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-4 hidden gap-2 sm:flex">
          <button
            onClick={() => setView("list")}
            className={`min-h-[36px] rounded-full px-5 text-[13px] font-medium transition-colors ${
              view === "list"
                ? "bg-[#1e3848] text-[#f4f0e8]"
                : "border border-[#ccc4b4] bg-white text-[#3a3428] hover:bg-[#f0ece4]"
            }`}
          >
            一覧
          </button>
          <button
            type="button"
            onClick={openMapView}
            className={`min-h-[36px] rounded-full px-5 text-[13px] font-medium transition-colors ${
              view === "map"
                ? "bg-[#1e3848] text-[#f4f0e8]"
                : "border border-[#ccc4b4] bg-white text-[#3a3428] hover:bg-[#f0ece4]"
            }`}
          >
            地図
          </button>
        </div>

        {view === "list" ? (
          <>
            {/* モバイル：重要な条件だけ＋絞り込みボタン */}
            <div className="-mx-4 sm:mx-0">
              <MobileSearchPanel
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                regionLabel={selectedArea ? selectedArea : "全国"}
                dateRange={dateRange as MobileSearchPanelDateRange}
                categoryLabel={urlTags.length ? `カテゴリ：${urlTags.length}件` : "カテゴリ：すべて"}
                onOpenFilters={() => setFiltersOpen(true)}
                onToggleMap={openMapView}
                isMap={false}
              />
            </div>

            <section ref={eventListRef} className="scroll-mt-4">
              {loading ? (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <li key={i}>
                      <EventCardSkeleton />
                    </li>
                  ))}
                </ul>
              ) : listError ? (
                <div className="rounded-[20px] border border-[#ccc4b4] bg-[#faf8f2] p-8 text-center">
                  <p className="text-sm text-red-600">{listError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm text-[#2c7a88] underline"
                  >
                    再読み込み
                  </button>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="rounded-[20px] border border-[#ccc4b4] bg-[#faf8f2] p-10 text-center">
                  <p className="text-sm text-[#6a6258]">
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
                    className="mt-4 inline-flex h-10 items-center rounded-full bg-[#1e3848] px-5 text-sm font-medium text-[#f4f0e8]"
                  >
                    条件を緩める
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-3 px-1 text-[12px] text-[#6a6258]">
                    全{filteredEvents.length}件
                  </p>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredEvents.map((event) => (
                      <li key={event.id}>
                        <EventCard event={event} />
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
                <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-hidden rounded-t-2xl border-t border-[#ccc4b4] bg-[#faf8f2] pb-[env(safe-area-inset-bottom,0px)] shadow-xl sm:hidden">
                  <div className="flex items-center justify-between border-b border-[#ccc4b4] px-4 py-3">
                    <h2
                      className="text-[15px] font-bold text-[#0e1610]"
                      style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
                    >
                      絞り込み
                    </h2>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ccc4b4] bg-white text-[#6a6258] transition-colors active:bg-[#f0ece4]"
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
                      <div className="flex items-center justify-between rounded-2xl border border-[#ccc4b4] bg-white px-4 py-3 text-[14px]">
                        <label className="flex items-center gap-2 text-[#3a3428]">
                          <input
                            type="checkbox"
                            checked={availableOnly}
                            onChange={(e) => setAvailableOnly(e.target.checked)}
                            className="rounded border-[#ccc4b4]"
                          />
                          募集中のみ
                        </label>
                        <label className="flex items-center gap-2 text-[#3a3428]">
                          <input
                            type="checkbox"
                            checked={childFriendlyOnly}
                            onChange={(e) => setChildFriendlyOnly(e.target.checked)}
                            className="rounded border-[#ccc4b4]"
                          />
                          親子歓迎
                        </label>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] text-[#6a6258]">
                          並び替え
                        </label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as EventSort)}
                          className="h-11 w-full rounded-2xl border border-[#ccc4b4] bg-white px-3 text-[14px] text-[#3a3428]"
                        >
                          <option value="date_asc">開催日が近い順</option>
                          <option value="date_desc">開催日が遠い順</option>
                          <option value="newest">新着順</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[#ccc4b4] bg-[#faf8f2]/95 px-4 py-3">
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
                          router.push("/events", { scroll: false });
                          setFiltersOpen(false);
                        }}
                        className="h-11 flex-1 rounded-full border border-[#ccc4b4] bg-white text-[13px] font-medium text-[#3a3428] transition-colors active:bg-[#f0ece4]"
                      >
                        条件をクリア
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFiltersOpen(false);
                          handleSearch();
                        }}
                        className="h-11 flex-1 rounded-full bg-[#1e3848] text-[13px] font-medium text-[#f4f0e8] active:scale-[0.99]"
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
              <div className="mb-3 rounded-[16px] border border-[#f0d8a0] bg-[#fef8e8] px-4 py-3 text-[13px] text-[#8a6820]">
                位置情報が許可されていません。地図は広い範囲で表示しています。
                <button
                  type="button"
                  onClick={handleCenterToCurrentLocation}
                  className="ml-1.5 underline underline-offset-2"
                >
                  現在地を取得
                </button>
              </div>
            )}

            {mapLoading ? (
              <div
                className="flex items-center justify-center rounded-2xl border border-[#ccc4b4] bg-[#faf8f2]"
                style={{ height: "60vh", minHeight: "60vh" }}
              >
                <p className="text-[13px] text-[#6a6258]">地図データを読み込み中...</p>
              </div>
            ) : mapEvents.length === 0 ? (
              filteredEvents.length > 0 ? (
                <div className="rounded-[20px] border border-[#ccc4b4] bg-[#faf8f2] p-10 text-center">
                  <p className="text-[13px] leading-relaxed text-[#6a6258]">
                    地図に載せられる位置情報がない、または表示範囲外のイベントが含まれている可能性があります。
                  </p>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className="mt-5 inline-flex h-11 items-center rounded-full bg-[#1e3848] px-6 text-[13px] font-medium text-[#f4f0e8] active:scale-[0.99]"
                  >
                    一覧で見る（全{filteredEvents.length}件）
                  </button>
                </div>
              ) : (
                <div className="rounded-[20px] border border-[#ccc4b4] bg-[#faf8f2] p-10 text-center">
                  <p className="text-[13px] text-[#6a6258]">
                    この条件に合うイベントはまだありません
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setView("list");
                      setDateRange("all");
                      setSelectedArea("");
                      setAvailableOnly(false);
                      setPriceFilter("all");
                      setChildFriendlyOnly(false);
                      setSearchQuery("");
                      handleTagsChange([]);
                      router.push("/events", { scroll: false });
                    }}
                    className="mt-4 inline-flex h-10 items-center rounded-full bg-[#1e3848] px-5 text-[13px] font-medium text-[#f4f0e8]"
                  >
                    条件を緩める
                  </button>
                </div>
              )
            ) : (
              <MapPageContainer
                mapEvents={mapEvents}
                mapLoading={mapLoading}
                userPos={userPos}
                availableOnly={availableOnly}
                sortOrder={sortOrder}
                onCenterToCurrentLocation={handleCenterToCurrentLocation}
                onSearchInBounds={handleSearchInBounds}
              />
            )}
          </div>
        )}

        <div className="mt-8 pb-8">
          <Link
            href="/organizer"
            className="text-[13px] text-[#6a6258] underline-offset-4 hover:text-[#3a3428] hover:underline"
          >
            主催者向け：管理ページ →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function EventsPage() {
  return <EventsPageContent />;
}
