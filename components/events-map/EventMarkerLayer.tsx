"use client";

import { useEffect, useMemo, useRef } from "react";
import type { EventWithDistance } from "./types";

type Props = {
  leaflet: typeof import("leaflet") | null;
  map: L.Map | null;
  events: EventWithDistance[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
};

function buildMarkerIcon(leaflet: typeof import("leaflet"), event: EventWithDistance, isSelected: boolean) {
  const markerPriceType = event.price === 0 ? "free" : "paid";
  const priceLabel = markerPriceType === "free" ? "無" : "有";
  const baseColorClass =
    markerPriceType === "free"
      ? "border-emerald-600 bg-emerald-100"
      : "border-blue-600 bg-blue-100";
  const selectedRing = isSelected
    ? "ring-2 ring-amber-500 ring-offset-2 shadow-lg scale-[1.12]"
    : "";

  const childBadge = event.childFriendly
    ? `<span class="absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-500 bg-amber-100 text-[10px] font-semibold text-amber-800 shadow">子</span>`
    : "";

  const html = `<div class="leaflet-marker-custom relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 text-[12px] font-semibold shadow-md transition-shadow hover:shadow-lg ${baseColorClass} ${selectedRing}">
    ${childBadge}
    <span class="leading-none">${priceLabel}</span>
  </div>`;

  return leaflet.divIcon({
    className: "border-0 bg-transparent",
    html,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

export function EventMarkerLayer({
  leaflet,
  map,
  events,
  selectedEventId,
  onSelectEvent,
}: Props) {
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const eventById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  useEffect(() => {
    if (!leaflet || !map) return;

    // markers再生成（events更新時）
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = new Map();

    const withCoords = events.filter((e) => e.latitude != null && e.longitude != null);
    withCoords.forEach((event) => {
      const isSelected = event.id === selectedEventId;
      const icon = buildMarkerIcon(leaflet, event, isSelected);
      const marker = leaflet.marker([event.latitude!, event.longitude!], {
        icon,
        // 選択ピンがベースマップのラベルに負けないよう前面へ
        zIndexOffset: isSelected ? 500 : 0,
      })
        .addTo(map)
        .on("click", () => onSelectEvent(event.id));

      markersRef.current.set(event.id, marker);
    });
  }, [events, leaflet, map, selectedEventId, onSelectEvent]);

  useEffect(() => {
    if (!leaflet) return;
    markersRef.current.forEach((marker, id) => {
      const ev = eventById.get(id);
      if (!ev) return;
      const icon = buildMarkerIcon(leaflet, ev, id === selectedEventId);
      marker.setIcon(icon);
    });
  }, [selectedEventId, eventById, leaflet]);

  return null;
}

