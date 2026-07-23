"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { getEventStatus } from "@/lib/events";
import { getHeroWithSubCards } from "@/lib/filterEvents";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { PcEventCard } from "./PcEventCard";
import { EventCardSkeleton } from "@/app/events/event-card-skeleton";

type Tab = "recommended" | "popular";

type Props = {
  events: Event[];
  filteredEvents?: Event[];
  hasActiveFilter?: boolean;
  loading: boolean;
  areaPreference: string;
  categoryPrefs: CategoryKey[];
};

const CARD_COUNT = 5;

export function PcRecommendedRow({
  events,
  filteredEvents,
  hasActiveFilter = false,
  loading,
  areaPreference,
  categoryPrefs,
}: Props) {
  const [tab, setTab] = useState<Tab>("recommended");
  const [popularEvents, setPopularEvents] = useState<Event[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);

  useEffect(() => {
    if (tab !== "popular") return;
    setPopularLoading(true);
    fetchWithTimeout(`/api/events/rankings?type=popular&limit=${CARD_COUNT}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data: Event[]) => setPopularEvents(Array.isArray(data) ? data : []))
      .catch(() => setPopularEvents([]))
      .finally(() => setPopularLoading(false));
  }, [tab]);

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
    : tab === "recommended"
      ? recommendedEvents
      : popularEvents;
  const isLoading = loading && (hasActiveFilter || tab === "recommended" ? loading : popularLoading);

  return (
    <section
      aria-label="おすすめイベント"
      className="space-y-2 rounded-[16px] bg-white px-3 py-3 ring-1 ring-[#e3e8e4]/80"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-[#e8c838] text-[#e8c838]" aria-hidden />
            <h2 className="text-[14px] font-semibold text-[#0e1610]">おすすめイベント</h2>
          </div>
          {!hasActiveFilter && (
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
              {loading ? "読み込み中..." : `${displayEvents.length}件見つかりました`}
            </span>
          )}
        </div>
        <Link
          href="/events"
          className="text-[12px] font-medium text-[#2c7a88] hover:underline"
        >
          すべて見る →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: CARD_COUNT }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="rounded-[14px] p-10 text-center">
          <p className="text-[13px] text-[#6a6258]">
            {hasActiveFilter ? "条件に合うイベントが見つかりませんでした" : "おすすめのイベントがありません"}
          </p>
          <Link
            href="/events"
            className="mt-4 inline-flex h-9 items-center rounded-full bg-[#1a2b3c] px-5 text-[12px] font-medium text-white"
          >
            イベント一覧を見る
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2.5">
          {displayEvents.map((event) => (
            <PcEventCard key={event.id} event={event} />
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
