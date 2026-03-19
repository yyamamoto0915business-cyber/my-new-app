"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EventSort } from "@/lib/events";
import {
  filterEventsByAvailableOnly,
  searchEvents,
  sortEvents,
} from "@/lib/events";
import type { EventWithDistance, MapBoundsState } from "./types";
import { MapSearchHeader } from "./MapSearchHeader";
import { SearchThisAreaButton } from "./SearchThisAreaButton";
import { EventMarkerLayer } from "./EventMarkerLayer";
import { SelectedEventCarousel } from "./SelectedEventCarousel";
import { MapFloatingControls } from "./MapFloatingControls";
import { DEFAULT_BASE_MAP_KEY, type BaseMapKey } from "./mapTiles";
import { MapBaseLayer } from "./MapBaseLayer";

type Props = {
  mapEvents: EventWithDistance[];
  mapLoading: boolean;
  userPos: { lat: number; lng: number } | null;
  availableOnly: boolean;
  sortOrder: EventSort;
  onCenterToCurrentLocation: () => void;
  onSearchInBounds: (bounds: MapBoundsState) => Promise<void>;
};

const DEFAULT_CENTER: [number, number] = [35.6812, 139.7671];

export function MapPageContainer({
  mapEvents,
  mapLoading,
  userPos,
  availableOnly,
  sortOrder,
  onCenterToCurrentLocation,
  onSearchInBounds,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const [leafletModule, setLeafletModule] = useState<typeof import("leaflet") | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // 道路番号などの主張を抑えつつ、日本語ラベルは維持する
  const baseMapKey: BaseMapKey = DEFAULT_BASE_MAP_KEY;
  const tileOpacity = 0.92;

  const isProgrammaticMoveRef = useRef(false);
  const isInitializingRef = useRef(false);
  const didInitialFitRef = useRef(false);

  const [mapBounds, setMapBounds] = useState<MapBoundsState | null>(null);
  const mapBoundsRef = useRef<MapBoundsState | null>(null);
  const [hasMapMoved, setHasMapMoved] = useState(false);
  const [isSearchingThisArea, setIsSearchingThisArea] = useState(false);
  const shouldShowAfterSearchRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const visibleEvents = useMemo(() => {
    let result = mapEvents;
    result = filterEventsByAvailableOnly(result, availableOnly);
    result = searchEvents(result, searchQuery);
    result = sortEvents(result, sortOrder);
    return result;
  }, [mapEvents, availableOnly, searchQuery, sortOrder]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return visibleEvents.find((e) => e.id === selectedEventId) ?? null;
  }, [selectedEventId, visibleEvents]);

  const boundsKey = (b: MapBoundsState) =>
    [b.north, b.south, b.west, b.east].map((n) => n.toFixed(4)).join(",");

  // 選択中イベントが表示範囲から外れた場合のみ解除
  useEffect(() => {
    if (!selectedEventId) return;
    if (!visibleEvents.some((e) => e.id === selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [visibleEvents, selectedEventId]);

  // 選択イベントに軽くパン（ただし moveend で再検索ボタンが出ないように抑制）
  useEffect(() => {
    if (!mapInstance || !selectedEvent) return;
    if (selectedEvent.latitude == null || selectedEvent.longitude == null) return;

    isProgrammaticMoveRef.current = true;
    mapInstance.panTo([selectedEvent.latitude, selectedEvent.longitude], { animate: true });
    window.setTimeout(() => {
      isProgrammaticMoveRef.current = false;
    }, 0);
  }, [mapInstance, selectedEvent]);

  // Leaflet init
  useEffect(() => {
    const container = mapContainerRef.current;
    if (typeof window === "undefined" || !container) return;
    if (isInitializingRef.current) return;
    if (mapInstanceRef.current) return;

    isInitializingRef.current = true;
    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")])
      .then(([L]) => {
        const Leaflet = (L.default ?? L) as typeof import("leaflet");
        leafletRef.current = Leaflet;

        // StrictMode などで状態競合した場合に備えた掃除
        const anyContainer = container as unknown as { _leaflet_id?: unknown; _leaflet_events?: unknown };
        if (anyContainer?._leaflet_id != null) {
          container.innerHTML = "";
          try {
            delete anyContainer._leaflet_id;
            delete anyContainer._leaflet_events;
          } catch {
            // ignore
          }
        }

        const initialCenter = userPos
          ? ([userPos.lat, userPos.lng] as [number, number])
          : DEFAULT_CENTER;

        const map = Leaflet.map(container, {
          zoomControl: false,
          scrollWheelZoom: false,
          dragging: true,
        }).setView(initialCenter, 13);

        // ベースマップ(TileLayer)は MapBaseLayer に切り出して管理

        map.on("moveend zoomend", () => {
          if (isProgrammaticMoveRef.current) return;
          const b = map.getBounds();
          const centerPt = map.getCenter();
          const nextBounds: MapBoundsState = {
            north: b.getNorth(),
            south: b.getSouth(),
            west: b.getWest(),
            east: b.getEast(),
            centerLat: centerPt.lat,
            centerLng: centerPt.lng,
            zoom: map.getZoom(),
          };

          const nextKey = boundsKey(nextBounds);
          const prevKey = mapBoundsRef.current ? boundsKey(mapBoundsRef.current) : null;
          if (prevKey && prevKey === nextKey) return;

          mapBoundsRef.current = nextBounds;
          setMapBounds(nextBounds);
          if (isSearchingThisArea) {
            shouldShowAfterSearchRef.current = true;
          } else {
            setHasMapMoved(true);
          }
        });

        mapInstanceRef.current = map;
        setLeafletModule(Leaflet);
        setMapInstance(map);
        setIsLeafletReady(true);
        setMapError(null);
      })
      .catch((err) => {
        setMapError(err instanceof Error ? err.message : "地図の読み込みに失敗しました");
      })
      .finally(() => {
        isInitializingRef.current = false;
      });

    return () => {
      isInitializingRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      leafletRef.current = null;
    };
    // userPos は init に不要（初期センタが多少ズレても、後段の effect で補正する）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // userPos 更新時は中央寄せ（再検索ボタンを出さない）
  useEffect(() => {
    if (!mapInstance || !userPos) return;
    isProgrammaticMoveRef.current = true;
    mapInstance.panTo([userPos.lat, userPos.lng], { animate: true });
    window.setTimeout(() => {
      isProgrammaticMoveRef.current = false;
    }, 0);
  }, [mapInstance, userPos]);

  // 初期イベントが来たタイミングで bounds にフィット（userPos がない時だけ）
  useEffect(() => {
    if (!mapInstance || !isLeafletReady) return;
    if (didInitialFitRef.current) return;
    if (userPos) return;

    const withCoords = mapEvents.filter((e) => e.latitude != null && e.longitude != null);
    if (!withCoords.length) return;

    const Leaflet = leafletRef.current;
    if (!Leaflet) return;

    const bounds = Leaflet.latLngBounds(
      withCoords.map((e) => [e.latitude!, e.longitude!] as [number, number])
    );

    isProgrammaticMoveRef.current = true;
    mapInstance.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
    didInitialFitRef.current = true;
    window.setTimeout(() => {
      isProgrammaticMoveRef.current = false;
    }, 0);
  }, [mapEvents, mapInstance, isLeafletReady, userPos]);

  const handleSearchThisArea = async (b: MapBoundsState) => {
    if (isSearchingThisArea) return;
    shouldShowAfterSearchRef.current = false;
    setIsSearchingThisArea(true);
    setHasMapMoved(false);
    try {
      await onSearchInBounds(b);
    } finally {
      // 検索中に地図が動いていたら、次のアクションとしてボタンを再表示する
      if (shouldShowAfterSearchRef.current) setHasMapMoved(true);
      setIsSearchingThisArea(false);
      window.setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 0);
    }
  };

  const zoomIn = () => mapInstance?.zoomIn();
  const zoomOut = () => mapInstance?.zoomOut();

  const topSearchButtonPx = 92; // headerの下あたり（スマホで被らない位置）

  if (mapError) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/60 dark:border-zinc-700/60 dark:bg-zinc-800/60"
        style={{ height: "60vh", minHeight: "60vh" }}
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{mapError}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        className="w-full rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 touch-none"
        style={{
          height: "78vh",
          minHeight: "60vh",
          touchAction: "none",
          opacity: isLeafletReady ? 1 : 0.6,
        }}
      />

      {!isLeafletReady && (
        <div className="absolute inset-0 z-[20] flex items-center justify-center rounded-2xl bg-white/60">
          <p className="text-sm text-zinc-600">地図を読み込み中...</p>
        </div>
      )}

      <div className="absolute left-0 right-0 top-0 z-[30] px-3">
        <MapSearchHeader
          count={visibleEvents.length}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          showHint={hasMapMoved}
          hintText="地図を動かして、このエリアのイベントを探せます。"
        />
      </div>

      <SearchThisAreaButton
        visible={hasMapMoved}
        isSearching={isSearchingThisArea}
        onClick={handleSearchThisArea}
        bounds={mapBounds}
        topPx={topSearchButtonPx}
      />

      {isLeafletReady && (
        <MapBaseLayer
          leaflet={leafletModule}
          map={mapInstance}
          baseMapKey={baseMapKey}
          opacity={tileOpacity}
        />
      )}

      {isLeafletReady && (
        <EventMarkerLayer
          leaflet={leafletModule}
          map={mapInstance}
          events={visibleEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={(id) => setSelectedEventId(id)}
        />
      )}

      {isLeafletReady && (
        <MapFloatingControls
          onLocateCurrentPosition={onCenterToCurrentLocation}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
      )}

      <SelectedEventCarousel
        events={visibleEvents}
        selectedEventId={selectedEventId}
        onSelectEvent={setSelectedEventId}
        isLoading={mapLoading}
        rightOffsetPx={92}
      />
    </div>
  );
}

