"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
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
  backfillWithRecentEndedEvents,
  sortEventsForDiscover,
  type Event,
  type DateRangeFilter,
  type EventSort,
} from "../../lib/events";
import { isPrefecture } from "../../lib/prefectures";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getJstTodayYmd } from "@/lib/jst-date";
import { EventCard } from "./event-card";
import { EventCardSkeleton } from "./event-card-skeleton";
import { MapPageContainer } from "@/components/events-map/MapPageContainer";
import { getPrimaryCategory, inferCategoryKeys } from "@/lib/inferCategory";
import {
  Calendar,
  CircleDollarSign,
  Baby,
  Sparkles,
  Users,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import {
  EventsMobileHero,
  type EventsMobileQuickChip,
} from "@/components/events/list/mobile/EventsMobileHero";
import { EventsMobileListHeader } from "@/components/events/list/mobile/EventsMobileListHeader";
import { EventsMobileRowCard } from "@/components/events/list/mobile/EventsMobileRowCard";
import { EventsMobileRowCardSkeleton } from "@/components/events/list/mobile/EventsMobileRowCardSkeleton";
import { EventsMobileGridCard } from "@/components/events/list/mobile/EventsMobileGridCard";
import { EventsMobileGridCardSkeleton } from "@/components/events/list/mobile/EventsMobileGridCardSkeleton";
import { EventsPcHero } from "@/components/events/list/EventsPcHero";
import { EventsPcFilterBar } from "@/components/events/list/EventsPcFilterBar";
import { EventsPcFilterSidebar } from "@/components/events/list/EventsPcFilterSidebar";
import { EventsPcResultsToolbar } from "@/components/events/list/EventsPcResultsToolbar";
import { EventsPcPagination } from "@/components/events/list/EventsPcPagination";
import { EventsListPcEventCard } from "@/components/events/list/EventsListPcEventCard";
import {
  EVENTS_PC_GRID_CLASS,
  EVENTS_PC_MAX_WIDTH,
  EVENTS_MOBILE_PAGE_STEP,
  EVENTS_MOBILE_GRID_CLASS,
} from "@/components/events/list/events-pc-constants";
import { useRegionPreference } from "@/hooks/use-region-preference";

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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [mapEvents, setMapEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(EVENTS_MOBILE_PAGE_STEP);
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [reservationOnly, setReservationOnly] = useState(false);
  const [pcViewMode, setPcViewMode] = useState<"grid" | "list">("grid");
  const [mobileViewMode, setMobileViewMode] = useState<"grid" | "list">("grid");
  const [pageSize, setPageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const { label: regionLabel } = useRegionPreference();

  // PC のみ一覧をデフォルトに（モバイルはモック準拠のリスト UI）
  // ?view=map のときは地図を開く
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (searchParams.get("view") === "map") {
      setView("map");
      return;
    }
    if (window.matchMedia("(min-width: 900px)").matches) {
      setView("list");
    }
  }, [searchParams]);

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
    const applySharedFilters = (list: Event[]) => {
      let r = list;
      if (selectedArea) {
        r = filterEventsByRegion(
          r,
          isPrefecture(selectedArea) ? selectedArea : undefined,
          isPrefecture(selectedArea) ? undefined : selectedArea
        );
      }
      r = filterEventsByPrice(r, priceFilter);
      r = filterEventsByChildFriendly(r, childFriendlyOnly);
      r = filterEventsByTags(r, urlTags);
      r = searchEvents(r, searchQuery);
      if (selectedCategory) {
        r = r.filter((e) => {
          const primary = getPrimaryCategory(e);
          if (selectedCategory === "volunteer") {
            return primary === "volunteer" || inferCategoryKeys(e).includes("volunteer");
          }
          return primary === selectedCategory;
        });
      }
      if (indoorOnly) {
        r = r.filter((e) => e.tags?.includes("indoor"));
      }
      if (reservationOnly) {
        r = r.filter(
          (e) => (e as Event & { requiresReservation?: boolean }).requiresReservation
        );
      }
      return r;
    };

    const sharedPool = applySharedFilters(events);
    let result = getEventsByDateRange(sharedPool, dateRange);
    if (!availableOnly) {
      result = backfillWithRecentEndedEvents(result, sharedPool);
    }
    result = filterEventsByAvailableOnly(result, availableOnly);
    if (sortOrder === "newest") {
      result = sortEvents(result, "newest");
    } else {
      result = sortEventsForDiscover(result);
    }
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
    selectedCategory,
    indoorOnly,
    reservationOnly,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    dateRange,
    selectedArea,
    priceFilter,
    childFriendlyOnly,
    availableOnly,
    searchQuery,
    selectedCategory,
    indoorOnly,
    reservationOnly,
    pageSize,
    sortOrder,
    urlTags,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setMobileVisibleCount(EVENTS_MOBILE_PAGE_STEP);
  }, [
    dateRange,
    selectedArea,
    priceFilter,
    childFriendlyOnly,
    availableOnly,
    searchQuery,
    selectedCategory,
    indoorOnly,
    reservationOnly,
    sortOrder,
    urlTags,
  ]);

  const visibleMobileEvents = useMemo(
    () => filteredEvents.slice(0, mobileVisibleCount),
    [filteredEvents, mobileVisibleCount]
  );

  const hasMoreMobile = mobileVisibleCount < filteredEvents.length;

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

  const pcSortOrder: "date_asc" | "newest" =
    sortOrder === "newest" ? "newest" : "date_asc";

  const resetMobileFilters = useCallback(() => {
    setDateRange("all");
    setSelectedArea("");
    setAvailableOnly(false);
    setPriceFilter("all");
    setChildFriendlyOnly(false);
    setSearchQuery("");
    setSelectedCategory("");
    setIndoorOnly(false);
    setReservationOnly(false);
    handleTagsChange([]);
    router.push("/events", { scroll: false });
  }, [handleTagsChange, router]);

  const mobileQuickChips = useMemo((): EventsMobileQuickChip[] => {
    const weekendActive = dateRange === "today" || dateRange === "weekend";
    const hasAnyFilter =
      weekendActive ||
      priceFilter === "free" ||
      childFriendlyOnly ||
      selectedCategory === "workshop" ||
      selectedCategory === "community" ||
      Boolean(searchQuery.trim()) ||
      Boolean(selectedArea) ||
      indoorOnly;

    return [
      {
        key: "weekend",
        label: "今週末",
        Icon: Calendar,
        active: weekendActive,
        onClick: () => setDateRange(weekendActive ? "all" : "weekend"),
      },
      {
        key: "free",
        label: "無料",
        Icon: CircleDollarSign,
        active: priceFilter === "free",
        onClick: () => setPriceFilter(priceFilter === "free" ? "all" : "free"),
      },
      {
        key: "family",
        label: "親子",
        Icon: Baby,
        active: childFriendlyOnly,
        onClick: () => setChildFriendlyOnly(!childFriendlyOnly),
      },
      {
        key: "workshop",
        label: "体験",
        Icon: Sparkles,
        active: selectedCategory === "workshop",
        onClick: () =>
          setSelectedCategory(selectedCategory === "workshop" ? "" : "workshop"),
      },
      {
        key: "community",
        label: "交流会",
        Icon: Users,
        active: selectedCategory === "community",
        onClick: () =>
          setSelectedCategory(selectedCategory === "community" ? "" : "community"),
      },
      {
        key: "all",
        label: "すべて",
        Icon: SlidersHorizontal,
        active: !hasAnyFilter,
        isAll: true,
        onClick: resetMobileFilters,
      },
    ];
  }, [
    dateRange,
    priceFilter,
    childFriendlyOnly,
    selectedCategory,
    searchQuery,
    selectedArea,
    indoorOnly,
    resetMobileFilters,
  ]);

  return (
    <div className="relative z-10 min-h-screen bg-[#F5F8F5]">
      {/* ===== PC Layout ===== */}
      <div className="hidden min-[900px]:block px-4 py-4">
        <div className={`mx-auto ${EVENTS_PC_MAX_WIDTH}`}>
          <div className="overflow-hidden rounded-[14px] border border-[#E8EBE6] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <EventsPcHero searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

            <div className="border-b border-[#D5E5DA]/60 bg-[#EAF4ED] px-4">
              <EventsPcFilterBar
                selectedArea={selectedArea}
                onAreaChange={handleAreaChange}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                priceFilter={priceFilter}
                onPriceFilterChange={setPriceFilter}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                childFriendlyOnly={childFriendlyOnly}
                onChildFriendlyChange={setChildFriendlyOnly}
                indoorOnly={indoorOnly}
                onIndoorChange={setIndoorOnly}
                sortOrder={pcSortOrder}
                onSortChange={(s) => setSortOrder(s)}
              />
            </div>

            <div className="mg-events-pc-dots flex gap-4 p-3.5">
            <EventsPcFilterSidebar
              regionLabel={regionLabel || "全国"}
              selectedArea={selectedArea}
              onAreaChange={handleAreaChange}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              childFriendlyOnly={childFriendlyOnly}
              onChildFriendlyChange={setChildFriendlyOnly}
              priceFilter={priceFilter}
              onPriceFilterChange={setPriceFilter}
              reservationOnly={reservationOnly}
              onReservationOnlyChange={setReservationOnly}
              indoorOnly={indoorOnly}
              onIndoorChange={setIndoorOnly}
            />

            <div className="min-w-0 flex-1">
            {view === "map" ? (
              <div>
                {!userPos && (
                  <div className="mb-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
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
                    className="flex items-center justify-center rounded-[12px] border border-[#DDE8DF] bg-white"
                    style={{ height: "60vh" }}
                  >
                    <p className="text-[13px] text-[#566358]">地図データを読み込み中...</p>
                  </div>
                ) : mapEvents.length === 0 ? (
                  filteredEvents.length > 0 ? (
                    <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-10 text-center">
                      <p className="text-[13px] leading-relaxed text-[#566358]">
                        地図に載せられる位置情報がない、または表示範囲外のイベントが含まれている可能性があります。
                      </p>
                      <button
                        type="button"
                        onClick={() => setView("list")}
                        className="mt-5 inline-flex h-11 items-center rounded-full bg-[#1A2214] px-6 text-[13px] font-medium text-white hover:bg-[#2D7A4F] transition-colors"
                      >
                        一覧で見る（全{filteredEvents.length}件）
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-10 text-center">
                      <p className="text-[13px] text-[#566358]">
                        この条件に合うイベントはまだありません
                      </p>
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
            ) : (
              <>
                <EventsPcResultsToolbar
                  totalCount={filteredEvents.length}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                  viewMode={pcViewMode}
                  onViewModeChange={setPcViewMode}
                />

                {loading ? (
                  <div
                    className={
                      pcViewMode === "grid"
                        ? EVENTS_PC_GRID_CLASS
                        : "flex flex-col gap-2"
                    }
                  >
                    {Array.from({ length: pageSize > 8 ? 8 : pageSize }).map((_, i) => (
                      <EventCardSkeleton key={i} />
                    ))}
                  </div>
                ) : listError ? (
                  <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-8 text-center">
                    <p className="text-sm text-red-600">{listError}</p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="mt-3 text-sm text-[#2D7A4F] underline"
                    >
                      再読み込み
                    </button>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-10 text-center">
                    <p className="mb-4 text-[13px] text-[#566358]">
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
                        setSelectedCategory("");
                        setIndoorOnly(false);
                        setReservationOnly(false);
                        handleTagsChange([]);
                        router.push("/events", { scroll: false });
                      }}
                      className="inline-flex h-10 items-center rounded-full bg-[#1A2214] px-5 text-[13px] font-medium text-white hover:bg-[#2D7A4F] transition-colors"
                    >
                      条件を緩める
                    </button>
                  </div>
                ) : (
                  <section ref={eventListRef} className="scroll-mt-4">
                    <div
                      className={
                        pcViewMode === "grid"
                          ? EVENTS_PC_GRID_CLASS
                          : "flex flex-col gap-2"
                      }
                    >
                      {paginatedEvents.map((event) =>
                        pcViewMode === "grid" ? (
                          <EventsListPcEventCard key={event.id} event={event} />
                        ) : (
                          <EventCard key={event.id} event={event} />
                        )
                      )}
                    </div>

                    <EventsPcPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      onLoadMore={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      hasMore={currentPage < totalPages}
                    />
                  </section>
                )}
              </>
            )}

            </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Mobile Layout ===== */}
      <div className="mg-events-mobile-page min-[900px]:hidden min-h-screen w-full space-y-1.5 bg-[#f7fbf8] px-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-0.5">
        <EventsMobileHero
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          quickChips={mobileQuickChips}
        />

        <div className="min-w-0">
          {view === "list" ? (
            <section ref={eventListRef} className="scroll-mt-4">
              <EventsMobileListHeader
                totalCount={filteredEvents.length}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                viewMode={mobileViewMode}
                onViewModeChange={setMobileViewMode}
              />

              {loading ? (
                mobileViewMode === "grid" ? (
                  <div className={EVENTS_MOBILE_GRID_CLASS}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <EventsMobileGridCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <li key={i}>
                        <EventsMobileRowCardSkeleton />
                      </li>
                    ))}
                  </ul>
                )
              ) : listError ? (
                <div className="rounded-[14px] border border-[#dde9e1] bg-white p-8 text-center shadow-[0_2px_10px_rgba(22,56,40,0.05)]">
                  <p className="text-sm text-red-600">{listError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm text-[#2f6b4f] underline"
                  >
                    再読み込み
                  </button>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="rounded-[14px] border border-[#dde9e1] bg-white p-10 text-center shadow-[0_2px_10px_rgba(22,56,40,0.05)]">
                  <p className="text-[13px] text-[#6a7068]">
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
                      setSelectedCategory("");
                      setIndoorOnly(false);
                      setReservationOnly(false);
                      handleTagsChange([]);
                      router.push("/events", { scroll: false });
                    }}
                    className="mt-4 inline-flex h-10 items-center rounded-full bg-[#163828] px-5 text-[13px] font-medium text-white"
                  >
                    条件を緩める
                  </button>
                </div>
              ) : (
                <>
                  {mobileViewMode === "grid" ? (
                    <div className={EVENTS_MOBILE_GRID_CLASS}>
                      {visibleMobileEvents.map((event) => (
                        <EventsMobileGridCard key={event.id} event={event} />
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {visibleMobileEvents.map((event) => (
                        <li key={event.id}>
                          <EventsMobileRowCard event={event} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {hasMoreMobile ? (
                    <button
                      type="button"
                      onClick={() =>
                        setMobileVisibleCount((n) =>
                          Math.min(n + EVENTS_MOBILE_PAGE_STEP, filteredEvents.length)
                        )
                      }
                      className="mt-4 flex h-11 w-full items-center justify-center gap-1 rounded-full border border-[#dde9e1] bg-white text-[13px] font-medium text-[#6a7068] shadow-[0_2px_10px_rgba(22,56,40,0.05)] transition active:bg-[#f7fbf8]"
                    >
                      もっと見る
                      <ChevronDown className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </>
              )}
            </section>
          ) : (
            <div className="pt-1">
              {!userPos && (
                <div className="mb-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
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
                  className="flex items-center justify-center rounded-[12px] border border-[#DDE8DF] bg-white"
                  style={{ height: "60vh", minHeight: "60vh" }}
                >
                  <p className="text-[13px] text-[#566358]">地図データを読み込み中...</p>
                </div>
              ) : mapEvents.length === 0 ? (
                filteredEvents.length > 0 ? (
                  <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-10 text-center">
                    <p className="text-[13px] leading-relaxed text-[#566358]">
                      地図に載せられる位置情報がない、または表示範囲外のイベントが含まれている可能性があります。
                    </p>
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className="mt-5 inline-flex h-11 items-center rounded-full bg-[#1A2214] px-6 text-[13px] font-medium text-white"
                    >
                      一覧で見る（全{filteredEvents.length}件）
                    </button>
                  </div>
                ) : (
                  <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-10 text-center">
                    <p className="text-[13px] text-[#566358]">
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
                        setSelectedCategory("");
                        handleTagsChange([]);
                        router.push("/events", { scroll: false });
                      }}
                      className="mt-4 inline-flex h-10 items-center rounded-full bg-[#1A2214] px-5 text-[13px] font-medium text-white"
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
        </div>

      </div>
    </div>
  );
}

export default function EventsPage() {
  return <EventsPageContent />;
}
