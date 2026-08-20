"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import type { StoreRecord } from "@/lib/stores/types";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import {
  buildRecommendedFeed,
  eventsToMachiItems,
  filterRecommendedFeed,
} from "@/lib/machi/feed";
import { MachiFeedCard } from "@/components/machi/MachiFeedCard";

const CARD_COUNT = 5;
const SKELETON_COUNT = 3;

type Props = {
  events: Event[];
  stores: StoreRecord[];
  volunteers: VolunteerRoleWithEvent[];
  filteredEvents?: Event[];
  hasActiveFilter?: boolean;
  eventOnlyFilter?: boolean;
  loading: boolean;
  areaPreference: string;
  categoryPrefs: CategoryKey[];
  searchQuery?: string;
  selectedArea?: string;
};

export function MobileRecommendedCarousel({
  events,
  stores,
  volunteers,
  filteredEvents,
  hasActiveFilter = false,
  eventOnlyFilter = false,
  loading,
  areaPreference,
  categoryPrefs,
  searchQuery = "",
  selectedArea = "",
}: Props) {
  const displayItems = useMemo(() => {
    if (hasActiveFilter) {
      const eventItems = eventsToMachiItems(filteredEvents ?? []);
      if (eventOnlyFilter) {
        return filterRecommendedFeed(eventItems, {
          query: searchQuery,
          area: selectedArea,
          eventOnly: true,
        });
      }
      const allFiltered = filterRecommendedFeed(
        [
          ...eventItems,
          ...buildRecommendedFeed([], stores, volunteers, {
            areaPreference,
            categoryPrefs,
            limit: 50,
          }),
        ],
        { query: searchQuery, area: selectedArea },
      );
      return allFiltered.slice(0, CARD_COUNT);
    }

    return buildRecommendedFeed(events, stores, volunteers, {
      areaPreference,
      categoryPrefs,
      limit: CARD_COUNT,
    });
  }, [
    hasActiveFilter,
    eventOnlyFilter,
    filteredEvents,
    searchQuery,
    selectedArea,
    events,
    stores,
    volunteers,
    areaPreference,
    categoryPrefs,
  ]);

  return (
    <section aria-label="おすすめ" className="mg-mobile-section">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-[#e8c838] text-[#e8c838]" aria-hidden />
          <h2 className="mg-mobile-section-title">おすすめ</h2>
        </div>
        <Link href="/" className="text-[11px] font-medium text-[#2f6b4f]">
          すべて見る →
        </Link>
      </div>

      {loading ? (
        <div className="-mx-2 flex gap-1.5 overflow-x-auto px-2 scrollbar-hide">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div
              key={i}
              className="h-[200px] w-[148px] shrink-0 animate-pulse rounded-[16px] bg-[#e8ede4]"
            />
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="rounded-[18px] border border-[#dde9e1] bg-[#f7fbf8] p-4 text-center">
          <p className="text-[11px] text-[#6a6258]">
            {hasActiveFilter
              ? "条件に合う情報が見つかりませんでした"
              : "おすすめの情報がありません"}
          </p>
          <Link
            href="/"
            className="mt-1.5 inline-flex h-8 items-center rounded-full bg-[#163828] px-4 text-[11px] font-medium text-white"
          >
            まちの情報を探す
          </Link>
        </div>
      ) : (
        <div className="-mx-2 flex gap-1.5 overflow-x-auto px-2 pb-0.5 scrollbar-hide snap-x snap-mandatory">
          {displayItems.map((item) => (
            <MachiFeedCard key={item.id} item={item} compact />
          ))}
        </div>
      )}
    </section>
  );
}
