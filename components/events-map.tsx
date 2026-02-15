"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Event } from "../lib/db/types";

type EventWithDistance = Event & { distanceKm?: number };

const DEFAULT_CENTER: [number, number] = [35.6812, 139.7671];

type EventsMapProps = {
  events: EventWithDistance[];
  center: { lat: number; lng: number } | null;
  onCenterChange?: (lat: number, lng: number) => void;
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  dateRange: "today" | "week";
  priceFilter: "all" | "free" | "paid";
  childFriendlyOnly: boolean;
  height?: number;
  showLegend?: boolean;
};

export function EventsMap({
  events,
  center,
  onCenterChange,
  selectedEventId,
  onSelectEvent,
  height = 400,
  showLegend = true,
}: EventsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const container = mapRef.current;
    if (typeof window === "undefined" || !container) return;

    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([L]) => {
      const Leaflet = L.default ?? L;
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          markersRef.current = [];
        }

        const mapCenter = center
          ? [center.lat, center.lng] as [number, number]
          : DEFAULT_CENTER;

        const map = Leaflet.map(container, {
          zoomControl: false,
          scrollWheelZoom: true,
          dragging: true,
        }).setView(mapCenter, 13);

        Leaflet.control.zoom({ position: "bottomright" }).addTo(map);

        Leaflet.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap, © CARTO",
        }).addTo(map);

        const eventsWithCoords = events.filter(
          (e) => e.latitude != null && e.longitude != null
        );

        if (eventsWithCoords.length > 0 && !center) {
          const bounds = Leaflet.latLngBounds(
            eventsWithCoords.map((e) => [e.latitude!, e.longitude!] as [number, number])
          );
          map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
        }

        eventsWithCoords.forEach((event) => {
          const isSelected = event.id === selectedEventId;
          const markerType = event.childFriendly
            ? "child"
            : event.price === 0
              ? "free"
              : "paid";
          const colorClass =
            markerType === "child"
              ? "border-amber-500 bg-amber-100"
              : markerType === "free"
                ? "border-green-600 bg-green-100"
                : "border-blue-600 bg-blue-100";
          const selectedRing = isSelected
            ? "ring-2 ring-amber-400 ring-offset-2"
            : "";
          const icon = Leaflet.divIcon({
            className: "border-0 bg-transparent",
            html: `<div class="leaflet-marker-custom flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-medium shadow-md transition-shadow hover:shadow-lg ${colorClass} ${selectedRing}">${markerType === "child" ? "子" : markerType === "free" ? "無" : "有"}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          const marker = Leaflet.marker([event.latitude!, event.longitude!], {
            icon,
          })
            .addTo(map)
            .on("click", () => onSelectEvent(event.id));
          markersRef.current.push(marker);
        });

        mapInstanceRef.current = map;
        setIsLoaded(true);
        setLoadError(null);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "地図の読み込みに失敗しました");
      }
    }).catch(() => {
      setLoadError("地図の読み込みに失敗しました");
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [events, center?.lat, center?.lng, onSelectEvent, selectedEventId]);

  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    mapInstanceRef.current.setView([center.lat, center.lng], mapInstanceRef.current.getZoom());
  }, [center]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  if (loadError) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/60 dark:border-zinc-700/60 dark:bg-zinc-800/60"
        style={{ height, minHeight: height }}
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 touch-none"
        style={{ height, minHeight: height, touchAction: "none" }}
      />
      {isLoaded && showLegend && (
        <div className="absolute left-2 top-2 z-[1000] rounded-lg border border-zinc-200/60 bg-white/90 px-3 py-2 text-xs shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
          <p className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">凡例</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-green-600 bg-green-100 text-[10px] font-medium">
                無
              </span>
              <span>無料イベント</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-100 text-[10px] font-medium">
                有
              </span>
              <span>有料イベント</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-100 text-[10px] font-medium">
                子
              </span>
              <span>子連れOK</span>
            </div>
          </div>
        </div>
      )}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80">
          <p className="text-sm text-zinc-600">地図を読み込み中...</p>
        </div>
      )}

      {selectedEvent && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-xl border border-zinc-200/60 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {selectedEvent.title}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {selectedEvent.date} {selectedEvent.startTime}
            {selectedEvent.endTime && `〜${selectedEvent.endTime}`} · {selectedEvent.location}
          </p>
          {selectedEvent.distanceKm != null && (
            <p className="mt-1 text-xs text-zinc-500">
              約 {selectedEvent.distanceKm.toFixed(1)} km
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Link
              href={`/events/${selectedEvent.id}`}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              詳細へ
            </Link>
            <button
              type="button"
              onClick={() => onSelectEvent(null)}
              className="rounded-lg border border-zinc-200/60 px-4 py-2 text-sm dark:border-zinc-700"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
