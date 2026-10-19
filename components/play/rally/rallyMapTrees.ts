import type { Map as MapLibreMap, SymbolLayerSpecification } from "maplibre-gl";

const SOURCE = "openmaptiles";
/** 地図素材（public/play/map）の木と地面の模様。 */
const TREE_IMAGES = ["tree-medium", "tree-large", "tree-sakura", "tree-pine"] as const;
const TEXTURES = ["grass", "water"] as const;

async function addImage(map: MapLibreMap, id: string, pixelRatio: number) {
  if (map.hasImage(id)) return;
  const image = await map.loadImage(`/play/map/${id}.png`);
  if (!map.hasImage(id)) map.addImage(id, image.data, { pixelRatio });
}

function treeLayer(id: string, sourceLayer: string, spacing: number, filter?: SymbolLayerSpecification["filter"]) {
  const layer: SymbolLayerSpecification = {
    id,
    type: "symbol",
    source: SOURCE,
    "source-layer": sourceLayer,
    minzoom: 14.5,
    layout: {
      // 多角形の縁に沿って並べる。
      "symbol-placement": "line",
      "symbol-spacing": spacing,
      // 中くらいの木を多めに、ときどき大きな木・桜・松をまぜる。
      "icon-image": [
        "match",
        ["%", ["to-number", ["coalesce", ["id"], 0]], 7],
        [0, 1],
        "tree-large",
        [2],
        "tree-sakura",
        [3],
        "tree-pine",
        "tree-medium",
      ],
      "icon-size": ["interpolate", ["linear"], ["zoom"], 14.5, 0.32, 17, 0.6, 19, 0.95],
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      // 斜めから見ても、木が立って見えるように。
      "icon-pitch-alignment": "viewport",
      "icon-rotation-alignment": "viewport",
    },
  };
  if (filter) layer.filter = filter;
  return layer;
}

/** 草地・水面の質感と、公園・林・川岸の木を足す。地図の load 後に呼ぶ。 */
export async function addRallyTrees(map: MapLibreMap, beforeId?: string) {
  try {
    await Promise.all([
      ...TREE_IMAGES.map((id) => addImage(map, id, 2)),
      ...TEXTURES.map((id) => addImage(map, id, 2)),
    ]);
  } catch {
    // 素材が読めなくても、色だけの地図で続ける。
    return;
  }
  if (!map.getStyle()) return;

  // 質感は色の上に半透明で重ねる（模様の継ぎ目を目立たせないため）。
  const textures: [string, string, string, number][] = [
    ["rally-park-texture", "park", "grass", 0.5],
    ["rally-water-texture", "water", "water", 0.55],
  ];
  for (const [id, sourceLayer, pattern, opacity] of textures) {
    if (map.getLayer(id)) continue;
    const below = map.getLayer("building") ? "building" : undefined;
    map.addLayer(
      {
        id,
        type: "fill",
        source: SOURCE,
        "source-layer": sourceLayer,
        paint: { "fill-pattern": pattern, "fill-opacity": opacity },
      },
      below,
    );
  }

  const before = beforeId && map.getLayer(beforeId) ? beforeId : undefined;
  if (map.getLayer("rally-trees-park")) return;
  map.addLayer(treeLayer("rally-trees-park", "park", 26), before);
  map.addLayer(
    treeLayer("rally-trees-wood", "landcover", 30, ["in", ["get", "class"], ["literal", ["wood", "forest", "grass"]]]),
    before,
  );
  map.addLayer(treeLayer("rally-trees-water", "water", 38), before);
  // 住宅地の縁（多くは道路ぞい）に街路樹。近づいたときだけ出して、重くしない。
  map.addLayer(
    {
      ...treeLayer("rally-trees-street", "landuse", 46, [
        "in",
        ["get", "class"],
        ["literal", ["residential", "neighbourhood", "quarter", "commercial", "retail"]],
      ]),
      minzoom: 15.5,
    },
    before,
  );
}
