"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Event } from "@/lib/db/types";
import type { EventWithDistance } from "@/components/events-map/types";

const MapPageContainer = dynamic(
  () =>
    import("@/components/events-map/MapPageContainer").then((mod) => mod.MapPageContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[70vh] items-center justify-center rounded-[16px] bg-white text-[13px] text-[#5d6e62]">
        地図を読み込み中...
      </div>
    ),
  },
);

type Props = {
  events: Event[];
};

export function PcTownBrowseMap({ events }: Props) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const mapEvents: EventWithDistance[] = events.filter(
    (event) => typeof event.latitude === "number" && typeof event.longitude === "number",
  );

  if (mapEvents.length === 0) {
    return (
      <div className="rounded-[16px] border border-[#e6eee6] bg-white px-6 py-16 text-center">
        <p className="text-[13px] text-[#5d6e62]">地図に表示できるイベントは、まだありません。</p>
        <p className="mt-1 text-[12px] text-[#8a978c]">位置情報のあるイベントだけを地図に載せています。</p>
      </div>
    );
  }

  return (
    <MapPageContainer
      mapEvents={mapEvents}
      mapLoading={false}
      userPos={userPos}
      availableOnly={false}
      sortOrder="date_asc"
      onCenterToCurrentLocation={() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((position) => {
          setUserPos({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        });
      }}
      onSearchInBounds={async () => {}}
    />
  );
}
