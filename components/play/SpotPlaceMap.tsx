"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_CENTER: [number, number] = [35.6812, 139.7671];

type Place = { lat: number; lng: number };

function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function SpotPlaceMap({
  lat,
  lng,
  interactive = false,
  onChange,
  className,
  label,
}: {
  lat: number | null;
  lng: number | null;
  interactive?: boolean;
  onChange?: (place: Place) => void;
  className?: string;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const [ready, setReady] = useState(false);
  onChangeRef.current = onChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    (async () => {
      const leafletMod = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;
      const Leaflet = (leafletMod.default ?? leafletMod) as typeof import("leaflet");
      const node = containerRef.current;
      const anyContainer = node as unknown as { _leaflet_id?: unknown };
      if (anyContainer._leaflet_id != null) {
        node.innerHTML = "";
        delete anyContainer._leaflet_id;
      }
      const hasPin = lat != null && lng != null;
      const map = Leaflet.map(node, {
        zoomControl: interactive,
        scrollWheelZoom: false,
        dragging: interactive,
        attributionControl: true,
      }).setView(hasPin ? [lat, lng] : DEFAULT_CENTER, hasPin ? 16 : 12);
      Leaflet.tileLayer("https://tile.openstreetmap.jp/styles/osm-bright-ja/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap Contributors",
        maxZoom: 20,
        minZoom: 3,
      }).addTo(map);
      if (interactive) {
        map.on("click", (event) => {
          onChangeRef.current?.({
            lat: round6(event.latlng.lat),
            lng: round6(event.latlng.lng),
          });
        });
      }
      mapRef.current = map;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    })().catch(() => {
      /* 地図が読めなくても、ほかの画面は使える */
    });

    return () => {
      cancelled = true;
      setReady(false);
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // 初期表示の中心だけ使い、ピンの移動は次の effect で追う。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;
    (async () => {
      const leafletMod = await import("leaflet");
      if (cancelled || mapRef.current !== map) return;
      const Leaflet = (leafletMod.default ?? leafletMod) as typeof import("leaflet");
      if (lat == null || lng == null) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }
      const icon = Leaflet.divIcon({
        className: "spot-place-pin",
        html: '<span class="spot-place-pin__dot"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      if (!markerRef.current) {
        markerRef.current = Leaflet.marker([lat, lng], { icon, keyboard: false }).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setIcon(icon);
      }
      const zoom = map.getZoom();
      map.setView([lat, lng], zoom < 16 ? 16 : zoom, { animate: false });
      requestAnimationFrame(() => map.invalidateSize());
    })().catch(() => {
      /* ピンの更新に失敗しても、地図自体は残す */
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, ready]);

  return <div ref={containerRef} className={className} role="application" aria-label={label} />;
}
