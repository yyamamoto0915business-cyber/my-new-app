/**
 * 店舗テーブルの DB 操作
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeGalleryImages } from "@/lib/gallery-images";
import {
  MAX_STORE_GALLERY_IMAGES,
  normalizeStoreFeatures,
  normalizeStoreKind,
  type StoreIntroUpdateInput,
  type StoreKind,
  type StoreRecord,
  type StoreStatus,
} from "@/lib/stores/types";

function mapRow(r: Record<string, unknown>): StoreRecord {
  return {
    id: String(r.id),
    organizerId: String(r.organizer_id),
    kind: normalizeStoreKind(r.kind),
    name: String(r.name ?? ""),
    category: (r.category as string | null) ?? null,
    tagline: (r.tagline as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    coverImageUrl: (r.cover_image_url as string | null) ?? null,
    galleryImages: normalizeGalleryImages(r.gallery_images, MAX_STORE_GALLERY_IMAGES),
    features: normalizeStoreFeatures(r.features),
    hoursLabel: (r.hours_label as string | null) ?? null,
    status: (r.status as StoreStatus) ?? "draft",
    publishedAt: (r.published_at as string | null) ?? null,
    address: (r.address as string | null) ?? null,
    phone: (r.phone as string | null) ?? null,
    seatsInfo: (r.seats_info as string | null) ?? null,
    paymentMethods: (r.payment_methods as string | null) ?? null,
    accessNote: (r.access_note as string | null) ?? null,
    websiteUrl: (r.website_url as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function listStoresByOrganizerId(
  supabase: SupabaseClient,
  organizerId: string,
  kind?: StoreKind,
): Promise<StoreRecord[]> {
  let q = supabase
    .from("stores")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("updated_at", { ascending: false });

  if (kind) {
    q = q.eq("kind", kind);
  }

  const { data, error } = await q;

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

/** 公開中の店舗一覧（まち情報ハブ用） */
export async function listPublicStores(
  supabase: SupabaseClient,
  options?: { limit?: number; kind?: StoreKind },
): Promise<StoreRecord[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  let q = supabase
    .from("stores")
    .select("*")
    .eq("status", "public")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (options?.kind) {
    q = q.eq("kind", options.kind);
  }

  const { data, error } = await q;

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function fetchStoreById(
  supabase: SupabaseClient,
  id: string,
): Promise<StoreRecord | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function getOrganizerIdByStoreId(
  supabase: SupabaseClient,
  storeId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("organizer_id")
    .eq("id", storeId)
    .maybeSingle();

  if (error || !data) return null;
  return data.organizer_id as string;
}

export async function createStore(
  supabase: SupabaseClient,
  organizerId: string,
  input: { name: string; kind?: StoreKind } & StoreIntroUpdateInput,
): Promise<StoreRecord> {
  const status: StoreStatus = input.status ?? "draft";
  const kind: StoreKind = input.kind ?? "store";
  const now = new Date().toISOString();
  const row = {
    organizer_id: organizerId,
    kind,
    name: input.name.trim(),
    category: input.category ?? null,
    tagline: input.tagline ?? null,
    description: input.description ?? null,
    cover_image_url: input.coverImageUrl?.trim() || null,
    gallery_images: normalizeGalleryImages(input.galleryImages ?? [], MAX_STORE_GALLERY_IMAGES),
    features: normalizeStoreFeatures(input.features ?? []),
    hours_label: input.hoursLabel ?? null,
    status,
    published_at: status === "public" ? now : null,
    address: input.address ?? null,
    phone: input.phone ?? null,
    seats_info: input.seatsInfo ?? null,
    payment_methods: input.paymentMethods ?? null,
    access_note: input.accessNote ?? null,
    website_url: input.websiteUrl ?? null,
  };

  const { data, error } = await supabase
    .from("stores")
    .insert(row)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function updateStore(
  supabase: SupabaseClient,
  id: string,
  patch: StoreIntroUpdateInput,
): Promise<StoreRecord | null> {
  const existing = await fetchStoreById(supabase, id);
  if (!existing) return null;

  const updates: Record<string, unknown> = {};

  if (patch.name !== undefined) updates.name = patch.name.trim() || existing.name;
  if (patch.category !== undefined) updates.category = patch.category;
  if (patch.tagline !== undefined) updates.tagline = patch.tagline;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.coverImageUrl !== undefined) {
    updates.cover_image_url = patch.coverImageUrl?.trim() || null;
  }
  if (patch.galleryImages !== undefined) {
    updates.gallery_images = normalizeGalleryImages(
      patch.galleryImages,
      MAX_STORE_GALLERY_IMAGES,
    );
  }
  if (patch.features !== undefined) {
    updates.features = normalizeStoreFeatures(patch.features);
  }
  if (patch.hoursLabel !== undefined) updates.hours_label = patch.hoursLabel;
  if (patch.address !== undefined) updates.address = patch.address;
  if (patch.phone !== undefined) updates.phone = patch.phone;
  if (patch.seatsInfo !== undefined) updates.seats_info = patch.seatsInfo;
  if (patch.paymentMethods !== undefined) {
    updates.payment_methods = patch.paymentMethods;
  }
  if (patch.accessNote !== undefined) updates.access_note = patch.accessNote;
  if (patch.websiteUrl !== undefined) updates.website_url = patch.websiteUrl;

  if (patch.status !== undefined) {
    updates.status = patch.status;
    if (patch.status === "public" && !existing.publishedAt) {
      updates.published_at = new Date().toISOString();
    }
  }

  if (Object.keys(updates).length === 0) return existing;

  const { data, error } = await supabase
    .from("stores")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
