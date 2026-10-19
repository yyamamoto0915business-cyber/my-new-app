"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Check } from "lucide-react";
import type { PlaySpotProgress } from "@/lib/organizer/play-types";
import { rallyMapStyle } from "@/components/play/rally/rallyMapStyle";
import { addRallyTrees } from "@/components/play/rally/rallyMapTrees";
import { SPOT_CATEGORY_LOOK, spotCategory, spotIconUrl, spotMarkerUrl } from "@/components/play/rally/spotCategory";

const DEFAULT_CENTER: [number, number] = [139.7671, 35.6812];
const EMPTY_LINE = { type: "FeatureCollection" as const, features: [] };
/** マーカーの先を実際の位置に合わせる。下の名前札の高さぶん下げる。 */
const PIN_OFFSET: [number, number] = [0, 25];

type Here = { lat: number; lng: number };

function line(points: [number, number][]) {
  return {
    type: "FeatureCollection" as const,
    features:
      points.length > 1
        ? [
            {
              type: "Feature" as const,
              properties: {},
              geometry: { type: "LineString" as const, coordinates: points },
            },
          ]
        : [],
  };
}

function SpotPinFace({ spot }: { spot: PlaySpotProgress }) {
  const style = spot.mapStyle ?? "marker";
  const photo = spot.mapImageUrl || spot.imageUrl || "";
  if (style === "photo" && photo) {
    return (
      <span className="rally-vpin__photo">
        <img src={photo} alt="" draggable={false} />
      </span>
    );
  }
  if (style === "art") {
    return (
      <span className="rally-vpin__art">
        <img src={spotIconUrl(spot)} alt="" draggable={false} />
      </span>
    );
  }
  return (
    <span className="rally-vpin__marker">
      <img src={spotMarkerUrl(spot)} alt="" draggable={false} />
    </span>
  );
}

function SpotPin({ spot, selected }: { spot: PlaySpotProgress; selected: boolean }) {
  const look = SPOT_CATEGORY_LOOK[spotCategory(spot)];
  return (
    <span
      className={["rally-vpin", spot.stamped ? "is-stamped" : "", selected ? "is-selected" : ""].join(" ")}
      style={{ ["--pin" as string]: look.color }}
    >
      <span className="rally-vpin__face">
        <SpotPinFace spot={spot} />
        {spot.stamped ? (
          <span className="rally-vpin__check" aria-hidden>
            <Check />
          </span>
        ) : null}
      </span>
      <span className="rally-vpin__label">{spot.name}</span>
    </span>
  );
}

/**
 * 立体のパステル地図に、種類ごとのアイコンでスポットを並べる。
 * 現在地と選んだスポットのあいだに点線を引く。順番どおりのラリーはコースもつなぐ。
 */
export function RallyVectorMap({
  spots,
  selectedId,
  here,
  onSelect,
  label,
  route = false,
  recenter = 0,
  onUnavailable,
}: {
  spots: PlaySpotProgress[];
  selectedId: string | null;
  here: Here | null;
  onSelect: (spotId: string) => void;
  label: string;
  route?: boolean;
  /** 増えるたびに現在地へ移動する（位置ボタン）。 */
  recenter?: number;
  onUnavailable: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const hereRef = useRef<Marker | null>(null);
  const fittedRef = useRef(false);
  const flownRef = useRef(0);
  const onSelectRef = useRef(onSelect);
  const onUnavailableRef = useRef(onUnavailable);
  const [ready, setReady] = useState(false);
  const [pinEls, setPinEls] = useState<Record<string, HTMLElement>>({});
  onSelectRef.current = onSelect;
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    (async () => {
      const maplibre = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current) return;
      let map: MapLibreMap;
      try {
        map = new maplibre.Map({
          container: containerRef.current,
          style: rallyMapStyle(),
          center: DEFAULT_CENTER,
          zoom: 14,
          pitch: 45,
          bearing: -12,
          maxPitch: 60,
          // 出典は下の小さな一行で出す（既定の表示は地図の下側を大きく覆うため）。
          attributionControl: false,
          // 日本語の文字は端末のフォントで描く（地図用の字形データに漢字がないため）。
          localIdeographFontFamily: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
        });
      } catch {
        onUnavailableRef.current();
        return;
      }
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        if (cancelled) return;
        void addRallyTrees(map, "water-name");
        map.addSource("rally-course", { type: "geojson", data: EMPTY_LINE });
        map.addLayer({
          id: "rally-course",
          type: "line",
          source: "rally-course",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#1f7a4a", "line-width": 4, "line-opacity": 0.7, "line-dasharray": [0.1, 2.2] },
        });
        map.addSource("rally-walk", { type: "geojson", data: EMPTY_LINE });
        map.addLayer({
          id: "rally-walk-halo",
          type: "line",
          source: "rally-walk",
          layout: { "line-cap": "round" },
          paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.85 },
        });
        map.addLayer({
          id: "rally-walk",
          type: "line",
          source: "rally-walk",
          layout: { "line-cap": "round" },
          paint: { "line-color": "#2f7cf6", "line-width": 5, "line-dasharray": [0.1, 1.8] },
        });
        setReady(true);
      });
      mapRef.current = map;
    })().catch(() => {
      if (!cancelled) onUnavailableRef.current();
    });
    const markers = markersRef.current;
    return () => {
      cancelled = true;
      setReady(false);
      fittedRef.current = false;
      markers.forEach((marker) => marker.remove());
      markers.clear();
      hereRef.current?.remove();
      hereRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ピンの入れ物を作る。中身は下の createPortal で React が描く。
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;
    (async () => {
      const maplibre = (await import("maplibre-gl")).default;
      if (cancelled) return;
      const markers = markersRef.current;
      const keep = new Set<string>();
      const els: Record<string, HTMLElement> = {};
      const points: [number, number][] = [];
      spots.forEach((spot) => {
        if (spot.lat == null || spot.lng == null) return;
        keep.add(spot.id);
        points.push([spot.lng, spot.lat]);
        let marker = markers.get(spot.id);
        if (!marker) {
          const el = document.createElement("button");
          el.type = "button";
          el.className = "rally-vpin-wrap";
          el.setAttribute("aria-label", spot.name);
          el.addEventListener("click", (event) => {
            event.stopPropagation();
            onSelectRef.current(spot.id);
          });
          marker = new maplibre.Marker({ element: el, anchor: "bottom", offset: PIN_OFFSET })
            .setLngLat([spot.lng, spot.lat])
            .addTo(map);
          markers.set(spot.id, marker);
        } else {
          marker.setLngLat([spot.lng, spot.lat]);
        }
        els[spot.id] = marker.getElement();
      });
      markers.forEach((marker, id) => {
        if (keep.has(id)) return;
        marker.remove();
        markers.delete(id);
      });
      setPinEls(els);
      (map.getSource("rally-course") as GeoJSONSource | undefined)?.setData(route ? line(points) : EMPTY_LINE);
      if (!fittedRef.current && points.length > 0) {
        fittedRef.current = true;
        if (points.length === 1) {
          map.jumpTo({ center: points[0], zoom: 16.5 });
        } else {
          const bounds = new maplibre.LngLatBounds(points[0], points[0]);
          points.forEach((point) => bounds.extend(point));
          map.fitBounds(bounds, { padding: { top: 90, bottom: 90, left: 50, right: 50 }, maxZoom: 17, duration: 0 });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spots, ready, route]);

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.getElement().style.zIndex = id === selectedId ? "3" : "1";
    });
    const map = mapRef.current;
    if (!map || !ready || !selectedId) return;
    const spot = spots.find((item) => item.id === selectedId);
    if (!spot || spot.lat == null || spot.lng == null) return;
    map.easeTo({ center: [spot.lng, spot.lat], duration: 500, padding: { bottom: 160, top: 0, left: 0, right: 0 } });
  }, [selectedId, spots, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;
    (async () => {
      const maplibre = (await import("maplibre-gl")).default;
      if (cancelled) return;
      if (!here) {
        hereRef.current?.remove();
        hereRef.current = null;
      } else if (!hereRef.current) {
        const el = document.createElement("span");
        el.className = "rally-here";
        el.innerHTML = '<span class="rally-here__pulse"></span><span class="rally-here__dot"></span>';
        hereRef.current = new maplibre.Marker({ element: el }).setLngLat([here.lng, here.lat]).addTo(map);
      } else {
        hereRef.current.setLngLat([here.lng, here.lat]);
      }
      const target = selectedId ? spots.find((item) => item.id === selectedId) : null;
      const walk =
        here && target && target.lat != null && target.lng != null
          ? line([
              [here.lng, here.lat],
              [target.lng, target.lat],
            ])
          : EMPTY_LINE;
      (map.getSource("rally-walk") as GeoJSONSource | undefined)?.setData(walk);
    })();
    return () => {
      cancelled = true;
    };
  }, [here, selectedId, spots, ready]);

  // 位置ボタンのあと、現在地が分かった時点で一度だけ移動する。
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !here || recenter === 0 || flownRef.current === recenter) return;
    flownRef.current = recenter;
    map.flyTo({ center: [here.lng, here.lat], zoom: Math.max(map.getZoom(), 16.5), duration: 900 });
  }, [recenter, here, ready]);

  return (
    <>
      <div ref={containerRef} className="rally-map__canvas rally-map__canvas--vector" role="application" aria-label={label} />
      <p className="rally-map__credit">
        <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">
          OpenFreeMap
        </a>{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          © OpenStreetMap
        </a>
      </p>
      {spots.map((spot) =>
        pinEls[spot.id] ? createPortal(<SpotPin spot={spot} selected={spot.id === selectedId} />, pinEls[spot.id], spot.id) : null,
      )}
    </>
  );
}
