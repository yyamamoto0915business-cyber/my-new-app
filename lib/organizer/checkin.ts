export const CHECKIN_CATEGORIES = ["まち歩き", "観光", "グルメ", "イベント", "その他"] as const;

export type CheckinCategory = (typeof CHECKIN_CATEGORIES)[number];

export const CHECKIN_SAMPLE_IMAGES = [
  "/profile/album/spring/sakura.jpg",
  "/profile/album/spring/town.jpg",
  "/profile/album/spring/walk.jpg",
  "/profile/album/spring/river.jpg",
  "/profile/album/spring/cafe.jpg",
  "/profile/album/spring/flower.jpg",
] as const;

export const CHECKIN_METHODS = [
  {
    id: "gps",
    label: "GPS",
    blurb: "指定のスポットに近づいてチェックイン",
  },
  {
    id: "qr",
    label: "QR",
    blurb: "設置されたQRコードを読み取ってチェックイン",
  },
  {
    id: "keyword",
    label: "キーワード",
    blurb: "現地の看板などに書かれたキーワードを入力してチェックイン",
  },
] as const;

export type CheckinMethod = (typeof CHECKIN_METHODS)[number]["id"];

export const CHECKIN_AUDIENCES = [
  { id: "anyone", label: "すべての方（誰でも参加できる）" },
  { id: "event", label: "対象イベントの参加者のみ" },
] as const;

export type CheckinAudience = (typeof CHECKIN_AUDIENCES)[number]["id"];

export const CHECKIN_CLEAR_MODES = [
  {
    id: "all",
    label: "すべてのスポットでクリア",
    blurb: "設定したすべてのスポットにチェックインするとクリア",
  },
  {
    id: "count",
    label: "指定数以上でクリア",
    blurb: "設定したスポットのうち、指定した数以上でクリア",
  },
  {
    id: "any",
    label: "好きな順で指定数以上",
    blurb: "順番は問わず、設定したスポットのうち指定数以上でクリア",
  },
] as const;

export type CheckinClearMode = (typeof CHECKIN_CLEAR_MODES)[number]["id"];

export type CheckinSpot = {
  key: string;
  name: string;
  place: string;
  method: CheckinMethod;
  radius: number;
  keyword: string;
  reward: string;
  published: boolean;
  imageUrl: string;
  pinX: number;
  pinY: number;
  /** GPS で確かめる場所（地図で選ぶ）。 */
  lat: number | null;
  lng: number | null;
};

export type CheckinSettings = {
  spots: Omit<CheckinSpot, "key">[];
  category: string;
  tags: string[];
  mainImage: string;
  defaultMethod: CheckinMethod;
  audience: CheckinAudience;
  clearMode: CheckinClearMode;
  clearCount: number;
  couponOn: boolean;
  pointsOn: boolean;
  stampOn: boolean;
  prizeOn: boolean;
  couponName: string;
  couponDetail: string;
  prizeName: string;
  prizePlace: string;
  points: number;
  receivePlace: "app" | "venue";
  maxCount: number;
  rankingOn: boolean;
  hintOn: boolean;
  publicToPlayers: boolean;
  showOnEvent: boolean;
  showRanking: boolean;
};

export function createCheckinSpot(method: CheckinMethod = "gps"): CheckinSpot {
  return {
    key: crypto.randomUUID(),
    name: "",
    place: "",
    method,
    radius: 50,
    keyword: "",
    reward: "",
    published: true,
    imageUrl: CHECKIN_SAMPLE_IMAGES[0],
    pinX: 50,
    pinY: 50,
    lat: null,
    lng: null,
  };
}

export function sampleCheckinSpots(): CheckinSpot[] {
  return [
    {
      key: crypto.randomUUID(),
      name: "まちの桜並木",
      place: "まちのさくら通り",
      method: "gps",
      radius: 50,
      keyword: "",
      reward: "桜のバッジ",
      published: true,
      imageUrl: "/profile/album/spring/sakura.jpg",
      pinX: 28,
      pinY: 30,
      lat: null,
      lng: null,
    },
    {
      key: crypto.randomUUID(),
      name: "駅前コミュニティ広場",
      place: "えきまえ通り 3-1",
      method: "qr",
      radius: 50,
      keyword: "",
      reward: "広場のバッジ",
      published: true,
      imageUrl: "/profile/album/spring/town.jpg",
      pinX: 62,
      pinY: 26,
      lat: null,
      lng: null,
    },
    {
      key: crypto.randomUUID(),
      name: "歴史資料館",
      place: "旧加納町 4-3",
      method: "keyword",
      radius: 50,
      keyword: "まちの歴史",
      reward: "歴史のバッジ",
      published: true,
      imageUrl: "/profile/album/spring/walk.jpg",
      pinX: 46,
      pinY: 52,
      lat: null,
      lng: null,
    },
    {
      key: crypto.randomUUID(),
      name: "せせらぎ公園",
      place: "みずべ町 2-8",
      method: "gps",
      radius: 100,
      keyword: "",
      reward: "自然のバッジ",
      published: true,
      imageUrl: "/profile/album/spring/river.jpg",
      pinX: 30,
      pinY: 70,
      lat: null,
      lng: null,
    },
    {
      key: crypto.randomUUID(),
      name: "まちのカフェ",
      place: "まちやす通り 5-3",
      method: "qr",
      radius: 50,
      keyword: "",
      reward: "カフェのバッジ",
      published: true,
      imageUrl: "/profile/album/spring/cafe.jpg",
      pinX: 72,
      pinY: 64,
      lat: null,
      lng: null,
    },
  ];
}

export function checkinMethodLabel(method: CheckinMethod): string {
  return CHECKIN_METHODS.find((item) => item.id === method)?.label ?? "GPS";
}

export function checkinSpotValue(spot: Pick<CheckinSpot, "method" | "radius" | "keyword">): string {
  if (spot.method === "gps") return `半径 ${spot.radius}m`;
  if (spot.method === "keyword") return spot.keyword.trim() ? `「${spot.keyword.trim()}」` : "未設定";
  return "—";
}

export function checkinClearLabel(mode: CheckinClearMode, count: number, spotCount: number): string {
  if (mode === "all") return `すべてのスポットでクリア（${Math.max(spotCount, 1)}スポット）`;
  if (mode === "any") return `好きな順で${count}スポット以上`;
  return `${count}スポット以上でクリア`;
}

function isMethod(value: string): value is CheckinMethod {
  return CHECKIN_METHODS.some((item) => item.id === value);
}

function isAudience(value: string): value is CheckinAudience {
  return CHECKIN_AUDIENCES.some((item) => item.id === value);
}

function isClearMode(value: string): value is CheckinClearMode {
  return CHECKIN_CLEAR_MODES.some((item) => item.id === value);
}

export function sanitizeCheckinSettings(raw: unknown): CheckinSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const spots = Array.isArray(body.spots)
    ? body.spots.slice(0, 20).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const radiusRaw = typeof row.radius === "number" ? Math.round(row.radius) : 50;
        const pinXRaw = typeof row.pinX === "number" ? row.pinX : 50;
        const pinYRaw = typeof row.pinY === "number" ? row.pinY : 50;
        const method = typeof row.method === "string" && isMethod(row.method) ? row.method : "gps";
        return [
          {
            name: typeof row.name === "string" ? row.name.trim().slice(0, 40) : "",
            place: typeof row.place === "string" ? row.place.trim().slice(0, 60) : "",
            method,
            radius: Math.min(500, Math.max(10, radiusRaw)),
            keyword: typeof row.keyword === "string" ? row.keyword.trim().slice(0, 24) : "",
            reward: typeof row.reward === "string" ? row.reward.trim().slice(0, 24) : "",
            published: row.published !== false,
            imageUrl: typeof row.imageUrl === "string" ? row.imageUrl.trim().slice(0, 300) : "",
            pinX: Math.min(92, Math.max(8, Math.round(pinXRaw))),
            pinY: Math.min(92, Math.max(8, Math.round(pinYRaw))),
            lat: typeof row.lat === "number" && Number.isFinite(row.lat) ? row.lat : null,
            lng: typeof row.lng === "number" && Number.isFinite(row.lng) ? row.lng : null,
          },
        ];
      })
    : [];
  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().slice(0, 16))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const defaultMethod = typeof body.defaultMethod === "string" && isMethod(body.defaultMethod) ? body.defaultMethod : "gps";
  const audience = typeof body.audience === "string" && isAudience(body.audience) ? body.audience : "anyone";
  const clearMode = typeof body.clearMode === "string" && isClearMode(body.clearMode) ? body.clearMode : "count";
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : 3;
  const pointsRaw = typeof body.points === "number" ? Math.round(body.points) : 100;
  const maxRaw = typeof body.maxCount === "number" ? Math.round(body.maxCount) : 500;
  return {
    spots,
    category: typeof body.category === "string" ? body.category.trim().slice(0, 24) : CHECKIN_CATEGORIES[0],
    tags,
    mainImage: typeof body.mainImage === "string" ? body.mainImage.trim().slice(0, 300) : "",
    defaultMethod,
    audience,
    clearMode,
    clearCount: Math.min(20, Math.max(1, clearRaw)),
    couponOn: body.couponOn !== false,
    pointsOn: body.pointsOn !== false,
    stampOn: body.stampOn === true,
    prizeOn: body.prizeOn === true,
    couponName: typeof body.couponName === "string" ? body.couponName.trim().slice(0, 40) : "",
    couponDetail: typeof body.couponDetail === "string" ? body.couponDetail.trim().slice(0, 80) : "",
    prizeName: typeof body.prizeName === "string" ? body.prizeName.trim().slice(0, 40) : "",
    prizePlace: typeof body.prizePlace === "string" ? body.prizePlace.trim().slice(0, 60) : "",
    points: Math.min(9999, Math.max(0, pointsRaw)),
    receivePlace: body.receivePlace === "venue" ? "venue" : "app",
    maxCount: Math.min(99999, Math.max(0, maxRaw)),
    rankingOn: body.rankingOn !== false,
    hintOn: body.hintOn !== false,
    publicToPlayers: body.publicToPlayers !== false,
    showOnEvent: body.showOnEvent !== false,
    showRanking: body.showRanking !== false,
  };
}
