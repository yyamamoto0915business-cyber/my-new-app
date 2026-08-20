/** 店舗ドメインの共有型・定数 */

export type StoreStatus = "draft" | "public" | "private";

/** 物理店舗 / キッチンカー */
export type StoreKind = "store" | "kitchen_car";

export function isStoreKind(v: unknown): v is StoreKind {
  return v === "store" || v === "kitchen_car";
}

export function normalizeStoreKind(v: unknown): StoreKind {
  return isStoreKind(v) ? v : "store";
}

export type StoreFeatureKey =
  | "wifi"
  | "terrace"
  | "child"
  | "takeout"
  | "power"
  | "parking"
  | "outdoor_ok"
  | "event_stall"
  | "cashless"
  | "catering";

export const STORE_FEATURE_DEFS: {
  key: StoreFeatureKey;
  label: string;
}[] = [
  { key: "wifi", label: "Wi-Fiあり" },
  { key: "terrace", label: "テラス席あり" },
  { key: "child", label: "子ども歓迎" },
  { key: "takeout", label: "テイクアウトOK" },
  { key: "power", label: "電源あり" },
  { key: "parking", label: "駐車場あり" },
];

/** キッチンカー向け特徴タグ（店舗用とは別セット） */
export const KITCHEN_CAR_FEATURE_DEFS: {
  key: StoreFeatureKey;
  label: string;
}[] = [
  { key: "event_stall", label: "イベント出店可" },
  { key: "cashless", label: "キャッシュレス対応" },
  { key: "catering", label: "ケータリング可" },
  { key: "takeout", label: "テイクアウトのみ" },
  { key: "power", label: "電源あり" },
];

export const STORE_FEATURE_LABEL: Record<StoreFeatureKey, string> = {
  wifi: "Wi-Fiあり",
  terrace: "テラス席あり",
  child: "子ども歓迎",
  takeout: "テイクアウトOK",
  power: "電源あり",
  parking: "駐車場あり",
  outdoor_ok: "屋外出店OK",
  event_stall: "イベント出店可",
  cashless: "キャッシュレス対応",
  catering: "ケータリング可",
};

export function featureDefsForKind(kind: StoreKind) {
  return kind === "kitchen_car" ? KITCHEN_CAR_FEATURE_DEFS : STORE_FEATURE_DEFS;
}

export const MAX_STORE_GALLERY_IMAGES = 12;

/** API / クライアント共有の店舗レコード（camelCase） */
export type StoreRecord = {
  id: string;
  organizerId: string;
  kind: StoreKind;
  name: string;
  category: string | null;
  tagline: string | null;
  description: string | null;
  coverImageUrl: string | null;
  galleryImages: string[];
  features: StoreFeatureKey[];
  hoursLabel: string | null;
  status: StoreStatus;
  publishedAt: string | null;
  address: string | null;
  phone: string | null;
  seatsInfo: string | null;
  paymentMethods: string | null;
  accessNote: string | null;
  websiteUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoreIntroUpdateInput = {
  name?: string;
  category?: string | null;
  tagline?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  galleryImages?: string[];
  features?: StoreFeatureKey[];
  hoursLabel?: string | null;
  status?: StoreStatus;
  address?: string | null;
  phone?: string | null;
  seatsInfo?: string | null;
  paymentMethods?: string | null;
  accessNote?: string | null;
  websiteUrl?: string | null;
};

export function isStoreFeatureKey(v: unknown): v is StoreFeatureKey {
  return typeof v === "string" && v in STORE_FEATURE_LABEL;
}

export function normalizeStoreFeatures(value: unknown): StoreFeatureKey[] {
  if (!Array.isArray(value)) return [];
  const out: StoreFeatureKey[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isStoreFeatureKey(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

export function formatStoreDateJa(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    // すでに YYYY/MM/DD や YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
      return iso.slice(0, 10).replace(/-/g, "/");
    }
    return iso;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

/* ---------- 店舗ニュース ---------- */

export type StoreNewsCategory =
  | "sale"
  | "new_item"
  | "coupon"
  | "business"
  | "stall";

export type StoreNewsStatus = "public" | "ended" | "draft";

export const STORE_NEWS_CATEGORY_DEFS: {
  key: StoreNewsCategory;
  label: string;
}[] = [
  { key: "sale", label: "セール・特売" },
  { key: "new_item", label: "新商品・新メニュー" },
  { key: "coupon", label: "クーポン" },
  { key: "business", label: "営業時報" },
];

/** キッチンカー向けニュース分類（出店情報を含む） */
export const KITCHEN_CAR_NEWS_CATEGORY_DEFS: {
  key: StoreNewsCategory;
  label: string;
}[] = [
  { key: "sale", label: "セール・特売" },
  { key: "new_item", label: "新商品・新メニュー" },
  { key: "coupon", label: "クーポン" },
  { key: "stall", label: "出店情報" },
  { key: "business", label: "営業時報" },
];

export const STORE_NEWS_CATEGORY_LABEL: Record<StoreNewsCategory, string> = {
  sale: "セール・特売",
  new_item: "新商品・新メニュー",
  coupon: "クーポン",
  business: "営業時報",
  stall: "出店情報",
};

export function newsCategoryDefsForKind(kind: StoreKind) {
  return kind === "kitchen_car"
    ? KITCHEN_CAR_NEWS_CATEGORY_DEFS
    : STORE_NEWS_CATEGORY_DEFS;
}

export type StoreNewsRecord = {
  id: string;
  storeId: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  thumbnailUrl: string | null;
  category: StoreNewsCategory;
  /** YYYY-MM-DD */
  periodStart: string | null;
  /** YYYY-MM-DD */
  periodEnd: string | null;
  status: StoreNewsStatus;
  createdAt: string;
  updatedAt: string;
};

export type StoreNewsInput = {
  title?: string;
  excerpt?: string | null;
  body?: string | null;
  thumbnailUrl?: string | null;
  category?: StoreNewsCategory;
  periodStart?: string | null;
  periodEnd?: string | null;
  status?: StoreNewsStatus;
};

export function isStoreNewsCategory(v: unknown): v is StoreNewsCategory {
  return STORE_NEWS_CATEGORY_DEFS.some((d) => d.key === v);
}

export function isStoreNewsStatus(v: unknown): v is StoreNewsStatus {
  return v === "public" || v === "ended" || v === "draft";
}

/** 日付文字列を YYYY-MM-DD に正規化 */
export function normalizeStoreDateInput(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  const slash = t.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (slash) {
    return `${slash[1]}-${slash[2].padStart(2, "0")}-${slash[3].padStart(2, "0")}`;
  }
  const dash = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dash) return `${dash[1]}-${dash[2]}-${dash[3]}`;
  return null;
}

/* ---------- メニュー・商品 ---------- */

export type StoreMenuStatus = "public" | "draft";

export type StoreMenuRecord = {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  priceYen: number;
  imageUrl: string | null;
  status: StoreMenuStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type StoreMenuInput = {
  name?: string;
  description?: string | null;
  priceYen?: number;
  imageUrl?: string | null;
  status?: StoreMenuStatus;
  sortOrder?: number;
};

export function isStoreMenuStatus(v: unknown): v is StoreMenuStatus {
  return v === "public" || v === "draft";
}

export function normalizePriceYen(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const n = Number(value.replace(/[,¥￥\s]/g, ""));
    if (Number.isFinite(n) && n >= 0) return Math.round(n);
  }
  return null;
}

/* ---------- 出店スケジュール（キッチンカー） ---------- */

export type StoreScheduleStatus = "scheduled" | "adjusting" | "cancelled";

export const STORE_SCHEDULE_STATUS_LABEL: Record<StoreScheduleStatus, string> = {
  scheduled: "出店予定",
  adjusting: "調整中",
  cancelled: "中止",
};

export type StoreScheduleRecord = {
  id: string;
  storeId: string;
  /** YYYY-MM-DD */
  eventDate: string;
  eventName: string;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  stallArea: string | null;
  status: StoreScheduleStatus;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoreScheduleInput = {
  eventDate?: string;
  eventName?: string;
  location?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  stallArea?: string | null;
  status?: StoreScheduleStatus;
  eventId?: string | null;
};

export function isStoreScheduleStatus(v: unknown): v is StoreScheduleStatus {
  return v === "scheduled" || v === "adjusting" || v === "cancelled";
}

/** HH:MM または空文字 → null */
export function normalizeTimeInput(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
