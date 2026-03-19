"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Event } from "../lib/db/types";

type EventWithDistance = Event & { distanceKm?: number };

const DEFAULT_CENTER: [number, number] = [35.6812, 139.7671];

type MapBoundsState = {
  north: number;
  south: number;
  west: number;
  east: number;
  centerLat: number;
  centerLng: number;
  zoom: number;
};

type EventsMapProps = {
  events: EventWithDistance[];
  center: { lat: number; lng: number } | null;
  onCenterChange?: (lat: number, lng: number) => void;
  onCenterToCurrentLocation?: () => void;
  onSearchInBounds?: (bounds: MapBoundsState) => Promise<void> | void;
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  dateRange?: string;
  priceFilter?: "all" | "free" | "paid";
  childFriendlyOnly: boolean;
  height?: number | string;
  showLegend?: boolean;
  showMobileSelectedCard?: boolean;
  isFetching?: boolean;
  legendTopPx?: number;
  reSearchTopPx?: number;
};

export function EventsMap({
  events,
  center,
  onCenterToCurrentLocation,
  onSearchInBounds,
  selectedEventId,
  onSelectEvent,
  height = 400,
  showLegend = true,
  showMobileSelectedCard = true,
  isFetching = false,
  legendTopPx = 8,
  reSearchTopPx = 64,
}: EventsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const isInitializingRef = useRef(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isProgrammaticMoveRef = useRef(false);

  const onSearchInBoundsRef = useRef(onSearchInBounds);
  useEffect(() => {
    onSearchInBoundsRef.current = onSearchInBounds;
  }, [onSearchInBounds]);

  const onCenterToCurrentLocationRef = useRef(onCenterToCurrentLocation);
  useEffect(() => {
    onCenterToCurrentLocationRef.current = onCenterToCurrentLocation;
  }, [onCenterToCurrentLocation]);

  const [isMobileWidth, setIsMobileWidth] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobileWidth(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const resolvedHeight = useMemo(() => {
    if (typeof height === "string") return height;
    return `${height}px`;
  }, [height]);

  const [legendOpen, setLegendOpen] = useState(false);

  const [reSearchState, setReSearchState] = useState<{
    open: boolean;
    bounds: MapBoundsState | null;
  }>({ open: false, bounds: null });
  const reSearchStateRef = useRef(reSearchState);
  useEffect(() => {
    reSearchStateRef.current = reSearchState;
  }, [reSearchState]);

  const [isReSearching, setIsReSearching] = useState(false);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const escapeHtml = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const eventById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  const getMarkerIcon = (
    Leaflet: typeof import("leaflet"),
    event: EventWithDistance,
    isSelected: boolean
  ) => {
    const markerPriceType = event.price === 0 ? "free" : "paid";
    const priceLabel = markerPriceType === "free" ? "無" : "有";
    const baseColorClass =
      markerPriceType === "free"
        ? "border-emerald-600 bg-emerald-100"
        : "border-blue-600 bg-blue-100";
    const selectedRing = isSelected
      ? "ring-2 ring-amber-500 ring-offset-2 shadow-lg scale-[1.08]"
      : "";

    const childBadge = event.childFriendly
      ? `<span class="absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-500 bg-amber-100 text-[10px] font-semibold text-amber-800 shadow">子</span>`
      : "";

    const html = `<div class="leaflet-marker-custom relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 text-[12px] font-semibold shadow-md transition-shadow hover:shadow-lg ${baseColorClass} ${selectedRing}">
        ${childBadge}
        <span class="leading-none">${priceLabel}</span>
      </div>`;

    return Leaflet.divIcon({
      className: "border-0 bg-transparent",
      html,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  };

  const openMarkerPopupIfDesktop = (marker: L.Marker, event: EventWithDistance) => {
    if (typeof window !== "undefined") {
      const isMobileNow = window.matchMedia("(max-width: 640px)").matches;
      if (isMobileNow) return;
    }

    const markerPriceLabel = event.price === 0 ? "無料" : "有料";
    const dateText = `${escapeHtml(event.date)} ${escapeHtml(event.startTime)}${
      event.endTime ? `〜${escapeHtml(event.endTime)}` : ""
    }`;

    const popupHtml = `
      <div style="font-family: inherit; min-width: 240px;">
        <div style="font-weight: 700; margin-bottom: 8px;">${escapeHtml(event.title)}</div>
        <div style="color: #525252; font-size: 13px; margin-bottom: 10px;">${dateText}</div>
        <div style="font-size: 13px; color: #525252; margin-bottom: 12px;">${escapeHtml(event.location)}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: 10px;">
          <span style="background:${event.price === 0 ? "#d1fae5" : "#dbeafe"}; color:${
            event.price === 0 ? "#065f46" : "#1d4ed8"
          }; border-radius:999px; padding: 4px 10px; font-size: 12px; font-weight: 700;">${markerPriceLabel}</span>
          ${
            event.childFriendly
              ? `<span style="background:#fef3c7; color:#92400e; border-radius:999px; padding:4px 10px; font-size: 12px; font-weight: 700;">子連れOK</span>`
              : ""
          }
        </div>
        <div style="font-size: 13px;">
          <a href="/events/${encodeURIComponent(event.id)}" style="color: var(--accent); text-decoration: underline;">詳細へ</a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, { closeButton: false, maxWidth: 320 }).openPopup();
  };

  useEffect(() => {
    const container = mapRef.current;
    if (typeof window === "undefined" || !container) return;
    if (mapInstanceRef.current) return;
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")])
      .then(([L]) => {
        try {
          const Leaflet = L.default ?? L;
          leafletRef.current = Leaflet as unknown as typeof import("leaflet");

          // StrictMode等で一時的に初期化競合した場合に備え、DOM側のleaflet状態を明示的に掃除
          const anyContainer = container as unknown as {
            _leaflet_id?: unknown;
            _leaflet_events?: unknown;
          };
          if (anyContainer?._leaflet_id != null) {
            container.innerHTML = "";
            try {
              delete anyContainer._leaflet_id;
              delete anyContainer._leaflet_events;
            } catch {
              // deleteが失敗しても、innerHTMLを空にして再初期化できればOK
            }
          }

          const mapCenter = center
            ? ([center.lat, center.lng] as [number, number])
            : DEFAULT_CENTER;

          isProgrammaticMoveRef.current = true;
          const map = Leaflet.map(container, {
            zoomControl: false,
            scrollWheelZoom: false,
            dragging: true,
          }).setView(mapCenter, 13);

          Leaflet.tileLayer(
            "https://{s}.tile.openstreetmap.jp/styles/osm-bright-ja/{z}/{x}/{y}.png",
            {
              attribution: "© OpenStreetMap Contributors",
              maxZoom: 20,
            }
          ).addTo(map);

          map.on("moveend zoomend", () => {
            if (isProgrammaticMoveRef.current) return;
            const b = map.getBounds();
            const centerPt = map.getCenter();
            setReSearchState({
              open: true,
              bounds: {
                north: b.getNorth(),
                south: b.getSouth(),
                west: b.getWest(),
                east: b.getEast(),
                centerLat: centerPt.lat,
                centerLng: centerPt.lng,
                zoom: clamp(map.getZoom(), 1, 20),
              },
            });
          });

          mapInstanceRef.current = map;
          setIsLoaded(true);
          setLoadError(null);
          window.setTimeout(() => {
            isProgrammaticMoveRef.current = false;
          }, 0);
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : "地図の初期化に失敗しました");
        } finally {
          isInitializingRef.current = false;
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "地図の読み込みに失敗しました");
        isInitializingRef.current = false;
      });

    return () => {
      isInitializingRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = new Map();
      leafletRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    isProgrammaticMoveRef.current = true;
    mapInstanceRef.current.setView([center.lat, center.lng], mapInstanceRef.current.getZoom());
    window.setTimeout(() => {
      isProgrammaticMoveRef.current = false;
    }, 0);
  }, [center]);

  // マーカーは events の更新時だけ再構築
  useEffect(() => {
    const Leaflet = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!Leaflet || !map || !isLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = new Map();

    const eventsWithCoords = events.filter((e) => e.latitude != null && e.longitude != null);

    if (eventsWithCoords.length > 0 && !center) {
      const bounds = Leaflet.latLngBounds(
        eventsWithCoords.map((e) => [e.latitude!, e.longitude!] as [number, number])
      );
      isProgrammaticMoveRef.current = true;
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
      window.setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 0);
    }

    eventsWithCoords.forEach((event) => {
      const isSelected = event.id === selectedEventId;
      const icon = getMarkerIcon(Leaflet, event, isSelected);
      const marker = Leaflet.marker([event.latitude!, event.longitude!], { icon })
        .addTo(map)
        .on("click", () => {
          onSelectEvent(event.id);
          openMarkerPopupIfDesktop(marker, event);
        });

      markersRef.current.set(event.id, marker);
    });

    // イベントが更新されたので、再検索ボタンは一旦閉じる（再度操作したら出る）
    setReSearchState((prev) => ({ ...prev, open: false }));
  }, [events, center, onSelectEvent, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // 選択中ピンの強調だけを更新
  useEffect(() => {
    const Leaflet = leafletRef.current;
    if (!Leaflet || !isLoaded) return;
    markersRef.current.forEach((marker, id) => {
      const ev = eventById.get(id);
      if (!ev) return;
      marker.setIcon(getMarkerIcon(Leaflet, ev, id === selectedEventId));
    });
  }, [selectedEventId, eventById, isLoaded]);

  // 一覧カード→選択→地図中心寄せ（誤操作を避けるためプログラム移動として扱う）
  const selectedEvent = eventById.get(selectedEventId ?? "") ?? null;
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedEvent) return;
    if (selectedEvent.latitude == null || selectedEvent.longitude == null) return;
    isProgrammaticMoveRef.current = true;
    mapInstanceRef.current.panTo([selectedEvent.latitude, selectedEvent.longitude], { animate: true });
    // スマホでは下部カード、PCではポップアップで素早く内容確認できるようにする
    if (typeof window !== "undefined") {
      const isMobileNow = window.matchMedia("(max-width: 640px)").matches;
      if (!isMobileNow) {
        const marker = selectedEventId ? markersRef.current.get(selectedEventId) : undefined;
        if (marker) openMarkerPopupIfDesktop(marker, selectedEvent);
      }
    }
    window.setTimeout(() => {
      isProgrammaticMoveRef.current = false;
    }, 0);
  }, [selectedEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchInThisArea = async () => {
    const bounds = reSearchStateRef.current.bounds;
    if (!onSearchInBoundsRef.current || !bounds) return;
    if (isFetching || isReSearching) return;

    setIsReSearching(true);
    setReSearchState((prev) => ({ ...prev, open: false }));
    try {
      await onSearchInBoundsRef.current(bounds);
    } finally {
      setIsReSearching(false);
    }
  };

  const zoomIn = () => mapInstanceRef.current?.zoomIn();
  const zoomOut = () => mapInstanceRef.current?.zoomOut();

  if (loadError) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/60 dark:border-zinc-700/60 dark:bg-zinc-800/60"
        style={{ height: resolvedHeight, minHeight: resolvedHeight }}
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
        style={{ height: resolvedHeight, minHeight: resolvedHeight, touchAction: "none" }}
      />

      {isLoaded && showLegend && !reSearchState.open && (
        <div className="absolute left-2 z-[1000]" style={{ top: legendTopPx }}>
          <button
            type="button"
            onClick={() => setLegendOpen((v) => !v)}
            className="flex min-h-[44px] items-center gap-2 rounded-full border border-zinc-200/70 bg-white/90 px-3 text-xs font-medium shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70"
            aria-expanded={legendOpen}
          >
            <span>凡例</span>
            <span aria-hidden className="text-zinc-400">
              {legendOpen ? "▲" : "▼"}
            </span>
          </button>
          {legendOpen && (
            <div className="mt-2 w-60 rounded-xl border border-zinc-200/70 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-100 text-[10px] font-semibold">
                    無
                  </span>
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">無料</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-100 text-[10px] font-semibold">
                    有
                  </span>
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">有料</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-100 text-[10px] font-semibold">
                    子
                  </span>
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">子連れOK</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 地図移動後の再検索導線 */}
      {isLoaded && reSearchState.open && reSearchState.bounds && (
        <div
          className="absolute left-0 right-0 z-[1000] flex justify-center px-3"
          style={{ top: reSearchTopPx }}
        >
          <button
            type="button"
            onClick={handleSearchInThisArea}
            disabled={isFetching || isReSearching}
            className="flex h-[44px] w-full max-w-[420px] items-center justify-center gap-2 rounded-xl border border-zinc-200/70 bg-white/95 px-4 text-sm font-semibold shadow-sm backdrop-blur disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900/90"
          >
            {isReSearching || isFetching ? "再検索中..." : "このエリアで再検索"}
          </button>
        </div>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80">
          <p className="text-sm text-zinc-600">地図を読み込み中...</p>
        </div>
      )}

      {/* 選択イベントカード（スマホは下部カード、PCはマーカー側ポップアップ） */}
      {selectedEvent && isMobileWidth && showMobileSelectedCard && (
        <div className="absolute bottom-4 left-3 right-3 z-[1000] rounded-2xl border border-zinc-200/60 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedEvent.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {selectedEvent.date} {selectedEvent.startTime}
                {selectedEvent.endTime && `〜${selectedEvent.endTime}`} ・ {selectedEvent.location}
              </p>
            </div>
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => onSelectEvent(null)}
              className="min-h-[44px] min-w-[44px] rounded-full border border-zinc-200/60 bg-white/70 text-sm text-zinc-500 shadow-sm hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                selectedEvent.price === 0
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
              }`}
            >
              {selectedEvent.price === 0 ? "無料" : "有料"}
            </span>
            {selectedEvent.childFriendly && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                子連れOK
              </span>
            )}
            {selectedEvent.distanceKm != null && (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                約 {selectedEvent.distanceKm.toFixed(1)} km
              </span>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Link
              href={`/events/${selectedEvent.id}`}
              className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              詳細へ
            </Link>
          </div>
        </div>
      )}

      {/* 右下コントロール（片手操作優先） */}
      {isLoaded && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-[1000] flex flex-col gap-2">
          <div className="pointer-events-auto flex flex-col rounded-2xl border border-zinc-200/70 bg-white/95 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
            <button
              type="button"
              onClick={zoomIn}
              className="min-h-[44px] min-w-[44px] rounded-t-2xl px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
              aria-label="ズームイン"
            >
              ＋
            </button>
            <div className="h-px w-full bg-zinc-200/60 dark:bg-zinc-700" />
            <button
              type="button"
              onClick={zoomOut}
              className="min-h-[44px] min-w-[44px] rounded-b-2xl px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
              aria-label="ズームアウト"
            >
              －
            </button>
          </div>

          <button
            type="button"
            onClick={() => onCenterToCurrentLocationRef.current?.()}
            className="pointer-events-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-zinc-200/70 bg-white/95 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90"
            aria-label="現在地に移動"
            title="現在地に移動"
          >
            ⦿
          </button>
        </div>
      )}

      {/* 更新中（ピンの維持を優先） */}
      {isLoaded && isFetching && (
        <div className="absolute inset-x-0 top-0 z-[900] flex justify-center pt-3 pointer-events-none">
          <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur dark:bg-zinc-900/70 dark:text-zinc-200">
            更新中...
          </div>
        </div>
      )}
    </div>
  );
}
