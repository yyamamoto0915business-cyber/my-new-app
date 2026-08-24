"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { fetchJsonArray } from "@/lib/fetch-json-array";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import type { StoreRecord } from "@/lib/stores/types";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import { FeedLoadError } from "@/components/home/FeedLoadError";
import { getRegionPreference, setRegionPreference } from "@/lib/area-preference-storage";
import { useRegionPreference } from "@/hooks/use-region-preference";
import { getCategoryPrefs } from "@/lib/category-preference-storage";
import {
  searchEvents,
  filterEventsByRegion,
  getEventsByDateRange,
} from "@/lib/events";
import { getPrimaryCategory, inferCategoryKeys } from "@/lib/inferCategory";
import { PcTownBoardHero } from "@/components/home/pc/PcTownBoardHero";
import {
  PcTownKindCards,
  MobileTownKindCards,
} from "@/components/home/pc/PcTownKindCards";
import { PcTownSidebar } from "@/components/home/pc/PcTownSidebar";
import {
  PcTownFilterBar,
  type TownTimeRange,
  type TownSortMode,
} from "@/components/home/pc/PcTownFilterBar";
import { PcTownKindColumns } from "@/components/home/pc/PcTownKindColumns";
import { PcRecommendedRow } from "@/components/home/pc/PcRecommendedRow";
import { PcPastEventsRow } from "@/components/home/pc/PcPastEventsRow";
import { MobileTownBoardHero } from "@/components/home/mobile/MobileTownBoardHero";
import { MobileTownFilterBar } from "@/components/home/mobile/MobileTownFilterBar";
import { MobileRecommendedCarousel } from "@/components/home/mobile/MobileRecommendedCarousel";
import { MobileWeekendEventsSection } from "@/components/home/mobile/MobileWeekendEventsSection";
import { MobilePastEventsSection } from "@/components/home/mobile/MobilePastEventsSection";
import { TownInfoKindFeed } from "@/components/home/TownInfoKindFeed";
import { TownGallery } from "@/components/home/TownGallery";

const KIND_KEYS = new Set(["all", "event", "store", "volunteer", "kitchen"]);

export function HomeOtonami() {
  const searchParams = useSearchParams();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const kindParam = searchParams.get("kind") ?? "";
  const { label: savedRegionLabel, preference: savedRegion } = useRegionPreference();
  const effectiveArea = prefecture || city || savedRegionLabel || savedRegion.prefecture;

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerRoleWithEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [storesLoading, setStoresLoading] = useState(true);
  const [volunteersLoading, setVolunteersLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  const [storesError, setStoresError] = useState(false);
  const [volunteersError, setVolunteersError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [categoryPrefs, setCategoryPrefsState] = useState<CategoryKey[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState(() =>
    KIND_KEYS.has(kindParam) ? kindParam : "all",
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [timeRange, setTimeRange] = useState<TownTimeRange>("all");
  const [sortMode, setSortMode] = useState<TownSortMode>("recommended");
  const [showEnded, setShowEnded] = useState(false);

  useEffect(() => {
    if (KIND_KEYS.has(kindParam)) {
      setActiveChip(kindParam);
    }
  }, [kindParam]);

  useEffect(() => {
    setCategoryPrefsState(getCategoryPrefs());
  }, []);
  useEffect(() => {
    if (!prefecture) return;
    const current = getRegionPreference();
    setRegionPreference({
      prefecture,
      city: city || current.city,
      setAsHome: current.setAsHome,
    });
  }, [prefecture, city]);

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
      if (result.ok) {
        setAllEvents(result.data);
        setEventsError(false);
      } else {
        setEventsError(true);
      }
      setEventsLoading(false);
    });

    void fetchJsonArray<StoreRecord>("/api/stores?limit=50").then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setStores(result.data);
        setStoresError(false);
      } else {
        setStoresError(true);
      }
      setStoresLoading(false);
    });

    void fetchJsonArray<VolunteerRoleWithEvent>("/api/volunteer/roles").then(
      (result) => {
        if (cancelled) return;
        if (result.ok) {
          setVolunteers(result.data);
          setVolunteersError(false);
        } else {
          setVolunteersError(true);
        }
        setVolunteersLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryTownData = useCallback(() => {
    setReloadKey((n) => n + 1);
  }, []);

  const hasTownItems =
    allEvents.length > 0 || stores.length > 0 || volunteers.length > 0;
  const bootLoading =
    eventsLoading && storesLoading && volunteersLoading && !hasTownItems;
  const eventsSectionLoading = eventsLoading && allEvents.length === 0;
  const townLoadError = eventsError || storesError || volunteersError;

  const isTownKindView =
    activeChip === "store" || activeChip === "volunteer" || activeChip === "kitchen";
  const isEventFocused = activeChip === "event";

  const hasActiveFilter =
    searchQuery !== "" ||
    (activeChip !== "all" && !isTownKindView) ||
    selectedCategory !== "" ||
    selectedArea !== "" ||
    timeRange !== "all";

  const isDefaultFilters =
    activeChip === "all" &&
    searchQuery === "" &&
    selectedCategory === "" &&
    selectedArea === "" &&
    timeRange === "all" &&
    sortMode === "recommended";

  const filteredEvents = useMemo((): Event[] => {
    if (isTownKindView) return [];
    let result = [...allEvents];
    if (searchQuery) result = searchEvents(result, searchQuery);
    if (timeRange === "today") result = getEventsByDateRange(result, "today");
    if (timeRange === "weekend") result = getEventsByDateRange(result, "weekend");
    if (selectedCategory) {
      result = result.filter((e) => {
        if (selectedCategory === "volunteer") {
          const keys = inferCategoryKeys(e);
          return keys.includes("volunteer") || getPrimaryCategory(e) === "volunteer";
        }
        return getPrimaryCategory(e) === selectedCategory;
      });
    }
    if (selectedArea) result = filterEventsByRegion(result, selectedArea, undefined);
    return result;
  }, [
    allEvents,
    searchQuery,
    timeRange,
    selectedCategory,
    selectedArea,
    isTownKindView,
  ]);

  const handleChipClick = useCallback((key: string) => {
    setActiveChip((prev) => {
      const next = prev === key ? "all" : key;
      if (next === "all") {
        setSelectedCategory("");
        setSelectedArea("");
        setSearchQuery("");
      }
      return next;
    });
  }, []);

  const handleSelectCategory = useCallback((key: string) => {
    setSelectedCategory(key);
    setActiveChip("all");
  }, []);

  const handleSelectArea = useCallback((area: string) => {
    setSelectedArea(area);
  }, []);

  const handleResetFilters = useCallback(() => {
    setActiveChip("all");
    setSelectedCategory("");
    setSelectedArea("");
    setSearchQuery("");
    setTimeRange("all");
    setSortMode("recommended");
  }, []);


  return (
    <div className="min-h-screen min-[900px]:bg-[#f3f4f1]">
      {/* PC（900px以上） */}
      <main className="mx-auto hidden max-w-[1280px] space-y-4 bg-[#f3f4f1] px-8 py-4 pb-4 min-[900px]:block">
        <PcTownBoardHero
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
        <PcTownKindCards activeChip={activeChip} onChipClick={handleChipClick} />

        <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-4">
          <div className="min-w-0 space-y-4">
            <PcTownFilterBar
              selectedArea={selectedArea}
              onAreaChange={handleSelectArea}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              sortMode={sortMode}
              onSortChange={setSortMode}
              showEnded={showEnded}
              onShowEndedChange={setShowEnded}
              onReset={handleResetFilters}
              isDefault={isDefaultFilters}
            />
            {isTownKindView ? (
              <TownInfoKindFeed
                kind={activeChip as "store" | "volunteer" | "kitchen"}
                searchQuery={searchQuery}
              />
            ) : (
              <>
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
                {!(townLoadError && !hasTownItems) ? (
                  <PcRecommendedRow
                    events={allEvents}
                    stores={stores}
                    volunteers={volunteers}
                    filteredEvents={filteredEvents}
                    hasActiveFilter={hasActiveFilter}
                    eventOnlyFilter={isEventFocused}
                    loading={bootLoading}
                    areaPreference={effectiveArea}
                    categoryPrefs={categoryPrefs}
                    searchQuery={searchQuery}
                    selectedArea={selectedArea}
                    title="今、まちで見つかる"
                    columns={4}
                    hideTabs
                    sortMode={sortMode}
                    includeEnded={showEnded}
                  />
                ) : null}
                {activeChip === "all" && !hasActiveFilter && (
                  <PcTownKindColumns
                    events={allEvents}
                    stores={stores}
                    volunteers={volunteers}
                    loading={bootLoading}
                    includeEnded={showEnded}
                    onChipClick={handleChipClick}
                    kindLoading={{
                      event: eventsLoading && allEvents.length === 0,
                      kitchen: storesLoading && stores.length === 0,
                      store: storesLoading && stores.length === 0,
                      volunteer: volunteersLoading && volunteers.length === 0,
                    }}
                  />
                )}
              </>
            )}
          </div>

          <PcTownSidebar
            events={allEvents}
            stores={stores}
            volunteers={volunteers}
            loading={bootLoading}
          />
        </div>

        <PcPastEventsRow events={allEvents} loading={eventsSectionLoading} />
        <TownGallery />
      </main>

      {/* モバイル */}
      <main className="w-full space-y-2 bg-[#f7fbf8] px-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-1 min-[900px]:hidden sm:max-w-none">
        <MobileTownBoardHero
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
        <MobileTownKindCards activeChip={activeChip} onChipClick={handleChipClick} />
        <MobileTownFilterBar
          selectedCategory={selectedCategory}
          onCategoryChange={handleSelectCategory}
          selectedArea={selectedArea}
          onAreaChange={handleSelectArea}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          sortMode={sortMode}
          onSortChange={setSortMode}
          onReset={handleResetFilters}
          isDefault={isDefaultFilters}
        />
        {isTownKindView ? (
          <TownInfoKindFeed
            kind={activeChip as "store" | "volunteer" | "kitchen"}
            searchQuery={searchQuery}
          />
        ) : (
          <>
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
            {!(townLoadError && !hasTownItems) ? (
              <MobileRecommendedCarousel
                events={allEvents}
                stores={stores}
                volunteers={volunteers}
                filteredEvents={filteredEvents}
                hasActiveFilter={hasActiveFilter}
                eventOnlyFilter={isEventFocused}
                loading={bootLoading}
                areaPreference={effectiveArea}
                categoryPrefs={categoryPrefs}
                searchQuery={searchQuery}
                selectedArea={selectedArea}
              />
            ) : null}
            {activeChip === "all" && !hasActiveFilter && (
              <MobileWeekendEventsSection
                events={allEvents}
                loading={eventsSectionLoading}
              />
            )}
            <MobilePastEventsSection
              events={allEvents}
              loading={eventsSectionLoading}
            />
            <TownGallery />
          </>
        )}
      </main>
    </div>
  );
}
