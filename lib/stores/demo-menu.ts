/** 公開店舗詳細のメニュー表示用型・変換 */

import type { StoreMenuRecord } from "@/lib/stores/types";

export type StoreMenuItem = {
  id: string;
  name: string;
  description: string;
  priceYen: number;
  imageUrl: string;
};

/** デモ初期データ（メモリ seed 用） */
export const DEMO_STORE_MENU: StoreMenuItem[] = [
  {
    id: "m1",
    name: "まちカフェブレンド",
    description: "すっきりとした後味のハウスブレンド",
    priceYen: 550,
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
  },
  {
    id: "m2",
    name: "季節のフルーツパフェ",
    description: "旬の果物をたっぷり乗せたパフェ",
    priceYen: 980,
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
  },
  {
    id: "m3",
    name: "練馬野菜カレー",
    description: "地元野菜のやさしい味わい",
    priceYen: 1200,
    imageUrl:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
  },
  {
    id: "m4",
    name: "本日のサンドウィッチ",
    description: "焼きたてパンに具材をサンド",
    priceYen: 780,
    imageUrl:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80",
  },
];

/** キッチンカーデモ用メニュー */
export const DEMO_KITCHEN_MENU: StoreMenuItem[] = [
  {
    id: "km1",
    name: "カフェラテ",
    description: "自家焙煎豆のまろやかなラテ",
    priceYen: 550,
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
  },
  {
    id: "km2",
    name: "BLTホットサンド",
    description: "焼きたてパンにベーコン・レタス・トマト",
    priceYen: 780,
    imageUrl:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80",
  },
  {
    id: "km3",
    name: "季節のレモネード",
    description: "すっきり爽やかな限定ドリンク",
    priceYen: 480,
    imageUrl:
      "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&q=80",
  },
  {
    id: "km4",
    name: "チョコクッキー",
    description: "車内焼きのほろほろクッキー",
    priceYen: 320,
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80",
  },
];

export function storeMenuRecordToItem(record: StoreMenuRecord): StoreMenuItem {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? "",
    priceYen: record.priceYen,
    imageUrl:
      record.imageUrl ||
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80",
  };
}

export function storeMenuRecordsToItems(
  records: StoreMenuRecord[],
): StoreMenuItem[] {
  return records.map(storeMenuRecordToItem);
}
