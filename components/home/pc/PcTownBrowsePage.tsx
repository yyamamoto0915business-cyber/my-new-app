"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchJsonArray } from "@/lib/fetch-json-array";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import type { StoreRecord } from "@/lib/stores/types";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import { FeedLoadError } from "@/components/home/FeedLoadError";
import { useRegionPreference } from "@/hooks/use-region-preference";
import { getCategoryPrefs } from "@/lib/category-preference-storage";
import {
  filterEventsByPrice,
  filterEventsByRegion,
  getEventStatus,
  searchEvents,
} from "@/lib/events";
import { getPrimaryCategory, inferCategoryKeys } from "@/lib/inferCategory";
import { PREFECTURES } from "@/lib/prefectures";
import type { TownSortMode, TownTimeRange } from "@/components/home/pc/PcTownFilterBar";
import { PcTownBrowseSidebar } from "@/components/home/pc/PcTownBrowseSidebar";
import { PcTownBrowseHero } from "@/components/home/pc/PcTownBrowseHero";
import { PcTownBrowseToolbar, type BrowseViewMode } from "@/components/home/pc/PcTownBrowseToolbar";
import { PcTownBrowseFeed } from "@/components/home/pc/PcTownBrowseFeed";
import { PcTownBrowseMap } from "@/components/home/pc/PcTownBrowseMap";
import {
  buildRecommendedFeed,
  eventsToMachiItems,
  gameToMachiItem,
  storeToMachiItem,
  volunteerToMachiItem,
  type MachiFeedItem,
} from "@/lib/machi/feed";
import {
  getBrowseDateBounds,
  ymdMatchesBrowseTime,
  type BrowsePriceFilter,
} from "@/components/home/pc/town-browse";
import type { PublicOrganizerGame } from "@/lib/organizer/public-games";
import { publicGameStartYmd } from "@/lib/organizer/public-games";

const KIND_KEYS = new Set(["all", "event", "store", "volunteer", "kitchen", "game"]);

const RESULT_TITLES: Record<string, string> = {
  all: "検索結果",
  event: "イベント",
  kitchen: "キッチンカー",
  store: "お店",
  volunteer: "ボランティア",
  game: "ゲーム",
};

function matchesQuery(item: MachiFeedItem, query: string): boolean {
  if (!query) return true;
  const hay = `${item.title} ${item.areaLabel} ${item.tags.join(" ")} ${item.kindLabel}`.toLowerCase();
  return hay.includes(query);
}

function prefectureOf(text: string | null | undefined): string | null {
  if (!text) return null;
  return PREFECTURES.find((prefecture) => text.includes(prefecture)) ?? null;
}

function hrefFrom(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `/machi?${query}` : "/machi";
}

/** 「すべて見る」の行き先。元のまちの情報ホームとは別画面。 */
export function PcTownBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const kindParam = searchParams.get("kind") ?? "";
  const { label: savedRegionLabel, preference: savedRegion } = useRegionPreference();
  const effectiveArea = prefecture || city || savedRegionLabel || savedRegion.prefecture;

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerRoleWithEvent[]>([]);
  const [games, setGames] = useState<PublicOrganizerGame[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [storesLoading, setStoresLoading] = useState(true);
  const [volunteersLoading, setVolunteersLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  const [storesError, setStoresError] = useState(false);
  const [volunteersError, setVolunteersError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [categoryPrefs, setCategoryPrefs] = useState<CategoryKey[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState(() =>
    KIND_KEYS.has(kindParam) ? kindParam : "all",
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [timeRange, setTimeRange] = useState<TownTimeRange>("all");
  const [specificDate, setSpecificDate] = useState("");
  const [sortMode, setSortMode] = useState<TownSortMode>("recommended");
  const [priceFilter, setPriceFilter] = useState<BrowsePriceFilter>("all");
  const [viewMode, setViewMode] = useState<BrowseViewMode>("card");
  const focusParam = searchParams.get("focus");
  const panel = focusParam === "picks" || focusParam === "upcoming" ? focusParam : "both";
  const dateBounds = useMemo(() => getBrowseDateBounds(), []);

  useEffect(() => {
    if (KIND_KEYS.has(kindParam)) setActiveChip(kindParam);
  }, [kindParam]);

  useEffect(() => {
    setCategoryPrefs(getCategoryPrefs());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    setStoresLoading(true);
    setVolunteersLoading(true);
    setEventsError(false);
    setStoresError(false);
    setVolunteersError(false);

    void fetchJsonArray<Event>("/api/events?limit=100").then((result) => {
      if (cancelled) return;
      if (result.ok) setAllEvents(result.data);
      else setEventsError(true);
      setEventsLoading(false);
    });
    void fetchJsonArray<StoreRecord>("/api/stores?limit=50").then((result) => {
      if (cancelled) return;
      if (result.ok) setStores(result.data);
      else setStoresError(true);
      setStoresLoading(false);
    });
    void fetchJsonArray<VolunteerRoleWithEvent>("/api/volunteer/roles").then((result) => {
      if (cancelled) return;
      if (result.ok) setVolunteers(result.data);
      else setVolunteersError(true);
      setVolunteersLoading(false);
    });
    void fetchJsonArray<PublicOrganizerGame>("/api/games?limit=50").then((result) => {
      if (cancelled) return;
      if (result.ok) setGames(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryTownData = useCallback(() => {
    setReloadKey((n) => n + 1);
  }, []);

  const hasTownItems = allEvents.length > 0 || stores.length > 0 || volunteers.length > 0 || games.length > 0;
  const bootLoading = eventsLoading && storesLoading && volunteersLoading && !hasTownItems;
  const townLoadError = eventsError || storesError || volunteersError;

  const selectKind = useCallback(
    (key: string) => {
      setActiveChip(key);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("focus");
      if (key === "all") params.delete("kind");
      else params.set("kind", key);
      router.replace(hrefFrom(params), { scroll: false });
    },
    [router, searchParams],
  );

  const focusHref = useCallback(
    (focus: "picks" | "upcoming" | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (focus) params.set("focus", focus);
      else params.delete("focus");
      return hrefFrom(params);
    },
    [searchParams],
  );

  const dateFilterActive = timeRange !== "all" && !(timeRange === "date" && specificDate === "");
  const browseFiltered =
    searchQuery !== "" ||
    activeChip !== "all" ||
    selectedCategory !== "" ||
    selectedArea !== "" ||
    dateFilterActive ||
    priceFilter !== "all";

  const kindCounts = useMemo(() => {
    const upcomingEvents = allEvents.filter((event) => getEventStatus(event) !== "ended");
    const kitchens = stores.filter((store) => store.kind === "kitchen_car").length;
    return {
      all: upcomingEvents.length + stores.length + volunteers.length + games.length,
      event: upcomingEvents.length,
      kitchen: kitchens,
      store: stores.length - kitchens,
      volunteer: volunteers.length,
      game: games.length,
    };
  }, [allEvents, stores, volunteers, games]);

  const areaCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const add = (text: string | null | undefined) => {
      const hit = prefectureOf(text);
      if (!hit) return;
      counts.set(hit, (counts.get(hit) ?? 0) + 1);
    };
    for (const event of allEvents) {
      if (getEventStatus(event) === "ended") continue;
      add(event.prefecture || event.city);
    }
    for (const store of stores) add(store.address);
    for (const role of volunteers) add(role.event?.prefecture || role.location);
    for (const game of games) add(game.areaLabel);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));
  }, [allEvents, stores, volunteers, games]);

  const priceCounts = useMemo(() => {
    const upcoming = allEvents.filter((event) => getEventStatus(event) !== "ended");
    return {
      free: upcoming.filter((event) => event.price === 0).length,
      paid: upcoming.filter((event) => event.price > 0).length,
    };
  }, [allEvents]);

  const pcBrowse = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let events = allEvents.filter((event) => getEventStatus(event) !== "ended");
    if (searchQuery) events = searchEvents(events, searchQuery);
    events = events.filter((event) =>
      ymdMatchesBrowseTime(event.date, timeRange, specificDate, dateBounds),
    );
    if (selectedCategory) {
      events = events.filter((event) => {
        if (selectedCategory === "volunteer") {
          const keys = inferCategoryKeys(event);
          return keys.includes("volunteer") || getPrimaryCategory(event) === "volunteer";
        }
        return getPrimaryCategory(event) === selectedCategory;
      });
    }
    if (selectedArea) events = filterEventsByRegion(events, selectedArea, undefined);
    if (priceFilter !== "all") events = filterEventsByPrice(events, priceFilter);

    const hideTimeless =
      dateFilterActive ||
      priceFilter !== "all" ||
      (selectedCategory !== "" && selectedCategory !== "volunteer");
    let storeItems = hideTimeless
      ? []
      : stores.map(storeToMachiItem).filter((item) => matchesQuery(item, query));
    if (selectedArea) {
      storeItems = storeItems.filter((item) => item.areaLabel.includes(selectedArea));
    }

    const volunteerItems =
      priceFilter !== "all" || (selectedCategory !== "" && selectedCategory !== "volunteer")
        ? []
        : volunteers
            .filter((role) => {
              const ymd = role.dateTime.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
              return ymdMatchesBrowseTime(ymd, timeRange, specificDate, dateBounds);
            })
            .map(volunteerToMachiItem)
            .filter((item) => matchesQuery(item, query))
            .filter((item) => !selectedArea || item.areaLabel.includes(selectedArea));

    const gameItems =
      priceFilter === "paid" || (selectedCategory !== "" && selectedCategory !== "volunteer")
        ? []
        : games
            .filter((game) =>
              ymdMatchesBrowseTime(publicGameStartYmd(game.startsAt), timeRange, specificDate, dateBounds),
            )
            .map(gameToMachiItem)
            .filter((item) => matchesQuery(item, query))
            .filter((item) => !selectedArea || item.areaLabel.includes(selectedArea));

    const eventItems = eventsToMachiItems(events, false);
    let mixed: MachiFeedItem[];
    if (activeChip === "event") mixed = eventItems;
    else if (activeChip === "kitchen") mixed = storeItems.filter((item) => item.kind === "kitchen_car");
    else if (activeChip === "store") mixed = storeItems.filter((item) => item.kind === "store");
    else if (activeChip === "volunteer") mixed = volunteerItems;
    else if (activeChip === "game") mixed = gameItems;
    else mixed = [...eventItems, ...storeItems, ...volunteerItems, ...gameItems];

    if (sortMode === "popular") {
      const score = new Map(events.map((event) => [`event:${event.id}`, event.participantCount ?? 0]));
      mixed = [...mixed].sort(
        (a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0) || a.sortAt - b.sortAt,
      );
    }

    const picks = buildRecommendedFeed(events, stores, volunteers, {
      areaPreference: effectiveArea,
      categoryPrefs,
      limit: panel === "picks" ? 24 : 4,
      mode: sortMode,
      games,
    }).filter((item) => matchesQuery(item, query));
    const pickIds = new Set(panel === "both" ? picks.map((item) => item.id) : []);
    const dated = mixed
      .filter((item) => item.kind === "event" || item.kind === "volunteer" || item.kind === "game")
      .filter((item) => !pickIds.has(item.id))
      .sort((a, b) => a.sortAt - b.sortAt);
    const places = mixed.filter(
      (item) => (item.kind === "store" || item.kind === "kitchen_car") && !pickIds.has(item.id),
    );
    const upcoming = [...dated, ...places].slice(0, panel === "upcoming" ? 48 : 4);

    return { events, picks, upcoming, results: mixed };
  }, [
    allEvents,
    stores,
    volunteers,
    games,
    searchQuery,
    timeRange,
    specificDate,
    dateBounds,
    selectedCategory,
    selectedArea,
    priceFilter,
    dateFilterActive,
    activeChip,
    sortMode,
    effectiveArea,
    categoryPrefs,
    panel,
  ]);

  return (
    <div className="min-h-screen bg-[#f4f7f2]">
      <main className="mx-auto max-w-[1280px] px-3 py-3 min-[900px]:px-6 min-[900px]:py-4">
        <Link href="/" className="mb-3 inline-flex text-[12px] text-[#6d7c70] hover:text-[#1e3d2c]">
          ← まちの情報にもどる
        </Link>
        <div className="flex items-start gap-4">
          <div className="hidden min-[900px]:block">
          <PcTownBrowseSidebar
            activeKind={activeChip}
            onKindChange={selectKind}
            counts={kindCounts}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            specificDate={specificDate}
            onSpecificDateChange={setSpecificDate}
            weekendLabel={dateBounds.weekendLabel}
            nextWeekLabel={dateBounds.nextWeekLabel}
            monthLabel={dateBounds.monthLabel}
            areas={areaCounts}
            selectedArea={selectedArea}
            onAreaChange={setSelectedArea}
            priceFilter={priceFilter}
            onPriceFilterChange={setPriceFilter}
            freeCount={priceCounts.free}
            paidCount={priceCounts.paid}
          />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <PcTownBrowseHero />
            <PcTownBrowseToolbar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              selectedArea={selectedArea}
              onAreaChange={setSelectedArea}
              priceFilter={priceFilter}
              onPriceFilterChange={setPriceFilter}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortMode={sortMode}
              onSortChange={setSortMode}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            {townLoadError ? (
              <FeedLoadError
                message={
                  hasTownItems
                    ? "一部の情報を読み込めませんでした"
                    : "まちの情報を読み込めませんでした"
                }
                onRetry={retryTownData}
              />
            ) : null}
            {viewMode === "map" ? (
              <PcTownBrowseMap events={pcBrowse.events} />
            ) : (
              <PcTownBrowseFeed
                picks={pcBrowse.picks}
                upcoming={pcBrowse.upcoming}
                results={browseFiltered ? pcBrowse.results : null}
                resultsTitle={
                  activeChip === "all" ? "絞り込み結果" : (RESULT_TITLES[activeChip] ?? "絞り込み結果")
                }
                panel={panel}
                loading={bootLoading}
                picksHref={focusHref("picks")}
                upcomingHref={focusHref("upcoming")}
                backHref={focusHref(null)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
