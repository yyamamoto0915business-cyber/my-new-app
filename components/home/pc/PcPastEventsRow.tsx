"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { getPastEvents } from "@/lib/events";
import { PcEventCard } from "./PcEventCard";
import { EventCardSkeleton } from "@/app/events/event-card-skeleton";

type Props = {
  events: Event[];
  loading: boolean;
};

const CARD_COUNT = 5;

export function PcPastEventsRow({ events, loading }: Props) {
  const pastEvents = useMemo(
    () => getPastEvents(events, CARD_COUNT),
    [events]
  );

  if (!loading && pastEvents.length === 0) return null;

  return (
    <section
      aria-label="過去のイベント"
      className="space-y-2 rounded-[16px] bg-white px-3 py-3 ring-1 ring-[#e3e8e4]/80"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#5a7a68]" aria-hidden />
            <h2 className="text-[14px] font-semibold text-[#0e1610]">
              過去のイベント
            </h2>
          </div>
          <p className="text-[11px] text-[#5a6a60]">
            地域で開催された体験をふりかえる
          </p>
        </div>
        <Link
          href="/events"
          className="text-[12px] font-medium text-[#2c7a88] hover:underline"
        >
          すべて見る →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: CARD_COUNT }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2.5">
          {pastEvents.map((event) => (
            <PcEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
