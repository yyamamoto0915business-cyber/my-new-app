export type MapTileStyle = "osm-bright-ja" | "maptiler-basic-ja" | "maptiler-toner-ja";

export type BaseMapKey = "standard" | "minimal" | "light";

export const baseMapConfig: Record<
  BaseMapKey,
  {
    style: MapTileStyle;
    minZoom: number;
    maxZoom: number;
  }
> = {
  // いちばん情報量を落として「数字が目立ちにくい」方向
  minimal: { style: "maptiler-basic-ja", minZoom: 3, maxZoom: 20 },
  // 従来に近い明るさ（ただし数字が目立つ場合は minimal を優先）
  standard: { style: "osm-bright-ja", minZoom: 3, maxZoom: 20 },
  // コントラスト強め。状況に応じて切り替え候補
  light: { style: "maptiler-toner-ja", minZoom: 3, maxZoom: 20 },
};

export const DEFAULT_BASE_MAP_KEY: BaseMapKey = "minimal";

export function getOpenStreetMapJpTileUrl(style: MapTileStyle, z: number, x: number, y: number) {
  // {s} を使わない単純な XYZ URL
  // leafletの tileLayer は {z}/{x}/{y} を解釈するので、ここでは実際の値は不要
  void z;
  void x;
  void y;
  return `https://tile.openstreetmap.jp/styles/${style}/{z}/{x}/{y}.png`;
}

export function getOpenStreetMapJpAttribution() {
  return "© OpenStreetMap Contributors";
}

