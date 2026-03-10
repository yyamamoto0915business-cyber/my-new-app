import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organizer } from "./types";

export type OrganizerPublicInfo = {
  id: string;
  organizationName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  avatarUrl: string | null;
  region: string | null;
  bio: string | null;
};

/** 主催者1件取得（公開プロフィールページ用） */
export async function getOrganizerById(
  supabase: SupabaseClient,
  organizerId: string
): Promise<OrganizerPublicInfo | null> {
  const { data, error } = await supabase
    .from("organizers")
    .select(
      `
      id,
      organization_name,
      contact_email,
      contact_phone,
      profiles (
        avatar_url,
        region,
        bio
      )
    `
    )
    .eq("id", organizerId)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const profiles = row.profiles as {
    avatar_url?: string | null;
    region?: string | null;
    bio?: string | null;
  } | null;

  return {
    id: row.id as string,
    organizationName: (row.organization_name as string) ?? "主催者",
    contactEmail: (row.contact_email as string) ?? null,
    contactPhone: (row.contact_phone as string) ?? null,
    avatarUrl: profiles?.avatar_url ?? null,
    region: profiles?.region ?? null,
    bio: profiles?.bio ?? null,
  };
}

export type FeaturedOrganizer = {
  id: string;
  organizationName: string;
  avatarUrl: string | null;
  region: string | null;
  bio: string | null;
  eventCount: number;
};

/** 注目の主催者（公開イベントを持つ主催者、最大limit件） */
export async function fetchFeaturedOrganizers(
  supabase: SupabaseClient,
  limit: number = 6
): Promise<FeaturedOrganizer[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data: eventRows } = await supabase
    .from("events")
    .select("organizer_id")
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

  const { data: orgRows, error } = await supabase
    .from("organizers")
    .select(
      `
      id,
      organization_name,
      profiles (
        avatar_url,
        region,
        bio
      )
    `
    )
    .in("id", organizerIds.slice(0, limit * 2));

  if (error || !orgRows?.length) return [];

  const { data: countRows } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("status", "published")
    .gte("date", today);

  const countByOrg: Record<string, number> = {};
  for (const r of countRows ?? []) {
    const oid = (r as { organizer_id?: string }).organizer_id;
    if (oid) countByOrg[oid] = (countByOrg[oid] ?? 0) + 1;
  }

  return orgRows
    .map((row: Record<string, unknown>) => {
      const profiles = row.profiles as {
        avatar_url?: string | null;
        region?: string | null;
        bio?: string | null;
      } | null;
      return {
        id: row.id as string,
        organizationName: (row.organization_name as string) ?? "主催者",
        avatarUrl: profiles?.avatar_url ?? null,
        region: profiles?.region ?? null,
        bio: profiles?.bio ?? null,
        eventCount: countByOrg[row.id as string] ?? 0,
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
