"use client";

import { useState, useEffect, useMemo } from "react";
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
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { MachiFeedCard } from "@/components/machi/MachiFeedCard";

type Tab = "recommended" | "popular";

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
  /** 見出し（既定: おすすめ） */
  title?: string;
  /** カラム数（既定: 5） */
  columns?: 4 | 5;
  /** 内蔵の「あなたにおすすめ／人気順」タブを隠す */
  hideTabs?: boolean;
  /** 並びを外部から制御（指定時は内蔵タブより優先） */
  sortMode?: Tab;
  /** 終了イベントも含める */
  includeEnded?: boolean;
};

const CARD_COUNT = 5;

function FeedCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e8ebe6] bg-white">
      <div className="aspect-[16/10] animate-pulse bg-[#e8ede4]" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/2 animate-pulse rounded bg-[#e8ede4]" />
        <div className="h-8 w-full animate-pulse rounded bg-[#e8ede4]" />
      </div>
    </div>
  );
}

export function PcRecommendedRow({
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
  title = "おすすめ",
  columns = 5,
  hideTabs = false,
  sortMode,
  includeEnded = false,
}: Props) {
  const [internalTab, setInternalTab] = useState<Tab>("recommended");
  const tab = sortMode ?? internalTab;
  const setTab = setInternalTab;
  const [popularEvents, setPopularEvents] = useState<Event[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);

  const count = columns;
  const gridClass = columns === 4 ? "grid-cols-4" : "grid-cols-5";

  useEffect(() => {
    if (tab !== "popular" || hasActiveFilter) return;
    setPopularLoading(true);
    fetchWithTimeout(`/api/events/rankings?type=popular&limit=${count}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data: Event[]) => setPopularEvents(Array.isArray(data) ? data : []))
      .catch(() => setPopularEvents([]))
      .finally(() => setPopularLoading(false));
  }, [tab, hasActiveFilter, count]);

  const displayItems = useMemo(() => {
    if (hasActiveFilter) {
      const eventItems = eventsToMachiItems(filteredEvents ?? [], includeEnded);
      if (eventOnlyFilter) {
        return filterRecommendedFeed(eventItems, {
          query: searchQuery,
          area: selectedArea,
          eventOnly: true,
        }).slice(0, count);
      }
      const allFiltered = filterRecommendedFeed(
        [
          ...eventItems,
          ...buildRecommendedFeed([], stores, volunteers, {
            areaPreference,
            categoryPrefs,
            limit: 50,
            includeEnded,
          }),
        ],
        { query: searchQuery, area: selectedArea },
      );
      return allFiltered.slice(0, count);
    }

    return buildRecommendedFeed(events, stores, volunteers, {
      areaPreference,
      categoryPrefs,
      limit: count,
      mode: tab,
      popularEvents: tab === "popular" ? popularEvents : undefined,
      includeEnded,
    });
  }, [
    hasActiveFilter,
    count,
    includeEnded,
    eventOnlyFilter,
    filteredEvents,
    searchQuery,
    selectedArea,
    events,
    stores,
    volunteers,
    areaPreference,
    categoryPrefs,
    tab,
    popularEvents,
  ]);

  const isLoading =
    loading || (!hasActiveFilter && tab === "popular" && popularLoading);

  return (
    <section
      aria-label={title}
      className="space-y-2 rounded-[16px] bg-white px-3 py-3 ring-1 ring-[#e3e8e4]/80"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-[#e8c838] text-[#e8c838]" aria-hidden />
            <h2 className="text-[14px] font-semibold text-[#0e1610]">{title}</h2>
          </div>
          {!hideTabs && !hasActiveFilter && (
            <div className="flex gap-1.5">
              <TabButton active={tab === "recommended"} onClick={() => setTab("recommended")}>
                あなたにおすすめ
              </TabButton>
              <TabButton active={tab === "popular"} onClick={() => setTab("popular")}>
                人気順
              </TabButton>
            </div>
          )}
          {hasActiveFilter && (
            <span className="text-[12px] text-[#5a6a60]">
              {loading ? "読み込み中..." : `${displayItems.length}件見つかりました`}
            </span>
          )}
        </div>
        <Link href="/" className="text-[12px] font-medium text-[#2c7a88] hover:underline">
          すべて見る →
        </Link>
      </div>

      {isLoading ? (
        <div className={`grid ${gridClass} gap-2.5`}>
          {Array.from({ length: count }).map((_, i) => (
            <FeedCardSkeleton key={i} />
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="rounded-[14px] p-10 text-center">
          <p className="text-[13px] text-[#6a6258]">
            {hasActiveFilter
              ? "条件に合う情報が見つかりませんでした"
              : "おすすめの情報がありません"}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-9 items-center rounded-full bg-[#1a2b3c] px-5 text-[12px] font-medium text-white"
          >
            まちの情報を探す
          </Link>
        </div>
      ) : (
        <div className={`grid ${gridClass} gap-2.5`}>
          {displayItems.map((item) => (
            <MachiFeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center rounded-full px-3.5 text-[11px] font-medium transition ${
        active
          ? "bg-[#1a2b3c] text-white"
          : "bg-white text-[#3d5c48] ring-1 ring-[#e3e8e4] hover:ring-[#c8dcd0]"
      }`}
    >
      {children}
    </button>
  );
}
