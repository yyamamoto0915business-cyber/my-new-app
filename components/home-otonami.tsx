"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { getRegionPreference, setRegionPreference } from "@/lib/area-preference-storage";
import { useRegionPreference } from "@/hooks/use-region-preference";
import { getCategoryPrefs } from "@/lib/category-preference-storage";
import {
  searchEvents,
  filterEventsByPrice,
  filterEventsByChildFriendly,
  filterEventsByRegion,
  getEventsByDateRange,
} from "@/lib/events";
import { getPrimaryCategory, inferCategoryKeys } from "@/lib/inferCategory";
import { PcDiscoverHero } from "@/components/home/pc/PcDiscoverHero";
import { PcSearchFiltersPanel } from "@/components/home/pc/PcSearchFiltersPanel";
import { PcRecommendedRow } from "@/components/home/pc/PcRecommendedRow";
import { PcCtaBanners } from "@/components/home/pc/PcCtaBanners";
import { MobileDiscoverHero } from "@/components/home/mobile/MobileDiscoverHero";
import { MobileRegionSection } from "@/components/home/mobile/MobileRegionSection";
import { MobileCategoryGrid } from "@/components/home/mobile/MobileCategoryGrid";
import { MobileRecommendedCarousel } from "@/components/home/mobile/MobileRecommendedCarousel";
import { MobileCtaBanners } from "@/components/home/mobile/MobileCtaBanners";

export function HomeOtonami() {
  const searchParams = useSearchParams();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const { label: savedRegionLabel, preference: savedRegion } = useRegionPreference();
  const effectiveArea = prefecture || city || savedRegionLabel || savedRegion.prefecture;

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryPrefs, setCategoryPrefsState] = useState<CategoryKey[]>([]);

  // フィルター state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

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

  const loadData = useCallback(() => {
    setLoading(true);
    fetchWithTimeout(`/api/events?limit=100`)
      .then((r) => r.json())
      .then((events) => setAllEvents(Array.isArray(events) ? events : []))
      .catch(() => setAllEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasActiveFilter =
    searchQuery !== "" || activeChip !== "all" || selectedCategory !== "" || selectedArea !== "";

  const filteredEvents = useMemo((): Event[] => {
    if (!hasActiveFilter) return allEvents;
    let result = [...allEvents];
    if (searchQuery) result = searchEvents(result, searchQuery);
    if (activeChip === "today") result = getEventsByDateRange(result, "today");
    if (activeChip === "weekend") result = getEventsByDateRange(result, "weekend");
    if (activeChip === "free") result = filterEventsByPrice(result, "free");
    if (activeChip === "family") result = filterEventsByChildFriendly(result, true);
    if (activeChip === "workshop") result = result.filter((e) => getPrimaryCategory(e) === "workshop");
    if (activeChip === "community") result = result.filter((e) => getPrimaryCategory(e) === "community");
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
  }, [allEvents, searchQuery, activeChip, selectedCategory, selectedArea, hasActiveFilter]);

  const handleChipClick = useCallback((key: string) => {
    if (key === "all") {
      setActiveChip("all");
      setSelectedCategory("");
      setSelectedArea("");
      setSearchQuery("");
    } else {
      setActiveChip(key);
    }
  }, []);

  const handleSelectCategory = useCallback((key: string) => {
    setSelectedCategory(key);
    setActiveChip("all");
  }, []);

  const handleSelectArea = useCallback((area: string) => {
    setSelectedArea(area);
  }, []);

  return (
    <div className="min-h-screen min-[900px]:bg-[#f3f4f1]">
      {/* PC（900px以上） */}
      <main className="mx-auto hidden max-w-[1280px] space-y-4 bg-[#f3f4f1] px-8 py-4 pb-4 min-[900px]:block">
        <PcDiscoverHero
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          activeChip={activeChip}
          onChipClick={handleChipClick}
        />
        <PcSearchFiltersPanel
          selectedArea={selectedArea}
          onAreaChange={handleSelectArea}
          selectedCategory={selectedCategory}
          onCategoryChange={handleSelectCategory}
        />
        <PcRecommendedRow
          events={allEvents}
          filteredEvents={filteredEvents}
          hasActiveFilter={hasActiveFilter}
          loading={loading}
          areaPreference={effectiveArea}
          categoryPrefs={categoryPrefs}
        />
        <PcCtaBanners />
      </main>

      {/* モバイル（モックアップ準拠） */}
      <main className="w-full space-y-2 bg-[#f7fbf8] px-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-1 min-[900px]:hidden sm:max-w-none">
        <MobileDiscoverHero
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          activeChip={activeChip}
          onChipClick={handleChipClick}
        />
        <MobileRecommendedCarousel
          events={allEvents}
          filteredEvents={filteredEvents}
          hasActiveFilter={hasActiveFilter}
          loading={loading}
          areaPreference={effectiveArea}
          categoryPrefs={categoryPrefs}
        />
        <section aria-label="カテゴリと地域で探す" className="mg-mobile-section space-y-2.5">
          <MobileCategoryGrid
            embedded
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
          <div className="border-t border-[#eef2ef] pt-2">
            <MobileRegionSection
              embedded
              selectedArea={selectedArea}
              onSelectArea={handleSelectArea}
            />
          </div>
        </section>
        <MobileCtaBanners />
      </main>
    </div>
  );
}
