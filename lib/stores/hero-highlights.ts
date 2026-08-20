import type { StoreFeatureKey, StoreNewsRecord } from "@/lib/stores/types";

export type StoreHeroHighlightTone = "menu" | "coupon" | "parking";

export type StoreHeroHighlight = {
  id: StoreHeroHighlightTone;
  label: string;
  tone: StoreHeroHighlightTone;
  /** アイコン右下の小さなバッジ（例: 登場） */
  badge?: string;
};

/**
 * ヒーロー右パネル下のハイライトカードを、ニュース／特徴から組み立てる。
 * モック: 新メニュー / クーポンあり / 駐車場あり
 */
export function buildStoreHeroHighlights(opts: {
  features: StoreFeatureKey[];
  news: Array<Pick<StoreNewsRecord, "category" | "status">>;
  /** 管理画面プレビュー用に下書きニュースも対象にする */
  includeDraft?: boolean;
  kind?: "store" | "kitchen_car";
}): StoreHeroHighlight[] {
  const publicNews = opts.news.filter((n) =>
    opts.includeDraft
      ? n.status === "public" || n.status === "draft"
      : n.status === "public",
  );
  const hasNewMenu = publicNews.some((n) => n.category === "new_item");
  const hasCoupon = publicNews.some((n) => n.category === "coupon");
  const hasSeasonal = publicNews.some((n) => n.category === "sale");
  const hasParking = opts.features.includes("parking");
  const isKitchen = opts.kind === "kitchen_car";

  const items: StoreHeroHighlight[] = [];
  if (hasSeasonal) {
    items.push({
      id: "menu",
      label: "季節限定あり",
      tone: "menu",
    });
  } else if (hasNewMenu) {
    items.push({
      id: "menu",
      label: isKitchen ? "限定メニュー" : "新メニュー",
      tone: "menu",
      badge: isKitchen ? undefined : "登場",
    });
  }
  if (hasCoupon) {
    items.push({
      id: "coupon",
      label: "クーポンあり",
      tone: "coupon",
    });
  }
  if (hasParking && !isKitchen) {
    items.push({
      id: "parking",
      label: "駐車場あり",
      tone: "parking",
    });
  }
  return items;
}
