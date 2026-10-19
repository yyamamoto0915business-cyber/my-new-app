import type { StyleSpecification } from "maplibre-gl";

/** OpenFreeMap（API キー不要）のベクタータイル。OpenMapTiles のスキーマ。 */
const SOURCE = "openmaptiles";
const NAME = ["coalesce", ["get", "name:ja"], ["get", "name"]] as const;
const FONT = ["Noto Sans Regular"];
const RAW_HEIGHT = ["coalesce", ["get", "render_height"], 6];
/** 実際の高さの半分、上限30m。 */
const BUILDING_HEIGHT = ["min", 30, ["*", 0.5, RAW_HEIGHT]] as unknown as number;
const BUILDING_BASE = ["min", 15, ["*", 0.5, ["coalesce", ["get", "render_min_height"], 0]]] as unknown as number;
/** スポットの絵（素材）に合わせた色。草地・石畳・生成りの壁・いぶし瓦。 */
export const RALLY_MAP_COLORS = {
  ground: "#dcebc6",
};

/**
 * 参加者のマップ用の、パステル調で情報を絞った地図。
 * お店や駅のアイコンは出さず、スポットのピンを主役にする。建物は低めの立体で、ゲームの盤面のように見せる。
 */
export function rallyMapStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      [SOURCE]: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": RALLY_MAP_COLORS.ground } },
      {
        id: "landuse",
        type: "fill",
        source: SOURCE,
        "source-layer": "landuse",
        paint: {
          "fill-color": [
            "match",
            ["get", "class"],
            ["residential", "suburb", "neighbourhood", "quarter"],
            "#e1edcd",
            ["commercial", "retail"],
            "#ece5d3",
            ["school", "university", "kindergarten", "college"],
            "#ebe4cf",
            ["cemetery"],
            "#d2e6bd",
            ["pitch", "stadium", "playground"],
            "#c4e3a3",
            RALLY_MAP_COLORS.ground,
          ],
        },
      },
      {
        id: "landcover",
        type: "fill",
        source: SOURCE,
        "source-layer": "landcover",
        paint: {
          "fill-color": [
            "match",
            ["get", "class"],
            ["wood", "forest"],
            "#a9d58a",
            ["grass", "farmland", "scrub"],
            "#c6e6a8",
            ["sand"],
            "#f3ead0",
            "#d6ecc4",
          ],
          "fill-opacity": 0.95,
        },
      },
      {
        id: "park",
        type: "fill",
        source: SOURCE,
        "source-layer": "park",
        paint: { "fill-color": "#b9dd96", "fill-outline-color": "#a6d282" },
      },
      {
        id: "waterway",
        type: "line",
        source: SOURCE,
        "source-layer": "waterway",
        paint: {
          "line-color": "#9fd3ef",
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 18, 8],
        },
      },
      {
        id: "water",
        type: "fill",
        source: SOURCE,
        "source-layer": "water",
        paint: { "fill-color": "#a8d8f2", "fill-outline-color": "#93cbea" },
      },
      {
        id: "rail",
        type: "line",
        source: SOURCE,
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["rail", "transit"]]],
        paint: {
          "line-color": "#d6d1c3",
          "line-width": ["interpolate", ["linear"], ["zoom"], 13, 1, 18, 3],
        },
      },
      {
        id: "road-casing",
        type: "line",
        source: SOURCE,
        "source-layer": "transportation",
        filter: [
          "in",
          ["get", "class"],
          ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary", "minor", "service"]],
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#dacfb8",
          "line-width": [
            "interpolate",
            ["exponential", 1.6],
            ["zoom"],
            12,
            1.5,
            16,
            ["match", ["get", "class"], ["motorway", "trunk", "primary"], 12, ["secondary", "tertiary"], 10, 7],
            19,
            ["match", ["get", "class"], ["motorway", "trunk", "primary"], 44, ["secondary", "tertiary"], 36, 26],
          ],
        },
      },
      {
        id: "path",
        type: "line",
        source: SOURCE,
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["path", "track"]]],
        minzoom: 15,
        layout: { "line-cap": "round" },
        paint: {
          "line-color": "#f8f4e8",
          "line-width": ["interpolate", ["linear"], ["zoom"], 15, 1.5, 19, 5],
          "line-dasharray": [1.5, 1],
        },
      },
      {
        id: "road",
        type: "line",
        source: SOURCE,
        "source-layer": "transportation",
        filter: [
          "in",
          ["get", "class"],
          ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary", "minor", "service"]],
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "class"], ["motorway", "trunk", "primary"], "#f3ecdd", "#f8f4ea"],
          "line-width": [
            "interpolate",
            ["exponential", 1.6],
            ["zoom"],
            12,
            0.8,
            16,
            ["match", ["get", "class"], ["motorway", "trunk", "primary"], 9, ["secondary", "tertiary"], 7.5, 5],
            19,
            ["match", ["get", "class"], ["motorway", "trunk", "primary"], 38, ["secondary", "tertiary"], 31, 22],
          ],
        },
      },
      {
        id: "building",
        type: "fill-extrusion",
        source: SOURCE,
        "source-layer": "building",
        minzoom: 14,
        paint: {
          // 壁は素材の家と同じ生成り〜ベージュ。高い建物ほど少し灰色に。
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "render_height"], 6],
            0,
            "#fbf3e3",
            15,
            "#f5ead6",
            40,
            "#ece8e0",
          ],
          // 高層ビルが盤面を覆わないよう、高さを抑えて「模型」のように見せる。
          "fill-extrusion-height": BUILDING_HEIGHT,
          "fill-extrusion-base": BUILDING_BASE,
          "fill-extrusion-opacity": 1,
          "fill-extrusion-vertical-gradient": true,
        },
      },
      {
        // 建物の上に薄い屋根をのせ、色とりどりの家並みに見せる。
        id: "building-roof",
        type: "fill-extrusion",
        source: SOURCE,
        "source-layer": "building",
        minzoom: 15,
        paint: {
          // 屋根は素材の家と同じ、いぶし瓦の青灰色を基本に、赤瓦・木の茶・青い屋根をまぜる
          // （地物 ID は描画時にタイル単位でそろってしまい、家ごとに散らせないため高さで散らす）。
          "fill-extrusion-color": [
            "match",
            ["%", ["round", ["*", ["coalesce", ["get", "render_height"], 6], 7.3]], 9],
            [4],
            "#e7a690",
            [5],
            "#d4b394",
            [6],
            "#aec5de",
            [7],
            "#a9c99a",
            "#e3d3b8",
          ],
          "fill-extrusion-base": BUILDING_HEIGHT,
          "fill-extrusion-height": [
            "+",
            BUILDING_HEIGHT,
            ["case", [">", ["coalesce", ["get", "render_height"], 6], 20], 0.8, 2],
          ] as unknown as number,
          "fill-extrusion-opacity": 1,
        },
      },
      {
        id: "water-name",
        type: "symbol",
        source: SOURCE,
        "source-layer": "waterway",
        minzoom: 14,
        layout: {
          "symbol-placement": "line",
          "text-field": NAME as unknown as string,
          "text-font": FONT,
          "text-size": 11,
          "text-letter-spacing": 0.1,
        },
        paint: { "text-color": "#4e8fb5", "text-halo-color": "#ffffff", "text-halo-width": 1.4 },
      },
      {
        id: "road-name",
        type: "symbol",
        source: SOURCE,
        "source-layer": "transportation_name",
        minzoom: 15,
        filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary", "trunk"]]],
        layout: {
          "symbol-placement": "line",
          "text-field": NAME as unknown as string,
          "text-font": FONT,
          "text-size": 10.5,
        },
        paint: { "text-color": "#8a8676", "text-halo-color": "#ffffff", "text-halo-width": 1.4 },
      },
      {
        id: "place-name",
        type: "symbol",
        source: SOURCE,
        "source-layer": "place",
        filter: [
          "in",
          ["get", "class"],
          ["literal", ["suburb", "quarter", "neighbourhood", "village", "town", "city"]],
        ],
        layout: {
          "text-field": NAME as unknown as string,
          "text-font": FONT,
          "text-size": ["match", ["get", "class"], ["city", "town"], 14, 12],
          "text-letter-spacing": 0.08,
        },
        paint: { "text-color": "#6f7d6f", "text-halo-color": "#fbfdf6", "text-halo-width": 1.6 },
      },
    ],
  };
}
