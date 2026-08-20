/**
 * 店舗の開発用インメモリストア（Supabase 未設定時）
 */
import {
  DEMO_STORE_ID,
  DEMO_ORGANIZER_STORE,
} from "@/lib/organizer/store-management-mock";
import type { StoreIntroUpdateInput, StoreKind, StoreRecord, StoreStatus } from "@/lib/stores/types";
import { normalizeStoreFeatures, normalizeStoreKind } from "@/lib/stores/types";
import { normalizeGalleryImages } from "@/lib/gallery-images";
import { MAX_STORE_GALLERY_IMAGES } from "@/lib/stores/types";
import { seedDemoKitchenSchedules } from "@/lib/stores/memory-schedule";
import { seedDemoKitchenNews } from "@/lib/stores/memory-news";
import { seedDemoKitchenMenu } from "@/lib/stores/memory-menu";
import { DEMO_KITCHEN_CAR_ID } from "@/lib/stores/draft-shell";

const DEV_ORGANIZER_ID = "dev-organizer";
export { DEMO_KITCHEN_CAR_ID };

function demoToRecord(): StoreRecord {
  const s = DEMO_ORGANIZER_STORE;
  const now = new Date().toISOString();
  return {
    id: DEMO_STORE_ID,
    organizerId: DEV_ORGANIZER_ID,
    kind: "store",
    name: s.name,
    category: s.category,
    tagline: s.tagline,
    description: s.description,
    coverImageUrl: s.coverImage,
    galleryImages: s.gallery.map((g) => g.src),
    features: normalizeStoreFeatures(s.features.map((f) => f.icon)),
    hoursLabel: s.hoursLabel,
    status: s.publishStatus === "public" ? "public" : s.publishStatus === "private" ? "private" : "draft",
    publishedAt: "2024-05-20T00:00:00.000Z",
    address: "東京都練馬区練馬1-2-3",
    phone: "03-1234-5678",
    seatsInfo: "28席（テラス8席）",
    paymentMethods: "現金・クレジット・PayPay・楽天ペイ",
    accessNote: "練馬駅北口から徒歩3分",
    websiteUrl: "https://example.com",
    createdAt: now,
    updatedAt: now,
  };
}

function demoKitchenToRecord(): StoreRecord {
  const now = new Date().toISOString();
  return {
    id: DEMO_KITCHEN_CAR_ID,
    organizerId: DEV_ORGANIZER_ID,
    kind: "kitchen_car",
    name: "まちカフェキッチンカー",
    category: "カフェ・ドリンク",
    tagline:
      "自家焙煎のコーヒーと、手づくりホットサンド。季節のドリンクもご用意しています。",
    description:
      "まちを巡るキッチンカーです。自家焙煎のコーヒーと手づくりホットサンドを中心に、イベントやマルシェへ出店しています。できたての一杯を、その場でゆっくりお楽しみください。",
    coverImageUrl:
      "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80",
      "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&q=80",
    ],
    features: normalizeStoreFeatures([
      "event_stall",
      "cashless",
      "catering",
      "takeout",
      "power",
    ]),
    hoursLabel: "不定休・11:00～18:00（出店により変動）",
    status: "public",
    publishedAt: "2024-05-20T00:00:00.000Z",
    address: null,
    phone: "090-1234-5678",
    seatsInfo: null,
    paymentMethods: "現金・クレジット・PayPay",
    accessNote: null,
    websiteUrl: "https://example.com/machi-cafe-kitchen",
    createdAt: now,
    updatedAt: now,
  };
}

const stores: StoreRecord[] = [demoToRecord(), demoKitchenToRecord()];
seedDemoKitchenSchedules(DEMO_KITCHEN_CAR_ID);
seedDemoKitchenNews(DEMO_KITCHEN_CAR_ID);
seedDemoKitchenMenu(DEMO_KITCHEN_CAR_ID);
let nextId = 1;

export function listMemoryStores(
  organizerId?: string,
  kind?: StoreKind,
): StoreRecord[] {
  let list = stores;
  if (organizerId) {
    list = list.filter(
      (s) => s.organizerId === organizerId || s.organizerId === DEV_ORGANIZER_ID,
    );
  }
  if (kind) {
    list = list.filter((s) => s.kind === kind);
  }
  return list.map((s) => ({ ...s }));
}

/** 公開中のみ（まち情報ハブ用） */
export function listMemoryPublicStores(
  limit = 50,
  kind?: StoreKind,
): StoreRecord[] {
  return stores
    .filter((s) => s.status === "public" && (!kind || s.kind === kind))
    .sort((a, b) => {
      const ta = a.publishedAt ?? a.updatedAt;
      const tb = b.publishedAt ?? b.updatedAt;
      return tb.localeCompare(ta);
    })
    .slice(0, limit)
    .map((s) => ({ ...s }));
}

export function getMemoryStoreById(id: string): StoreRecord | null {
  if (id === "demo") {
    return stores.find((s) => s.id === DEMO_STORE_ID) ?? null;
  }
  const found = stores.find((s) => s.id === id);
  return found ? { ...found } : null;
}

export function createMemoryStore(
  organizerId: string,
  data: Partial<StoreRecord> & { name: string },
): StoreRecord {
  const now = new Date().toISOString();
  const kind = normalizeStoreKind(data.kind);
  const record: StoreRecord = {
    id: `store-mem-${nextId++}`,
    organizerId,
    kind,
    name: data.name.trim(),
    category: data.category ?? null,
    tagline: data.tagline ?? null,
    description: data.description ?? null,
    coverImageUrl: data.coverImageUrl ?? null,
    galleryImages: normalizeGalleryImages(data.galleryImages ?? [], MAX_STORE_GALLERY_IMAGES),
    features: normalizeStoreFeatures(data.features ?? []),
    hoursLabel: data.hoursLabel ?? null,
    status: (data.status as StoreStatus) ?? "draft",
    publishedAt: data.status === "public" ? now : null,
    address: data.address ?? null,
    phone: data.phone ?? null,
    seatsInfo: data.seatsInfo ?? null,
    paymentMethods: data.paymentMethods ?? null,
    accessNote: data.accessNote ?? null,
    websiteUrl: data.websiteUrl ?? null,
    createdAt: now,
    updatedAt: now,
  };
  stores.push(record);
  return { ...record };
}

export function updateMemoryStore(
  id: string,
  patch: StoreIntroUpdateInput,
): StoreRecord | null {
  const idx = stores.findIndex(
    (s) => s.id === id || (id === "demo" && s.id === DEMO_STORE_ID),
  );
  if (idx < 0) return null;
  const prev = stores[idx];
  const now = new Date().toISOString();

  let status = prev.status;
  let publishedAt = prev.publishedAt;
  if (patch.status !== undefined) {
    status = patch.status;
    if (status === "public" && !publishedAt) {
      publishedAt = now;
    }
  }

  const next: StoreRecord = {
    ...prev,
    name: patch.name !== undefined ? patch.name.trim() || prev.name : prev.name,
    category: patch.category !== undefined ? patch.category : prev.category,
    tagline: patch.tagline !== undefined ? patch.tagline : prev.tagline,
    description:
      patch.description !== undefined ? patch.description : prev.description,
    coverImageUrl:
      patch.coverImageUrl !== undefined
        ? patch.coverImageUrl?.trim() || null
        : prev.coverImageUrl,
    galleryImages:
      patch.galleryImages !== undefined
        ? normalizeGalleryImages(patch.galleryImages, MAX_STORE_GALLERY_IMAGES)
        : prev.galleryImages,
    features:
      patch.features !== undefined
        ? normalizeStoreFeatures(patch.features)
        : prev.features,
    hoursLabel: patch.hoursLabel !== undefined ? patch.hoursLabel : prev.hoursLabel,
    status,
    publishedAt,
    address: patch.address !== undefined ? patch.address : prev.address,
    phone: patch.phone !== undefined ? patch.phone : prev.phone,
    seatsInfo: patch.seatsInfo !== undefined ? patch.seatsInfo : prev.seatsInfo,
    paymentMethods:
      patch.paymentMethods !== undefined ? patch.paymentMethods : prev.paymentMethods,
    accessNote: patch.accessNote !== undefined ? patch.accessNote : prev.accessNote,
    websiteUrl: patch.websiteUrl !== undefined ? patch.websiteUrl : prev.websiteUrl,
    updatedAt: now,
  };
  stores[idx] = next;
  return { ...next };
}
