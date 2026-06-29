"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { getHeroWithSubCards } from "@/lib/filterEvents";
import { MobileEventCard, MOBILE_EVENT_CARD_WIDTH } from "./MobileEventCard";

const CARD_COUNT = 9;
const VISIBLE_COUNT = 3;
const GAP_PX = 8;

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  const recommendedEvents = useMemo(() => {
    const { featured, subCards } = getHeroWithSubCards(events, areaPreference, categoryPrefs, 4);
    const list = [featured, ...subCards].filter((e): e is Event => e != null);
    if (list.length >= CARD_COUNT) return list.slice(0, CARD_COUNT);
    const ids = new Set(list.map((e) => e.id));
    const rest = events.filter((e) => !ids.has(e.id));
    return [...list, ...rest].slice(0, CARD_COUNT);
  }, [events, areaPreference, categoryPrefs]);

  const displayEvents = hasActiveFilter ? (filteredEvents ?? []) : recommendedEvents;

  const pageCount = Math.max(1, Math.ceil(displayEvents.length / VISIBLE_COUNT));
  const dotCount = Math.min(4, pageCount);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const card = el.querySelector<HTMLElement>("article");
      if (!card) return;
      const step = card.offsetWidth + GAP_PX;
      const pageIndex = Math.round(el.scrollLeft / (step * VISIBLE_COUNT));
      setActivePage(Math.min(dotCount - 1, Math.max(0, pageIndex)));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [dotCount, displayEvents.length]);

  return (
    <section aria-label="おすすめイベント" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-[#e8c838] text-[#e8c838]" aria-hidden />
          <h2 className="text-[13px] font-semibold text-[#0e1610]">おすすめイベント</h2>
        </div>
        <Link href="/events" className="text-[11px] font-medium text-[#2c7a88]">
          すべて見る →
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-2">
          {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/2] shrink-0 animate-pulse rounded-[12px] bg-[#e8ede4]"
              style={{ width: MOBILE_EVENT_CARD_WIDTH }}
            />
          ))}
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="rounded-[14px] bg-white p-6 text-center ring-1 ring-[#e3e8e4]">
          <p className="text-[12px] text-[#6a6258]">
            {hasActiveFilter
              ? "条件に合うイベントが見つかりませんでした"
              : "おすすめのイベントがありません"}
          </p>
          <Link
            href="/events"
            className="mt-2 inline-flex h-8 items-center rounded-full bg-[#1a2b3c] px-4 text-[11px] font-medium text-white"
          >
            イベント一覧を見る
          </Link>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="-mx-2.5 flex gap-2 overflow-x-auto px-2.5 scrollbar-hide snap-x snap-mandatory"
          >
            {displayEvents.map((event) => (
              <MobileEventCard key={event.id} event={event} />
            ))}
          </div>
          {displayEvents.length > VISIBLE_COUNT && (
            <div className="flex justify-center gap-1" aria-hidden>
              {Array.from({ length: dotCount }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === activePage ? "w-3.5 bg-[#4a9a68]" : "w-1 bg-[#d0d8d4]"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
