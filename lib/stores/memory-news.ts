/**
 * 店舗ニュースの開発用インメモリ
 */
import { DEMO_ORGANIZER_STORE, DEMO_STORE_ID } from "@/lib/organizer/store-management-mock";
import {
  normalizeStoreDateInput,
  type StoreNewsInput,
  type StoreNewsRecord,
  type StoreNewsStatus,
} from "@/lib/stores/types";

function seedFromDemo(): StoreNewsRecord[] {
  return DEMO_ORGANIZER_STORE.news.map((n) => ({
    id: n.id,
    storeId: DEMO_STORE_ID,
    title: n.title,
    excerpt: n.excerpt,
    body: null,
    thumbnailUrl: n.thumbnail || null,
    category: n.category,
    periodStart: normalizeStoreDateInput(n.periodStart),
    periodEnd: normalizeStoreDateInput(n.periodEnd),
    status: n.status,
    createdAt: `${normalizeStoreDateInput(n.updatedAt) ?? "2024-05-01"}T00:00:00.000Z`,
    updatedAt: `${normalizeStoreDateInput(n.updatedAt) ?? "2024-05-01"}T00:00:00.000Z`,
  }));
}

const newsItems: StoreNewsRecord[] = seedFromDemo();
let nextNewsId = 100;

function resolveStoreId(storeId: string): string {
  if (storeId === "demo") return DEMO_STORE_ID;
  return storeId;
}

/** キッチンカーデモ用ニュース（未投入時のみ） */
export function seedDemoKitchenNews(storeId: string): void {
  if (newsItems.some((n) => n.storeId === storeId)) return;
  const now = new Date().toISOString();
  const samples: StoreNewsRecord[] = [
    {
      id: "kn1",
      storeId,
      title: "季節限定レモネード登場",
      excerpt: "すっきり爽やかな限定ドリンクをカーでお届けします。",
      body: null,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&q=80",
      category: "sale",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      status: "public",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kn2",
      storeId,
      title: "新メニュー「BLTホットサンド」",
      excerpt: "焼きたてパンに具材をサンドした定番メニューです。",
      body: null,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80",
      category: "new_item",
      periodStart: "2026-07-15",
      periodEnd: null,
      status: "public",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kn3",
      storeId,
      title: "初回限定ドリンク1杯クーポン",
      excerpt: "初めてのご来店でお好きなドリンクをプレゼント。",
      body: null,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      category: "coupon",
      periodStart: "2026-08-01",
      periodEnd: "2026-09-30",
      status: "public",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kn4",
      storeId,
      title: "週末マルシェ出店のお知らせ",
      excerpt: "練馬駅北口広場に出店します。詳細は出店スケジュールへ。",
      body: null,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400&q=80",
      category: "stall",
      periodStart: "2026-08-08",
      periodEnd: "2026-08-08",
      status: "public",
      createdAt: now,
      updatedAt: now,
    },
  ];
  newsItems.push(...samples);
}

export function listMemoryStoreNews(storeId: string): StoreNewsRecord[] {
  const sid = resolveStoreId(storeId);
  return newsItems
    .filter((n) => n.storeId === sid)
    .map((n) => ({ ...n }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getMemoryStoreNewsById(
  storeId: string,
  newsId: string,
): StoreNewsRecord | null {
  const sid = resolveStoreId(storeId);
  const found = newsItems.find((n) => n.storeId === sid && n.id === newsId);
  return found ? { ...found } : null;
}

export function createMemoryStoreNews(
  storeId: string,
  input: StoreNewsInput & { title: string },
): StoreNewsRecord {
  const now = new Date().toISOString();
  const record: StoreNewsRecord = {
    id: `n-mem-${nextNewsId++}`,
    storeId: resolveStoreId(storeId),
    title: input.title.trim(),
    excerpt: input.excerpt?.trim() || null,
    body: input.body?.trim() || null,
    thumbnailUrl: input.thumbnailUrl?.trim() || null,
    category: input.category ?? "business",
    periodStart: normalizeStoreDateInput(input.periodStart),
    periodEnd: normalizeStoreDateInput(input.periodEnd),
    status: (input.status as StoreNewsStatus) ?? "draft",
    createdAt: now,
    updatedAt: now,
  };
  newsItems.unshift(record);
  return { ...record };
}

export function updateMemoryStoreNews(
  storeId: string,
  newsId: string,
  patch: StoreNewsInput,
): StoreNewsRecord | null {
  const sid = resolveStoreId(storeId);
  const idx = newsItems.findIndex((n) => n.storeId === sid && n.id === newsId);
  if (idx < 0) return null;
  const prev = newsItems[idx];
  const now = new Date().toISOString();
  const next: StoreNewsRecord = {
    ...prev,
    title:
      patch.title !== undefined ? patch.title.trim() || prev.title : prev.title,
    excerpt: patch.excerpt !== undefined ? patch.excerpt?.trim() || null : prev.excerpt,
    body: patch.body !== undefined ? patch.body?.trim() || null : prev.body,
    thumbnailUrl:
      patch.thumbnailUrl !== undefined
        ? patch.thumbnailUrl?.trim() || null
        : prev.thumbnailUrl,
    category: patch.category !== undefined ? patch.category : prev.category,
    periodStart:
      patch.periodStart !== undefined
        ? normalizeStoreDateInput(patch.periodStart)
        : prev.periodStart,
    periodEnd:
      patch.periodEnd !== undefined
        ? normalizeStoreDateInput(patch.periodEnd)
        : prev.periodEnd,
    status: patch.status !== undefined ? patch.status : prev.status,
    updatedAt: now,
  };
  newsItems[idx] = next;
  return { ...next };
}

export function deleteMemoryStoreNews(storeId: string, newsId: string): boolean {
  const sid = resolveStoreId(storeId);
  const idx = newsItems.findIndex((n) => n.storeId === sid && n.id === newsId);
  if (idx < 0) return false;
  newsItems.splice(idx, 1);
  return true;
}
