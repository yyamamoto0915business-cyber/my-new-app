/**
 * 店舗の下書きシェル（入力前）判定
 */
import { DEMO_STORE_ID } from "@/lib/organizer/store-management-mock";
import type { StoreKind, StoreRecord } from "@/lib/stores/types";

/** 開発用デモキッチンカー ID */
export const DEMO_KITCHEN_CAR_ID = "demo-machi-cafe-kitchen-car";

/** 自動作成した入力前シェルの初期店舗名 */
export const STORE_DRAFT_SHELL_NAME = "新しい店舗";
export const KITCHEN_CAR_DRAFT_SHELL_NAME = "新しいキッチンカー";

export function draftShellNameForKind(kind: StoreKind): string {
  return kind === "kitchen_car"
    ? KITCHEN_CAR_DRAFT_SHELL_NAME
    : STORE_DRAFT_SHELL_NAME;
}

export function isStoreSampleId(id: string): boolean {
  return (
    id === DEMO_STORE_ID ||
    id === "demo" ||
    id === DEMO_KITCHEN_CAR_ID
  );
}

/** 掲載ハブからの導線で扱う「本人の店舗」か（デモサンプルを除外） */
export function isOwnManageableStore(store: Pick<StoreRecord, "id">): boolean {
  return !isStoreSampleId(store.id);
}

/** 店舗名が未設定（プレースホルダ含む）か */
export function isStoreNameUnset(record: Pick<StoreRecord, "name" | "kind">): boolean {
  const n = record.name.trim();
  if (!n) return true;
  if (n === STORE_DRAFT_SHELL_NAME) return true;
  if (record.kind === "kitchen_car" && n === KITCHEN_CAR_DRAFT_SHELL_NAME) {
    return true;
  }
  return false;
}

/** カバー・紹介などがほぼ空の入力前状態か */
export function isStoreMostlyEmpty(record: StoreRecord): boolean {
  return (
    !record.coverImageUrl?.trim() &&
    record.galleryImages.length === 0 &&
    !record.category?.trim() &&
    !record.tagline?.trim() &&
    !record.description?.trim() &&
    !record.hoursLabel?.trim() &&
    record.features.length === 0
  );
}

export function organizerPathForKind(kind: StoreKind): string {
  return kind === "kitchen_car" ? "/organizer/kitchen-cars" : "/organizer/stores";
}

export function publicPathForKind(kind: StoreKind, id: string): string {
  return kind === "kitchen_car" ? `/kitchen-cars/${id}` : `/stores/${id}`;
}
