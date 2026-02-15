"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Event } from "../lib/db/types";

type EventWithDistance = Event & { distanceKm?: number };

const EventsMap = dynamic(
  () => import("./events-map").then((m) => m.EventsMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/60 dark:border-zinc-700/60 dark:bg-zinc-800/60"
        style={{ height: 280 }}
      >
        <p className="text-sm text-zinc-600">地図を読み込み中...</p>
      </div>
    ),
  }
);

const DEFAULT_LAT = 35.6812;
const DEFAULT_LNG = 139.7671;

export function HomeMapPreview() {
  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split("T")[0];
    const params = new URLSearchParams({
      lat: String(DEFAULT_LAT),
      lng: String(DEFAULT_LNG),
      radius: "50",
      start: today,
      end: weekEndStr,
      price: "all",
      child_friendly: "false",
      limit: "50",
    });
    fetch(`/api/events/map?${params}`)
      .then((res) => res.json())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="w-full space-y-3">
      <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        開催中のイベント
      </h2>
      <EventsMap
        events={events}
        center={null}
        selectedEventId={selectedEventId}
        onSelectEvent={setSelectedEventId}
        dateRange="week"
        priceFilter="all"
        childFriendlyOnly={false}
        height={280}
        showLegend={true}
      />
      <Link
        href="/events"
        className="block text-center text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        イベント一覧・地図で詳しく見る →
      </Link>
    </div>
  );
}
