/**
 * 店舗ニュースの DB 操作
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isStoreNewsCategory,
  isStoreNewsStatus,
  normalizeStoreDateInput,
  type StoreNewsInput,
  type StoreNewsRecord,
} from "@/lib/stores/types";

function mapRow(r: Record<string, unknown>): StoreNewsRecord {
  const category = isStoreNewsCategory(r.category) ? r.category : "business";
  const status = isStoreNewsStatus(r.status) ? r.status : "draft";
  return {
    id: String(r.id),
    storeId: String(r.store_id),
    title: String(r.title ?? ""),
    excerpt: (r.excerpt as string | null) ?? null,
    body: (r.body as string | null) ?? null,
    thumbnailUrl: (r.thumbnail_url as string | null) ?? null,
    category,
    periodStart: normalizeStoreDateInput(r.period_start),
    periodEnd: normalizeStoreDateInput(r.period_end),
    status,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function listStoreNewsByStoreId(
  supabase: SupabaseClient,
  storeId: string,
): Promise<StoreNewsRecord[]> {
  const { data, error } = await supabase
    .from("store_news")
    .select("*")
    .eq("store_id", storeId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function fetchStoreNewsById(
  supabase: SupabaseClient,
  storeId: string,
  newsId: string,
): Promise<StoreNewsRecord | null> {
  const { data, error } = await supabase
    .from("store_news")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", newsId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function createStoreNews(
  supabase: SupabaseClient,
  storeId: string,
  input: StoreNewsInput & { title: string },
): Promise<StoreNewsRecord> {
  const row = {
    store_id: storeId,
    title: input.title.trim(),
    excerpt: input.excerpt?.trim() || null,
    body: input.body?.trim() || null,
    thumbnail_url: input.thumbnailUrl?.trim() || null,
    category: input.category ?? "business",
    period_start: normalizeStoreDateInput(input.periodStart),
    period_end: normalizeStoreDateInput(input.periodEnd),
    status: input.status ?? "draft",
  };

  const { data, error } = await supabase
    .from("store_news")
    .insert(row)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function updateStoreNews(
  supabase: SupabaseClient,
  storeId: string,
  newsId: string,
  patch: StoreNewsInput,
): Promise<StoreNewsRecord | null> {
  const existing = await fetchStoreNewsById(supabase, storeId, newsId);
  if (!existing) return null;

  const updates: Record<string, unknown> = {};
  if (patch.title !== undefined) updates.title = patch.title.trim() || existing.title;
  if (patch.excerpt !== undefined) updates.excerpt = patch.excerpt?.trim() || null;
  if (patch.body !== undefined) updates.body = patch.body?.trim() || null;
  if (patch.thumbnailUrl !== undefined) {
    updates.thumbnail_url = patch.thumbnailUrl?.trim() || null;
  }
  if (patch.category !== undefined) updates.category = patch.category;
  if (patch.periodStart !== undefined) {
    updates.period_start = normalizeStoreDateInput(patch.periodStart);
  }
  if (patch.periodEnd !== undefined) {
    updates.period_end = normalizeStoreDateInput(patch.periodEnd);
  }
  if (patch.status !== undefined) updates.status = patch.status;

  if (Object.keys(updates).length === 0) return existing;

  const { data, error } = await supabase
    .from("store_news")
    .update(updates)
    .eq("store_id", storeId)
    .eq("id", newsId)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function deleteStoreNews(
  supabase: SupabaseClient,
  storeId: string,
  newsId: string,
): Promise<boolean> {
  const { error, count } = await supabase
    .from("store_news")
    .delete({ count: "exact" })
    .eq("store_id", storeId)
    .eq("id", newsId);

  if (error) throw error;
  return (count ?? 0) > 0;
}
