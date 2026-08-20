/**
 * 店舗メニューの DB 操作
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isStoreMenuStatus,
  normalizePriceYen,
  type StoreMenuInput,
  type StoreMenuRecord,
} from "@/lib/stores/types";

function mapRow(r: Record<string, unknown>): StoreMenuRecord {
  return {
    id: String(r.id),
    storeId: String(r.store_id),
    name: String(r.name ?? ""),
    description: (r.description as string | null) ?? null,
    priceYen: Number(r.price_yen ?? 0),
    imageUrl: (r.image_url as string | null) ?? null,
    status: isStoreMenuStatus(r.status) ? r.status : "draft",
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function listStoreMenuByStoreId(
  supabase: SupabaseClient,
  storeId: string,
): Promise<StoreMenuRecord[]> {
  const { data, error } = await supabase
    .from("store_menu_items")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function fetchStoreMenuById(
  supabase: SupabaseClient,
  storeId: string,
  menuId: string,
): Promise<StoreMenuRecord | null> {
  const { data, error } = await supabase
    .from("store_menu_items")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", menuId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function createStoreMenu(
  supabase: SupabaseClient,
  storeId: string,
  input: StoreMenuInput & { name: string; priceYen: number },
): Promise<StoreMenuRecord> {
  const row = {
    store_id: storeId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    price_yen: input.priceYen,
    image_url: input.imageUrl?.trim() || null,
    status: input.status ?? "draft",
    sort_order: input.sortOrder ?? 0,
  };

  const { data, error } = await supabase
    .from("store_menu_items")
    .insert(row)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function updateStoreMenu(
  supabase: SupabaseClient,
  storeId: string,
  menuId: string,
  patch: StoreMenuInput,
): Promise<StoreMenuRecord | null> {
  const existing = await fetchStoreMenuById(supabase, storeId, menuId);
  if (!existing) return null;

  const updates: Record<string, unknown> = {};
  if (patch.name !== undefined) updates.name = patch.name.trim() || existing.name;
  if (patch.description !== undefined) {
    updates.description = patch.description?.trim() || null;
  }
  if (patch.priceYen !== undefined) {
    updates.price_yen = normalizePriceYen(patch.priceYen) ?? existing.priceYen;
  }
  if (patch.imageUrl !== undefined) {
    updates.image_url = patch.imageUrl?.trim() || null;
  }
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.sortOrder !== undefined) updates.sort_order = patch.sortOrder;

  if (Object.keys(updates).length === 0) return existing;

  const { data, error } = await supabase
    .from("store_menu_items")
    .update(updates)
    .eq("store_id", storeId)
    .eq("id", menuId)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function deleteStoreMenu(
  supabase: SupabaseClient,
  storeId: string,
  menuId: string,
): Promise<boolean> {
  const { error, count } = await supabase
    .from("store_menu_items")
    .delete({ count: "exact" })
    .eq("store_id", storeId)
    .eq("id", menuId);

  if (error) throw error;
  return (count ?? 0) > 0;
}
