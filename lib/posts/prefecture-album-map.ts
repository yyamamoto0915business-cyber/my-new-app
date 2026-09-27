import { REGIONS, type Prefecture, type RegionId } from "@/lib/prefectures";

/**
 * 地図に出す都道府県のメイン画像。
 * 値は `public` からのパス。書いた県だけ、全国マップの円になります。
 * 空のままだと、イラストの白い円だけが見えます。
 *
 * 例:
 *   東京都: "/profile/album/prefectures/tokyo.jpg",
 */
export const PREFECTURE_COVERS: Partial<Record<Prefecture, string>> = {
  // 東京都: "/profile/album/prefectures/tokyo.jpg",
};

/** カードに出す件数。差し替え可。 */
export const PREFECTURE_POST_COUNTS: Record<Prefecture, number> = {
  北海道: 12,
  青森県: 8,
  岩手県: 6,
  宮城県: 10,
  秋田県: 5,
  山形県: 7,
  福島県: 9,
  茨城県: 6,
  栃木県: 4,
  群馬県: 7,
  埼玉県: 11,
  千葉県: 8,
  東京都: 14,
  神奈川県: 9,
  新潟県: 6,
  富山県: 5,
  石川県: 7,
  福井県: 4,
  山梨県: 6,
  長野県: 8,
  岐阜県: 5,
  静岡県: 9,
  愛知県: 10,
  三重県: 6,
  滋賀県: 4,
  京都府: 11,
  大阪府: 13,
  兵庫県: 8,
  奈良県: 7,
  和歌山県: 5,
  鳥取県: 4,
  島根県: 5,
  岡山県: 6,
  広島県: 8,
  山口県: 5,
  徳島県: 4,
  香川県: 6,
  愛媛県: 5,
  高知県: 7,
  福岡県: 9,
  佐賀県: 4,
  長崎県: 6,
  熊本県: 7,
  大分県: 5,
  宮崎県: 6,
  鹿児島県: 8,
  沖縄県: 10,
};

const SCENIC = [
  "/profile/album/season-winter.jpg",
  "/profile/album/spring/sakura.jpg",
  "/profile/album/spring/river.jpg",
  "/profile/album/season-summer.jpg",
  "/profile/album/season-autumn.jpg",
  "/profile/album/season-winter.jpg",
  "/profile/album/season-autumn.jpg",
  "/profile/album/spring/nanohana.jpg",
  "/profile/album/spring/flower.jpg",
  "/profile/album/spring/walk.jpg",
  "/profile/album/spring/sunset.jpg",
  "/profile/album/season-spring.jpg",
  "/profile/album/spring/town.jpg",
  "/profile/album/spring/sakura-portrait.jpg",
  "/profile/album/spring/cafe.jpg",
] as const;

/** 新しい地方マップ上の位置（画像の幅・高さに対する %）。 */
export const PREFECTURE_SLOTS: { name: Prefecture; x: number; y: number }[] = [
  { name: "北海道", x: 80, y: 18 },
  { name: "青森県", x: 78, y: 32 },
  { name: "岩手県", x: 88, y: 36 },
  { name: "秋田県", x: 70, y: 37 },
  { name: "宮城県", x: 86, y: 42 },
  { name: "山形県", x: 74, y: 42 },
  { name: "福島県", x: 80, y: 46 },
  { name: "茨城県", x: 92, y: 52 },
  { name: "栃木県", x: 84, y: 52 },
  { name: "群馬県", x: 78, y: 56 },
  { name: "埼玉県", x: 84, y: 58 },
  { name: "千葉県", x: 94, y: 58 },
  { name: "東京都", x: 88, y: 61 },
  { name: "神奈川県", x: 82, y: 64 },
  { name: "新潟県", x: 62, y: 46 },
  { name: "富山県", x: 54, y: 50 },
  { name: "石川県", x: 50, y: 54 },
  { name: "福井県", x: 54, y: 57 },
  { name: "山梨県", x: 70, y: 54 },
  { name: "長野県", x: 64, y: 52 },
  { name: "岐阜県", x: 58, y: 56 },
  { name: "静岡県", x: 74, y: 60 },
  { name: "愛知県", x: 66, y: 62 },
  { name: "三重県", x: 54, y: 52 },
  { name: "滋賀県", x: 48, y: 52 },
  { name: "京都府", x: 42, y: 55 },
  { name: "大阪府", x: 44, y: 60 },
  { name: "兵庫県", x: 36, y: 56 },
  { name: "奈良県", x: 50, y: 58 },
  { name: "和歌山県", x: 50, y: 64 },
  { name: "鳥取県", x: 36, y: 42 },
  { name: "島根県", x: 26, y: 44 },
  { name: "岡山県", x: 38, y: 50 },
  { name: "広島県", x: 28, y: 52 },
  { name: "山口県", x: 20, y: 50 },
  { name: "香川県", x: 40, y: 72 },
  { name: "徳島県", x: 50, y: 74 },
  { name: "愛媛県", x: 36, y: 78 },
  { name: "高知県", x: 46, y: 82 },
  { name: "福岡県", x: 16, y: 58 },
  { name: "佐賀県", x: 12, y: 64 },
  { name: "長崎県", x: 6, y: 68 },
  { name: "熊本県", x: 14, y: 72 },
  { name: "大分県", x: 22, y: 64 },
  { name: "宮崎県", x: 20, y: 74 },
  { name: "鹿児島県", x: 10, y: 80 },
  { name: "沖縄県", x: 12, y: 84 },
];

export type PrefectureAlbumSlot = {
  name: Prefecture;
  x: number;
  y: number;
  image: string;
  /** 全国マップに円を出すか。PREFECTURE_COVERS に書いた県だけ true */
  pinned: boolean;
  postCount: number;
  /** 北海道を大都市で分けるときの表示名 */
  city?: string;
};

export function prefectureAlbumSlots(): PrefectureAlbumSlot[] {
  return PREFECTURE_SLOTS.map((slot, index) => {
    const custom = PREFECTURE_COVERS[slot.name]?.trim() || "";
    return {
      ...slot,
      image: custom || SCENIC[index % SCENIC.length],
      pinned: custom.length > 0,
      postCount: PREFECTURE_POST_COUNTS[slot.name],
    };
  });
}

export type MapRegionFrame = { x: number; y: number; w: number; h: number };

const REGION_ART: Record<Exclude<RegionId, "okinawa">, string> = {
  hokkaido: "/profile/album/regions/01_北海道.png",
  tohoku: "/profile/album/regions/02_東北.png",
  kanto: "/profile/album/regions/03_関東.png",
  chubu: "/profile/album/regions/04_中部.png",
  kinki: "/profile/album/regions/05_近畿.png",
  chugoku: "/profile/album/regions/06_中国.png",
  shikoku: "/profile/album/regions/07_四国.png",
  kyushu: "/profile/album/regions/08_九州・沖縄.png",
};

export type AlbumMapRegion = {
  id: RegionId;
  label: string;
  /** 全国地図に出す地方名の位置（%） */
  x: number;
  y: number;
  /** 地方を開いたときのイラスト */
  image: string;
  /** 地方を開いたときの切り抜き（%） */
  frame: MapRegionFrame;
  prefectures: readonly Prefecture[];
};

const REGION_MARKERS: Record<
  Exclude<RegionId, "okinawa">,
  { x: number; y: number; frame: MapRegionFrame }
> = {
  hokkaido: { x: 70, y: 14, frame: { x: 60, y: 0, w: 40, h: 30 } },
  tohoku: { x: 76, y: 33, frame: { x: 60, y: 26, w: 40, h: 24 } },
  kanto: { x: 82, y: 58, frame: { x: 74, y: 48, w: 26, h: 26 } },
  chubu: { x: 62, y: 42, frame: { x: 46, y: 40, w: 32, h: 28 } },
  kinki: { x: 40, y: 54, frame: { x: 32, y: 44, w: 26, h: 26 } },
  chugoku: { x: 26, y: 36, frame: { x: 14, y: 34, w: 30, h: 26 } },
  shikoku: { x: 34, y: 74, frame: { x: 26, y: 64, w: 36, h: 26 } },
  kyushu: { x: 22, y: 58, frame: { x: 0, y: 50, w: 30, h: 40 } },
};

/** 北海道は県ではなく、主なまちで分ける。 */
export const HOKKAIDO_CITIES: { name: string; x: number; y: number; postCount: number }[] = [
  { name: "札幌", x: 42, y: 44, postCount: 4 },
  { name: "小樽", x: 22, y: 38, postCount: 1 },
  { name: "旭川", x: 54, y: 26, postCount: 2 },
  { name: "北見", x: 68, y: 22, postCount: 1 },
  { name: "釧路", x: 74, y: 56, postCount: 1 },
  { name: "帯広", x: 58, y: 62, postCount: 1 },
  { name: "苫小牧", x: 46, y: 68, postCount: 1 },
  { name: "函館", x: 26, y: 70, postCount: 1 },
];

export function hokkaidoCitySlots(): PrefectureAlbumSlot[] {
  return HOKKAIDO_CITIES.map((city, index) => ({
    name: "北海道",
    x: city.x,
    y: city.y,
    image: SCENIC[index % SCENIC.length],
    pinned: false,
    postCount: city.postCount,
    city: city.name,
  }));
}

/** 地方イラスト上の県名位置（%）。 */
export const REGION_PLACE_MARKS: Record<string, { x: number; y: number }> = {
  青森県: { x: 58, y: 16 },
  秋田県: { x: 44, y: 32 },
  岩手県: { x: 68, y: 34 },
  山形県: { x: 46, y: 50 },
  宮城県: { x: 66, y: 50 },
  福島県: { x: 56, y: 70 },
  群馬県: { x: 28, y: 30 },
  栃木県: { x: 46, y: 22 },
  茨城県: { x: 68, y: 24 },
  埼玉県: { x: 32, y: 44 },
  東京都: { x: 48, y: 52 },
  千葉県: { x: 72, y: 46 },
  神奈川県: { x: 50, y: 70 },
  新潟県: { x: 36, y: 18 },
  富山県: { x: 52, y: 24 },
  石川県: { x: 24, y: 30 },
  福井県: { x: 20, y: 44 },
  長野県: { x: 58, y: 36 },
  岐阜県: { x: 46, y: 50 },
  山梨県: { x: 70, y: 64 },
  静岡県: { x: 62, y: 76 },
  愛知県: { x: 36, y: 70 },
  兵庫県: { x: 24, y: 40 },
  京都府: { x: 52, y: 22 },
  滋賀県: { x: 76, y: 32 },
  大阪府: { x: 30, y: 54 },
  奈良県: { x: 64, y: 52 },
  三重県: { x: 78, y: 74 },
  和歌山県: { x: 38, y: 80 },
  山口県: { x: 20, y: 50 },
  島根県: { x: 34, y: 36 },
  広島県: { x: 48, y: 54 },
  岡山県: { x: 64, y: 42 },
  鳥取県: { x: 78, y: 26 },
  香川県: { x: 48, y: 32 },
  徳島県: { x: 72, y: 44 },
  愛媛県: { x: 28, y: 48 },
  高知県: { x: 50, y: 68 },
  福岡県: { x: 38, y: 22 },
  佐賀県: { x: 26, y: 36 },
  長崎県: { x: 16, y: 48 },
  大分県: { x: 58, y: 28 },
  熊本県: { x: 40, y: 48 },
  宮崎県: { x: 62, y: 54 },
  鹿児島県: { x: 34, y: 72 },
  沖縄県: { x: 78, y: 80 },
};

export function regionPlaceLabel(name: string) {
  if (name === "北海道") return "北海道";
  return name.replace(/[都府県]$/, "");
}

/** イラストの「九州・沖縄」は一つのピン。沖縄県もこの地方に含める。 */
export function albumMapRegions(): AlbumMapRegion[] {
  return REGIONS.filter((region) => region.id !== "okinawa").map((region) => {
    const marker = REGION_MARKERS[region.id as Exclude<RegionId, "okinawa">];
    const okinawa = region.id === "kyushu";
    return {
      id: region.id,
      label: okinawa ? "九州・沖縄" : region.label,
      image: REGION_ART[region.id as Exclude<RegionId, "okinawa">],
      prefectures: okinawa ? [...region.prefectures, "沖縄県"] : region.prefectures,
      ...marker,
    };
  });
}
