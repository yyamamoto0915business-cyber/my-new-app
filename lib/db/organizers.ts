import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organizer } from "./types";
import type { CategoryKey } from "@/lib/categories";

export type OrganizerPublicInfo = {
  id: string;
  organizationName: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  galleryImages: string[];
  categories: CategoryKey[];
  shortBio: string | null;
  bio: string | null;
  activityArea: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  facebookUrl: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
};

/** 主催者1件取得（公開プロフィールページ用） */
export async function getOrganizerById(
  supabase: SupabaseClient,
  organizerId: string
): Promise<OrganizerPublicInfo | null> {
  const { data, error } = await supabase
    .from("organizer_public_profiles")
    .select(
      `
      organizer_id,
      organization_name,
      avatar_url,
      cover_image_url,
      gallery_images,
      categories,
      short_bio,
      bio,
      activity_area,
      website_url,
      instagram_url,
      x_url,
      facebook_url,
      public_email,
      public_phone
    `
    )
    .eq("organizer_id", organizerId)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;

  return {
    id: row.organizer_id as string,
    organizationName: (row.organization_name as string) ?? "主催者",
    avatarUrl: (row.avatar_url as string) ?? null,
    coverImageUrl: (row.cover_image_url as string) ?? null,
    galleryImages: Array.isArray(row.gallery_images)
      ? (row.gallery_images as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
    categories: Array.isArray(row.categories)
      ? (row.categories as unknown[]).filter((x): x is CategoryKey => typeof x === "string")
      : [],
    shortBio: (row.short_bio as string) ?? null,
    bio: (row.bio as string) ?? null,
    activityArea: (row.activity_area as string) ?? null,
    websiteUrl: (row.website_url as string) ?? null,
    instagramUrl: (row.instagram_url as string) ?? null,
    xUrl: (row.x_url as string) ?? null,
    facebookUrl: (row.facebook_url as string) ?? null,
    publicEmail: (row.public_email as string) ?? null,
    publicPhone: (row.public_phone as string) ?? null,
  };
}

export type FeaturedOrganizer = {
  id: string;
  organizationName: string;
  avatarUrl: string | null;
  activityArea: string | null;
  shortBio: string | null;
  categories: CategoryKey[];
  eventCount: number;
  nextEvent: {
    id: string;
    title: string;
    date: string;
  } | null;
};

export type OrganizerListCard = FeaturedOrganizer;

/** 注目の主催者（公開イベントを持つ主催者、最大limit件） */
export async function fetchFeaturedOrganizers(
  supabase: SupabaseClient,
  limit: number = 6
): Promise<FeaturedOrganizer[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data: eventRows } = await supabase
    .from("events")
    .select("organizer_id, id, title, date")
    .eq("status", "published")
    .gte("date", today);

  const organizerIds = [
    ...new Set(
      (eventRows ?? [])
        .map((r: { organizer_id?: string }) => r.organizer_id)
        .filter((id): id is string => !!id)
    ),
  ];

  if (organizerIds.length === 0) return [];

  const { data: featuredRows } = await supabase
    .from("organizer_profiles")
    .select("organizer_id, featured_rank")
    .eq("is_featured", true)
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .limit(limit * 2);

  const featuredIds = (featuredRows ?? [])
    .map((r) => (r as { organizer_id?: string }).organizer_id)
    .filter((id): id is string => !!id);

  const targetIds =
    featuredIds.length > 0 ? featuredIds.slice(0, limit * 2) : organizerIds.slice(0, limit * 2);

  const { data: orgRows, error } = await supabase
    .from("organizer_public_profiles")
    .select(
      `
      organizer_id,
      organization_name,
      avatar_url,
      short_bio,
      activity_area,
      categories
    `
    )
    .in("organizer_id", targetIds);

  if (error || !orgRows?.length) return [];

  const countByOrg: Record<string, number> = {};
  const nextByOrg: Record<string, { id: string; title: string; date: string }> =
    {};

  for (const r of eventRows ?? []) {
    const row = r as {
      organizer_id?: string;
      id?: string;
      title?: string;
      date?: string;
    };
    const oid = row.organizer_id;
    if (oid) countByOrg[oid] = (countByOrg[oid] ?? 0) + 1;
    if (!oid || !row.id || !row.title || !row.date) continue;
    const current = nextByOrg[oid];
    if (!current || row.date < current.date) {
      nextByOrg[oid] = { id: row.id, title: row.title, date: row.date };
    }
  }

  const base = orgRows
    .map((row: Record<string, unknown>) => {
      const organizerId = row.organizer_id as string;
      return {
        id: organizerId,
        organizationName: (row.organization_name as string) ?? "主催者",
        avatarUrl: (row.avatar_url as string) ?? null,
        activityArea: (row.activity_area as string) ?? null,
        shortBio: (row.short_bio as string) ?? null,
        categories: Array.isArray(row.categories)
          ? (row.categories as unknown[]).filter((x): x is CategoryKey => typeof x === "string")
          : [],
        eventCount: countByOrg[organizerId] ?? 0,
        nextEvent: nextByOrg[organizerId] ?? null,
      };
    })
    .filter((o) => o.eventCount > 0)
    .slice(0, limit * 3);

  if (featuredIds.length > 0) {
    const order = new Map<string, number>();
    featuredIds.forEach((id, idx) => order.set(id, idx));
    return base
      .sort((a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999))
      .slice(0, limit);
  }

  return base
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, limit);
}

/** 主催者一覧用（公開イベントを持つ主催者、最大limit件） */
export async function fetchOrganizersForListing(
  supabase: SupabaseClient,
  limit: number = 24
): Promise<OrganizerListCard[]> {
  const today = new Date().toISOString().split("T")[0];

  // 公開イベントを持つ主催者のみ（過去含む）
  const { data: eventRows } = await supabase
    .from("events")
    .select("organizer_id, id, title, date")
    .eq("status", "published");

  const organizerIds = [
    ...new Set(
      (eventRows ?? [])
        .map((r: { organizer_id?: string }) => r.organizer_id)
        .filter((id): id is string => !!id)
    ),
  ];
  if (organizerIds.length === 0) return [];

  const { data: orgRows, error } = await supabase
    .from("organizer_public_profiles")
    .select(
      `
      organizer_id,
      organization_name,
      avatar_url,
      short_bio,
      activity_area,
      categories
    `
    )
    .in("organizer_id", organizerIds.slice(0, limit * 4));

  if (error || !orgRows?.length) return [];

  const countByOrg: Record<string, number> = {};
  const nextByOrg: Record<string, { id: string; title: string; date: string }> =
    {};

  for (const r of eventRows ?? []) {
    const row = r as {
      organizer_id?: string;
      id?: string;
      title?: string;
      date?: string;
    };
    const oid = row.organizer_id;
    if (oid) countByOrg[oid] = (countByOrg[oid] ?? 0) + 1;
    if (!oid || !row.id || !row.title || !row.date) continue;
    if (row.date < today) continue;
    const current = nextByOrg[oid];
    if (!current || row.date < current.date) {
      nextByOrg[oid] = { id: row.id, title: row.title, date: row.date };
    }
  }

  return orgRows
    .map((row: Record<string, unknown>) => {
      const organizerId = row.organizer_id as string;
      return {
        id: organizerId,
        organizationName: (row.organization_name as string) ?? "主催者",
        avatarUrl: (row.avatar_url as string) ?? null,
        activityArea: (row.activity_area as string) ?? null,
        shortBio: (row.short_bio as string) ?? null,
        categories: Array.isArray(row.categories)
          ? (row.categories as unknown[]).filter((x): x is CategoryKey => typeof x === "string")
          : [],
        eventCount: countByOrg[organizerId] ?? 0,
        nextEvent: nextByOrg[organizerId] ?? null,
      };
    })
    .filter((o) => o.eventCount > 0)
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, limit);
}

export async function getOrganizerByProfileId(
  supabase: SupabaseClient,
  profileId: string
): Promise<Organizer | null> {
  const { data, error } = await supabase
    .from("organizers")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (error || !data) return null;
  return data as Organizer;
}

export async function createOrganizer(
  supabase: SupabaseClient,
  profileId: string,
  organizationName: string,
  contactEmail?: string,
  contactPhone?: string
): Promise<Organizer> {
  const { data, error } = await supabase
    .from("organizers")
    .insert({
      profile_id: profileId,
      organization_name: organizationName,
      contact_email: contactEmail ?? null,
      contact_phone: contactPhone ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Organizer;
}
