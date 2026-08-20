/**
 * 店舗メニューの開発用インメモリ
 */
import { DEMO_STORE_ID } from "@/lib/organizer/store-management-mock";
import { DEMO_KITCHEN_MENU, DEMO_STORE_MENU } from "@/lib/stores/demo-menu";
import {
  isStoreMenuStatus,
  normalizePriceYen,
  type StoreMenuInput,
  type StoreMenuRecord,
} from "@/lib/stores/types";

function seedFromDemo(): StoreMenuRecord[] {
  const now = new Date().toISOString();
  return DEMO_STORE_MENU.map((m, i) => ({
    id: m.id,
    storeId: DEMO_STORE_ID,
    name: m.name,
    description: m.description,
    priceYen: m.priceYen,
    imageUrl: m.imageUrl,
    status: "public" as const,
    sortOrder: i,
    createdAt: now,
    updatedAt: now,
  }));
}

const menuItems: StoreMenuRecord[] = seedFromDemo();
let nextMenuId = 100;

function resolveStoreId(storeId: string): string {
  if (storeId === "demo") return DEMO_STORE_ID;
  return storeId;
}

/** キッチンカーデモ用メニュー（未投入時のみ） */
export function seedDemoKitchenMenu(storeId: string): void {
  if (menuItems.some((m) => m.storeId === storeId)) return;
  const now = new Date().toISOString();
  menuItems.push(
    ...DEMO_KITCHEN_MENU.map((m, i) => ({
      id: m.id,
      storeId,
      name: m.name,
      description: m.description,
      priceYen: m.priceYen,
      imageUrl: m.imageUrl,
      status: "public" as const,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

export function listMemoryStoreMenu(storeId: string): StoreMenuRecord[] {
  const sid = resolveStoreId(storeId);
  return menuItems
    .filter((m) => m.storeId === sid)
    .map((m) => ({ ...m }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

export function getMemoryStoreMenuById(
  storeId: string,
  menuId: string,
): StoreMenuRecord | null {
  const sid = resolveStoreId(storeId);
  const found = menuItems.find((m) => m.storeId === sid && m.id === menuId);
  return found ? { ...found } : null;
}

export function createMemoryStoreMenu(
  storeId: string,
  input: StoreMenuInput & { name: string; priceYen: number },
): StoreMenuRecord {
  const now = new Date().toISOString();
  const sid = resolveStoreId(storeId);
  const siblings = menuItems.filter((m) => m.storeId === sid);
  const maxOrder = siblings.reduce((max, m) => Math.max(max, m.sortOrder), -1);
  const record: StoreMenuRecord = {
    id: `m-mem-${nextMenuId++}`,
    storeId: sid,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    priceYen: input.priceYen,
    imageUrl: input.imageUrl?.trim() || null,
    status: isStoreMenuStatus(input.status) ? input.status : "draft",
    sortOrder: input.sortOrder ?? maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };
  menuItems.push(record);
  return { ...record };
}

export function updateMemoryStoreMenu(
  storeId: string,
  menuId: string,
  patch: StoreMenuInput,
): StoreMenuRecord | null {
  const sid = resolveStoreId(storeId);
  const idx = menuItems.findIndex((m) => m.storeId === sid && m.id === menuId);
  if (idx < 0) return null;
  const prev = menuItems[idx];
  const now = new Date().toISOString();
  const price =
    patch.priceYen !== undefined
      ? (normalizePriceYen(patch.priceYen) ?? prev.priceYen)
      : prev.priceYen;

  const next: StoreMenuRecord = {
    ...prev,
    name: patch.name !== undefined ? patch.name.trim() || prev.name : prev.name,
    description:
      patch.description !== undefined
        ? patch.description?.trim() || null
        : prev.description,
    priceYen: price,
    imageUrl:
      patch.imageUrl !== undefined ? patch.imageUrl?.trim() || null : prev.imageUrl,
    status: patch.status !== undefined ? patch.status : prev.status,
    sortOrder: patch.sortOrder !== undefined ? patch.sortOrder : prev.sortOrder,
    updatedAt: now,
  };
  menuItems[idx] = next;
  return { ...next };
}

export function deleteMemoryStoreMenu(storeId: string, menuId: string): boolean {
  const sid = resolveStoreId(storeId);
  const idx = menuItems.findIndex((m) => m.storeId === sid && m.id === menuId);
  if (idx < 0) return false;
  menuItems.splice(idx, 1);
  return true;
}
