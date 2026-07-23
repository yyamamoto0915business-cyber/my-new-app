"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { getEventStatus } from "@/lib/events";
import { getHeroWithSubCards } from "@/lib/filterEvents";
import { MobileEventCard, MOBILE_EVENT_CARD_WIDTH } from "./MobileEventCard";

const CARD_COUNT = 5;
const SKELETON_COUNT = 3;

type Props = {
  events: Event[];
  filteredEvents?: Event[];
  hasActiveFilter?: boolean;
  loading: boolean;
  areaPreference: string;
  categoryPrefs: CategoryKey[];
};

export function MobileRecommendedCarousel({
  events,
  filteredEvents,
  hasActiveFilter = false,
  loading,
  areaPreference,
  categoryPrefs,
}: Props) {
  const recommendedEvents = useMemo(() => {
    const { featured, subCards } = getHeroWithSubCards(events, areaPreference, categoryPrefs, 4);
    const list = [featured, ...subCards].filter((e): e is Event => e != null);
    if (list.length >= CARD_COUNT) return list.slice(0, CARD_COUNT);
    const ids = new Set(list.map((e) => e.id));
    const rest = events.filter(
      (e) => !ids.has(e.id) && getEventStatus(e) !== "ended"
    );
    return [...list, ...rest].slice(0, CARD_COUNT);
  }, [events, areaPreference, categoryPrefs]);

  const displayEvents = hasActiveFilter
    ? (filteredEvents ?? []).filter((e) => getEventStatus(e) !== "ended")
    : recommendedEvents;

  return (
    <section aria-label="おすすめイベント" className="mg-mobile-section">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-[#e8c838] text-[#e8c838]" aria-hidden />
          <h2 className="mg-mobile-section-title">おすすめイベント</h2>
        </div>
        <Link href="/events" className="text-[11px] font-medium text-[#2f6b4f]">
          すべて見る →
        </Link>
      </div>

      {loading ? (
        <div className="-mx-2 flex gap-1.5 overflow-x-auto px-2 scrollbar-hide">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 overflow-hidden rounded-[16px] border border-[#dde9e1] bg-white"
              style={{ width: MOBILE_EVENT_CARD_WIDTH }}
            >
              <div className="aspect-[3/2] animate-pulse bg-[#e8ede4]" />
              <div className="space-y-1 px-2 py-1.5">
                <div className="h-2 w-3/4 animate-pulse rounded bg-[#e8ede4]" />
                <div className="h-2.5 w-full animate-pulse rounded bg-[#e8ede4]" />
                <div className="h-2 w-2/3 animate-pulse rounded bg-[#e8ede4]" />
              </div>
            </div>
          ))}
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="rounded-[18px] border border-[#dde9e1] bg-[#f7fbf8] p-4 text-center">
          <p className="text-[11px] text-[#6a6258]">
            {hasActiveFilter
              ? "条件に合うイベントが見つかりませんでした"
              : "おすすめのイベントがありません"}
          </p>
          <Link
            href="/events"
            className="mt-1.5 inline-flex h-8 items-center rounded-full bg-[#163828] px-4 text-[11px] font-medium text-white"
          >
            イベント一覧を見る
          </Link>
        </div>
      ) : (
        <div className="-mx-2 flex gap-1.5 overflow-x-auto px-2 pb-0.5 scrollbar-hide snap-x snap-mandatory">
          {displayEvents.map((event) => (
            <MobileEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
