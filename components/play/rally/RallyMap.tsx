"use client";

import { useEffect, useRef, useState } from "react";
import type { PlaySpotProgress } from "@/lib/organizer/play-types";
import { getOpenStreetMapJpAttribution, getOpenStreetMapJpTileUrl } from "@/components/events-map/mapTiles";

const DEFAULT_CENTER: [number, number] = [35.6812, 139.7671];

type Here = { lat: number; lng: number };

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pinHtml(spot: PlaySpotProgress, index: number, selected: boolean): string {
  const names = ["rally-pin"];
  if (spot.stamped) names.push("is-stamped");
  if (selected) names.push("is-selected");
  const face = spot.imageUrl
    ? `<img src="${escapeAttr(spot.imageUrl)}" alt="" />`
    : `<span class="rally-pin__num">${index + 1}</span>`;
  const check = spot.stamped ? '<span class="rally-pin__check" aria-hidden="true"></span>' : "";
  const label = `<span class="rally-pin__label">${escapeAttr(spot.name)}</span>`;
  return `<span class="${names.join(" ")}"><span class="rally-pin__face">${face}</span>${check}${label}</span>`;
}

/** ラリーのスポットを、写真つきのピンで並べる地図。 */
export function RallyMap({
  spots,
  selectedId,
  here,
  onSelect,
  label,
  route = false,
}: {
  spots: PlaySpotProgress[];
  selectedId: string | null;
  here: Here | null;
  onSelect: (spotId: string) => void;
  label: string;
  /** 順番どおりに巡るラリー。ピンを点線のコースでつなぐ。 */
  route?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const hereRef = useRef<import("leaflet").Marker | null>(null);
  const fittedRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    (async () => {
      const leafletMod = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;
      const Leaflet = (leafletMod.default ?? leafletMod) as typeof import("leaflet");
      const map = Leaflet.map(containerRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView(DEFAULT_CENTER, 13);
      // 文字や記号の少ない淡い地図に、rally.css で色調をのせる。
      Leaflet.tileLayer(getOpenStreetMapJpTileUrl("maptiler-basic-ja", 0, 0, 0), {
        attribution: getOpenStreetMapJpAttribution(),
        className: "rally-tiles",
        maxZoom: 20,
        minZoom: 3,
      }).addTo(map);
      Leaflet.control.zoom({ position: "topright" }).addTo(map);
      layerRef.current = Leaflet.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    })().catch(() => {
      /* 地図が読めなくても、リストで巡れる */
    });
    return () => {
      cancelled = true;
      setReady(false);
      fittedRef.current = false;
      layerRef.current = null;
      hereRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !ready) return;
    let cancelled = false;
    (async () => {
      const leafletMod = await import("leaflet");
      if (cancelled || mapRef.current !== map) return;
      const Leaflet = (leafletMod.default ?? leafletMod) as typeof import("leaflet");
      layer.clearLayers();
      const points: [number, number][] = [];
      spots.forEach((spot, index) => {
        if (spot.lat == null || spot.lng == null) return;
        const selected = spot.id === selectedId;
        const icon = Leaflet.divIcon({
          className: "rally-pin-wrap",
          html: pinHtml(spot, index, selected),
          iconSize: [52, 60],
          iconAnchor: [26, 58],
        });
        const marker = Leaflet.marker([spot.lat, spot.lng], {
          icon,
          keyboard: true,
          title: spot.name,
          zIndexOffset: selected ? 1000 : spot.stamped ? 0 : 100,
        });
        marker.on("click", () => onSelectRef.current(spot.id));
        marker.addTo(layer);
        points.push([spot.lat, spot.lng]);
      });
      if (route && points.length > 1) {
        Leaflet.polyline(points, {
          className: "rally-route",
          color: "#1f7a4a",
          weight: 4,
          opacity: 0.75,
          dashArray: "2 10",
          lineCap: "round",
          interactive: false,
        }).addTo(layer);
      }
      if (!fittedRef.current && points.length > 0) {
        fittedRef.current = true;
        if (points.length === 1) map.setView(points[0], 16, { animate: false });
        else map.fitBounds(Leaflet.latLngBounds(points), { padding: [48, 48], maxZoom: 17, animate: false });
      }
      requestAnimationFrame(() => map.invalidateSize());
    })().catch(() => {
      /* ピンが描けなくても、地図は残す */
    });
    return () => {
      cancelled = true;
    };
  }, [spots, selectedId, ready, route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedId) return;
    const spot = spots.find((item) => item.id === selectedId);
    if (!spot || spot.lat == null || spot.lng == null) return;
    map.panTo([spot.lat, spot.lng], { animate: true });
  }, [selectedId, spots, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;
    (async () => {
      const leafletMod = await import("leaflet");
      if (cancelled || mapRef.current !== map) return;
      const Leaflet = (leafletMod.default ?? leafletMod) as typeof import("leaflet");
      if (!here) {
        hereRef.current?.remove();
        hereRef.current = null;
        return;
      }
      const icon = Leaflet.divIcon({
        className: "rally-here",
        html: '<span class="rally-here__dot"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      if (!hereRef.current) {
        hereRef.current = Leaflet.marker([here.lat, here.lng], { icon, keyboard: false, interactive: false }).addTo(map);
      } else {
        hereRef.current.setLatLng([here.lat, here.lng]);
      }
    })().catch(() => {
      /* 現在地が描けなくても、ピンは残す */
    });
    return () => {
      cancelled = true;
    };
  }, [here, ready]);

  return <div ref={containerRef} className="rally-map__canvas" role="application" aria-label={label} />;
}
