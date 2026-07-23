"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { getPastEvents } from "@/lib/events";
import { MobileEventCard, MOBILE_EVENT_CARD_WIDTH } from "./MobileEventCard";

const CARD_COUNT = 5;
const SKELETON_COUNT = 3;

type Props = {
  events: Event[];
  loading: boolean;
};

export function MobilePastEventsSection({ events, loading }: Props) {
  const pastEvents = useMemo(
    () => getPastEvents(events, CARD_COUNT),
    [events]
  );

  if (!loading && pastEvents.length === 0) return null;

  return (
    <section aria-label="過去のイベント" className="mg-mobile-section">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[#5a7a68]" aria-hidden />
            <h2 className="mg-mobile-section-title">過去のイベント</h2>
          </div>
          <p className="mt-0.5 pl-5 text-[10px] leading-snug text-[#5a6a60]">
            地域で開催された体験をふりかえる
          </p>
        </div>
        <Link
          href="/events"
          className="shrink-0 text-[11px] font-medium text-[#2f6b4f]"
        >
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
      ) : (
        <div className="-mx-2 flex gap-1.5 overflow-x-auto px-2 pb-0.5 scrollbar-hide snap-x snap-mandatory">
          {pastEvents.map((event) => (
            <MobileEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
