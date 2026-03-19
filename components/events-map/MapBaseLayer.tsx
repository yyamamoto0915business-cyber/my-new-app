"use client";

import { useEffect, useMemo } from "react";
import type { BaseMapKey } from "./mapTiles";
import { baseMapConfig, getOpenStreetMapJpAttribution, getOpenStreetMapJpTileUrl } from "./mapTiles";

type Props = {
  leaflet: typeof import("leaflet") | null;
  map: L.Map | null;
  baseMapKey: BaseMapKey;
  opacity?: number;
};

export function MapBaseLayer({ leaflet, map, baseMapKey, opacity = 0.92 }: Props) {
  const config = baseMapConfig[baseMapKey];

  const tileUrl = useMemo(() => {
    // tileLayer の URL テンプレート内では {z}/{x}/{y} が使われる
    // ここでは実際の値はダミー
    const _z = 0;
    const _x = 0;
    const _y = 0;
    return getOpenStreetMapJpTileUrl(config.style, _z, _x, _y);
  }, [config.style]);

  useEffect(() => {
    if (!leaflet || !map) return;

    const layer = leaflet.tileLayer(tileUrl, {
      attribution: getOpenStreetMapJpAttribution(),
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      opacity,
    });

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [leaflet, map, tileUrl, config.maxZoom, config.minZoom, opacity]);

  return null;
}

