export const COUPON_CATEGORIES = [
  "グルメ",
  "ショッピング",
  "観光・体験",
  "まちあるき",
  "イベント",
  "地域PR",
  "その他",
] as const;

export type CouponCategory = (typeof COUPON_CATEGORIES)[number];

export const COUPON_SAMPLE_IMAGES = [
  "/profile/album/spring/cafe.jpg",
  "/profile/album/spring/town.jpg",
  "/profile/album/spring/walk.jpg",
  "/profile/album/spring/flower.jpg",
  "/profile/album/spring/sakura.jpg",
  "/profile/album/spring/river.jpg",
] as const;

export const COUPON_WIN_MODES = [
  {
    id: "spots",
    label: "スポット達成で獲得",
    blurb: "指定したスポット数に到達すると獲得できます",
  },
  {
    id: "visits",
    label: "店舗訪問で解放",
    blurb: "いくつかの店舗を訪れると獲得できます",
  },
  {
    id: "all",
    label: "全店舗制覇で獲得",
    blurb: "すべての店舗を訪れると獲得できます",
  },
] as const;

export type CouponWinMode = (typeof COUPON_WIN_MODES)[number]["id"];

export const COUPON_AUDIENCES = [
  { id: "anyone", label: "誰でも参加可能" },
  { id: "buyers", label: "アプリ購入者のみ" },
  { id: "category", label: "特定カテゴリの参加者のみ" },
] as const;

export type CouponAudience = (typeof COUPON_AUDIENCES)[number]["id"];

export type CouponStore = {
  key: string;
  name: string;
  category: string;
  imageUrl: string;
  offer: string;
  condition: string;
  limit: number;
  published: boolean;
};

export type CouponSettings = {
  stores: Omit<CouponStore, "key">[];
  category: string;
  tags: string[];
  mainImage: string;
  winMode: CouponWinMode;
  winCount: number;
  oncePerPerson: boolean;
  noStack: boolean;
  useStart: string;
  useEnd: string;
  timeLimit: boolean;
  useFrom: string;
  useTo: string;
  maxCount: number;
  firstCome: boolean;
  autoGrant: boolean;
  audience: CouponAudience;
};

export function createCouponStore(): CouponStore {
  return {
    key: crypto.randomUUID(),
    name: "",
    category: COUPON_CATEGORIES[0],
    imageUrl: COUPON_SAMPLE_IMAGES[0],
    offer: "",
    condition: "",
    limit: 100,
    published: true,
  };
}

export function sampleCouponStores(): CouponStore[] {
  return [
    {
      key: crypto.randomUUID(),
      name: "さくらベーカリー",
      category: "グルメ",
      imageUrl: "/profile/album/spring/cafe.jpg",
      offer: "100円引き",
      condition: "税込1,000円以上のお会計で100円引き",
      limit: 500,
      published: true,
    },
    {
      key: crypto.randomUUID(),
      name: "まちカフェ",
      category: "グルメ",
      imageUrl: "/profile/album/spring/town.jpg",
      offer: "ドリンク1杯無料",
      condition: "お好きなドリンク1杯無料",
      limit: 300,
      published: true,
    },
    {
      key: crypto.randomUUID(),
      name: "商店街食堂",
      category: "グルメ",
      imageUrl: "/profile/album/spring/walk.jpg",
      offer: "5%OFF",
      condition: "お会計金額から5%OFF",
      limit: 400,
      published: true,
    },
    {
      key: crypto.randomUUID(),
      name: "フラワーショップはなみ",
      category: "ショッピング",
      imageUrl: "/profile/album/spring/flower.jpg",
      offer: "特典プレゼント",
      condition: "1,000円以上のご購入で季節の花1本プレゼント",
      limit: 200,
      published: true,
    },
  ];
}

export function couponWinLabel(mode: CouponWinMode, count: number, storeCount: number): string {
  if (mode === "all") return "全店舗制覇で獲得";
  if (mode === "visits") return `${Math.min(count, Math.max(storeCount, 1))}店舗訪問で解放`;
  return `${Math.min(count, Math.max(storeCount, 1))}スポット達成で獲得`;
}

function isWinMode(value: string): value is CouponWinMode {
  return COUPON_WIN_MODES.some((mode) => mode.id === value);
}

function isAudience(value: string): value is CouponAudience {
  return COUPON_AUDIENCES.some((item) => item.id === value);
}

export function sanitizeCouponSettings(raw: unknown): CouponSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const stores = Array.isArray(body.stores)
    ? body.stores.slice(0, 20).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const limitRaw = typeof row.limit === "number" ? Math.round(row.limit) : 100;
        return [
          {
            name: typeof row.name === "string" ? row.name.trim().slice(0, 40) : "",
            category: typeof row.category === "string" ? row.category.trim().slice(0, 24) : COUPON_CATEGORIES[0],
            imageUrl: typeof row.imageUrl === "string" ? row.imageUrl.trim().slice(0, 300) : "",
            offer: typeof row.offer === "string" ? row.offer.trim().slice(0, 40) : "",
            condition: typeof row.condition === "string" ? row.condition.trim().slice(0, 80) : "",
            limit: Math.min(9999, Math.max(0, limitRaw)),
            published: row.published !== false,
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
  const winMode = typeof body.winMode === "string" && isWinMode(body.winMode) ? body.winMode : "spots";
  const winRaw = typeof body.winCount === "number" ? Math.round(body.winCount) : 2;
  const maxRaw = typeof body.maxCount === "number" ? Math.round(body.maxCount) : 500;
  const audience = typeof body.audience === "string" && isAudience(body.audience) ? body.audience : "anyone";
  return {
    stores,
    category: typeof body.category === "string" ? body.category.trim().slice(0, 24) : COUPON_CATEGORIES[0],
    tags,
    mainImage: typeof body.mainImage === "string" ? body.mainImage.trim().slice(0, 300) : "",
    winMode,
    winCount: Math.min(20, Math.max(1, winRaw)),
    oncePerPerson: body.oncePerPerson !== false,
    noStack: body.noStack !== false,
    useStart: typeof body.useStart === "string" ? body.useStart.slice(0, 10) : "",
    useEnd: typeof body.useEnd === "string" ? body.useEnd.slice(0, 10) : "",
    timeLimit: body.timeLimit === true,
    useFrom: typeof body.useFrom === "string" ? body.useFrom.slice(0, 5) : "09:00",
    useTo: typeof body.useTo === "string" ? body.useTo.slice(0, 5) : "18:00",
    maxCount: Math.min(99999, Math.max(0, maxRaw)),
    firstCome: body.firstCome === true,
    autoGrant: body.autoGrant !== false,
    audience,
  };
}
