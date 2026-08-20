/**
 * まち情報ハブ用のフィード型・変換
 */
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getEventStatus } from "@/lib/events";
import { getJstTodayYmd } from "@/lib/jst-date";
import { getHeroWithSubCards } from "@/lib/filterEvents";
import { getPrimaryCategory } from "@/lib/inferCategory";
import type { StoreRecord } from "@/lib/stores/types";
import { publicPathForKind } from "@/lib/stores/draft-shell";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import { getCategoryLabel } from "@/lib/volunteer-utils";

export type MachiKind = "event" | "store" | "volunteer" | "kitchen_car";

export type MachiFeedItem = {
  id: string;
  kind: MachiKind;
  title: string;
  href: string;
  imageUrl: string | null;
  /** カード上の種別ラベル（店舗 / 特売 / ボランティア など） */
  kindLabel: string;
  /** 状態ラベル（営業中 / 募集中 / 本日限定 など） */
  statusLabel: string;
  /** 日時・更新の短い表示 */
  metaLabel: string;
  /** 時刻の短い表示（イベントのみ / 例: 16:00–21:00） */
  timeLabel?: string;
  areaLabel: string;
  tags: string[];
  /** 並び用（新しいほど大） */
  sortAt: number;
  /** フィルター用カテゴリキー */
  filterKeys: string[];
};

/** ヒーロー下クイック（モック準拠） */
export const MACHI_QUICK_FILTERS = [
  { key: "restaurant", label: "飲食店" },
  { key: "cafe", label: "カフェ" },
  { key: "shop", label: "スーパー" },
  { key: "sale", label: "特売" },
  { key: "volunteer", label: "ボランティア" },
  { key: "local", label: "まちの活動" },
  { key: "all", label: "すべて" },
] as const;

export type MachiQuickFilterKey = (typeof MACHI_QUICK_FILTERS)[number]["key"];

/** カテゴリから探す（モック6枠） */
export const MACHI_CATEGORIES = [
  {
    key: "restaurant",
    label: "飲食店・カフェ",
    description: "ご飯・カフェを探す",
  },
  {
    key: "shop",
    label: "スーパー・商店",
    description: "日用品・食材のお店",
  },
  {
    key: "sale",
    label: "特売・セール",
    description: "お得な情報をチェック",
  },
  {
    key: "news",
    label: "店舗のお知らせ",
    description: "休業・新着など",
  },
  {
    key: "volunteer",
    label: "ボランティア募集",
    description: "お手伝いできる活動",
  },
  {
    key: "local",
    label: "地域活動・お手伝い",
    description: "地域の集まり・手伝い",
  },
] as const;

export const MACHI_KIND_TABS = [
  { key: "all", label: "すべて" },
  { key: "store", label: "店舗" },
  { key: "volunteer", label: "ボランティア" },
] as const;

export type MachiKindTab = (typeof MACHI_KIND_TABS)[number]["key"];

function storeFilterKeys(store: StoreRecord): string[] {
  const cat = (store.category ?? "").toLowerCase();
  const name = `${store.name} ${store.tagline ?? ""} ${store.category ?? ""} ${store.description ?? ""}`;
  const keys = new Set<string>(["news"]);

  if (/カフェ|cafe|喫茶|coffee|ベーカリー|bakery/i.test(name) || cat.includes("cafe")) {
    keys.add("cafe");
    keys.add("restaurant");
  }
  if (/飲食|レストラン|食堂|ラーメン|寿司|居酒屋|restaurant|food|ランチ/i.test(name)) {
    keys.add("restaurant");
  }
  if (/スーパー|商店|八百屋|薬局|コンビニ|shop|market|grocery/i.test(name)) {
    keys.add("shop");
  }
  if (/特売|セール|セールス|割引|タイムセール|sale/i.test(name)) {
    keys.add("sale");
  }
  if (keys.size <= 1) {
    keys.add("restaurant");
    keys.add("shop");
  }
  return [...keys];
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

function parseVolunteerSortAt(dateTime: string): number {
  const match = dateTime.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return 0;
  const t = new Date(`${match[1]}T00:00:00`).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function eventStatusLabel(event: Event): string {
  const status = getEventStatus(event);
  if (status === "ended") return "終了";
  if (status === "full") return "満席";
  if (event.date === getJstTodayYmd()) return "本日開催";
  return "開催予定";
}

export function eventToMachiItem(event: Event): MachiFeedItem {
  const sortAt = new Date(`${event.date}T${event.startTime || "00:00"}`).getTime() || 0;
  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : null;
  const dateLabel = (() => {
    const d = new Date(`${event.date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return event.date;
    return d.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });
  })();

  return {
    id: `event:${event.id}`,
    kind: "event",
    title: event.title,
    href: `/events/${event.id}`,
    imageUrl: event.imageUrl,
    kindLabel: "イベント",
    statusLabel: eventStatusLabel(event),
    metaLabel: dateLabel,
    timeLabel: event.startTime
      ? `${event.startTime}${event.endTime ? `–${event.endTime}` : ""}`
      : undefined,
    areaLabel: event.prefecture || event.city || event.location?.slice(0, 18) || "地域のイベント",
    tags: [
      categoryLabel,
      event.price === 0 ? "無料" : null,
      event.childFriendly ? "子どもOK" : null,
    ]
      .filter(Boolean)
      .slice(0, 2) as string[],
    sortAt,
    filterKeys: ["event"],
  };
}

export function storeToMachiItem(store: StoreRecord): MachiFeedItem {
  const sortIso = store.publishedAt ?? store.updatedAt ?? store.createdAt;
  const sortAt = new Date(sortIso).getTime() || 0;
  const dateLabel = formatShortDate(sortIso);
  const isKitchen = store.kind === "kitchen_car";
  const area =
    store.address?.slice(0, 18) ||
    store.accessNote?.slice(0, 16) ||
    (isKitchen ? "地域のキッチンカー" : "地域の店舗");
  const filterKeys = storeFilterKeys(store);
  const isSale = !isKitchen && filterKeys.includes("sale");

  return {
    id: isKitchen ? `kitchen:${store.id}` : `store:${store.id}`,
    kind: isKitchen ? "kitchen_car" : "store",
    title: store.name,
    href: publicPathForKind(store.kind, store.id),
    imageUrl: store.coverImageUrl,
    kindLabel: isKitchen ? "キッチンカー" : isSale ? "特売" : "店舗",
    statusLabel: isKitchen ? "出店中" : isSale ? "本日限定" : "営業中",
    metaLabel: dateLabel
      ? `掲載 ${dateLabel}`
      : store.hoursLabel || (isKitchen ? "出店情報" : "店舗情報"),
    areaLabel: area,
    tags: [store.category, store.tagline].filter(Boolean).slice(0, 2) as string[],
    sortAt,
    filterKeys: isKitchen ? ["kitchen"] : filterKeys,
  };
}

export function volunteerToMachiItem(role: VolunteerRoleWithEvent): MachiFeedItem {
  const dateMatch = role.dateTime.match(/^(\d{4}-\d{2}-\d{2})/);
  let metaLabel = role.dateTime;
  if (dateMatch) {
    const d = new Date(`${dateMatch[1]}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      metaLabel = d.toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      });
    }
  }

  const categoryLabel = getCategoryLabel(role.roleType);
  const isLocalActivity = /清掃|体操|地域|まち|コミュニティ|local/i.test(
    `${role.title} ${role.description} ${categoryLabel}`,
  );

  return {
    id: `volunteer:${role.id}`,
    kind: "volunteer",
    title: role.title,
    href: `/volunteer/${role.id}`,
    imageUrl: role.thumbnailUrl ?? null,
    kindLabel: "ボランティア",
    statusLabel: "募集中",
    metaLabel,
    areaLabel: role.event?.prefecture ?? role.location,
    tags: [
      categoryLabel,
      role.beginnerFriendly ? "初心者OK" : null,
      role.oneDayOk ? "短時間OK" : null,
    ]
      .filter(Boolean)
      .slice(0, 2) as string[],
    sortAt: parseVolunteerSortAt(role.dateTime),
    filterKeys: isLocalActivity ? ["volunteer", "local"] : ["volunteer"],
  };
}

export function buildMachiFeed(
  stores: StoreRecord[],
  volunteers: VolunteerRoleWithEvent[],
): MachiFeedItem[] {
  return [
    ...stores.map(storeToMachiItem),
    ...volunteers.map(volunteerToMachiItem),
  ].sort((a, b) => b.sortAt - a.sortAt);
}

function mergeRecommendedItems(
  prioritizedEvents: MachiFeedItem[],
  stores: MachiFeedItem[],
  kitchens: MachiFeedItem[],
  volunteers: MachiFeedItem[],
  limit: number,
): MachiFeedItem[] {
  const result: MachiFeedItem[] = [];
  const usedIds = new Set<string>();

  const add = (item: MachiFeedItem | undefined) => {
    if (!item || usedIds.has(item.id) || result.length >= limit) return;
    usedIds.add(item.id);
    result.push(item);
  };

  for (const event of prioritizedEvents.slice(0, 2)) {
    add(event);
  }

  add(stores[0]);
  add(kitchens[0]);
  add(volunteers[0]);

  const rest = [...prioritizedEvents, ...stores, ...kitchens, ...volunteers]
    .filter((item) => !usedIds.has(item.id))
    .sort((a, b) => b.sortAt - a.sortAt);

  for (const item of rest) {
    if (result.length >= limit) break;
    add(item);
  }

  return result;
}

/** 街の情報ホーム「おすすめ」用：イベント・店舗・ボランティア・キッチンカーを混在 */
export function buildRecommendedFeed(
  events: Event[],
  stores: StoreRecord[],
  volunteers: VolunteerRoleWithEvent[],
  options: {
    areaPreference: string;
    categoryPrefs: CategoryKey[];
    limit?: number;
    mode?: "recommended" | "popular";
    popularEvents?: Event[];
    /** 終了したイベントも含める（既定: false） */
    includeEnded?: boolean;
  },
): MachiFeedItem[] {
  const limit = options.limit ?? 5;
  const includeEnded = options.includeEnded ?? false;
  const activeEvents = includeEnded
    ? events
    : events.filter((e) => getEventStatus(e) !== "ended");

  const storeItems = stores
    .filter((s) => s.kind !== "kitchen_car")
    .map(storeToMachiItem)
    .sort((a, b) => b.sortAt - a.sortAt);
  const kitchenItems = stores
    .filter((s) => s.kind === "kitchen_car")
    .map(storeToMachiItem)
    .sort((a, b) => b.sortAt - a.sortAt);
  const volunteerItems = volunteers
    .map(volunteerToMachiItem)
    .sort((a, b) => b.sortAt - a.sortAt);

  let prioritizedEvents: MachiFeedItem[];
  if (options.mode === "popular" && options.popularEvents?.length) {
    prioritizedEvents = options.popularEvents
      .filter((e) => includeEnded || getEventStatus(e) !== "ended")
      .map(eventToMachiItem);
  } else {
    const { featured, subCards } = getHeroWithSubCards(
      activeEvents,
      options.areaPreference,
      options.categoryPrefs,
      4,
    );
    const list = [featured, ...subCards].filter((e): e is Event => e != null);
    const ids = new Set(list.map((e) => e.id));
    const rest = activeEvents.filter((e) => !ids.has(e.id));
    prioritizedEvents = [...list, ...rest].map(eventToMachiItem);
  }

  return mergeRecommendedItems(
    prioritizedEvents,
    storeItems,
    kitchenItems,
    volunteerItems,
    limit,
  );
}

export function eventsToMachiItems(
  events: Event[],
  includeEnded = false,
): MachiFeedItem[] {
  return events
    .filter((e) => includeEnded || getEventStatus(e) !== "ended")
    .map(eventToMachiItem);
}

export function filterRecommendedFeed(
  items: MachiFeedItem[],
  options: {
    query: string;
    area: string;
    eventOnly?: boolean;
  },
): MachiFeedItem[] {
  const q = options.query.trim().toLowerCase();
  return items.filter((item) => {
    if (options.eventOnly && item.kind !== "event") return false;
    if (options.area && !item.areaLabel.includes(options.area)) return false;
    if (q) {
      const hay = `${item.title} ${item.areaLabel} ${item.tags.join(" ")} ${item.kindLabel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filterMachiFeed(
  items: MachiFeedItem[],
  options: {
    chip: string;
    category: string;
    area: string;
    query: string;
    kindTab?: MachiKindTab;
  },
): MachiFeedItem[] {
  const q = options.query.trim().toLowerCase();
  const chip = options.chip === "all" ? "" : options.chip;
  const category = options.category;
  const kindTab = options.kindTab ?? "all";

  return items.filter((item) => {
    if (kindTab === "store" && item.kind !== "store") return false;
    if (kindTab === "volunteer" && item.kind !== "volunteer") return false;
    if (chip && !item.filterKeys.includes(chip)) return false;
    if (category && !item.filterKeys.includes(category)) return false;
    if (options.area && !item.areaLabel.includes(options.area)) return false;
    if (q) {
      const hay = `${item.title} ${item.areaLabel} ${item.tags.join(" ")} ${item.kindLabel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
