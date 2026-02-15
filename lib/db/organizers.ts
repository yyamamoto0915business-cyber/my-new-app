import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organizer } from "./types";

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
