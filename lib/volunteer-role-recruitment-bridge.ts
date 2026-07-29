import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addStoreRecruitment,
  findStoreRecruitmentByNotesMarker,
  getDevOrganizerId,
  type StoreRecruitment,
} from "@/lib/created-recruitments-store";
import { createRecruitmentMvp } from "@/lib/db/recruitments-mvp";

export type VolunteerRoleRecruitmentSource = {
  id: string;
  eventId: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  capacity: number;
  perksText?: string;
};

const VOLUNTEER_ROLE_NOTE_PREFIX = "__volunteer_role_id:";

function volunteerRoleNoteMarker(roleId: string): string {
  return `${VOLUNTEER_ROLE_NOTE_PREFIX}${roleId}`;
}

function findStoreRecruitmentByVolunteerRoleId(roleId: string): StoreRecruitment | null {
  return findStoreRecruitmentByNotesMarker(volunteerRoleNoteMarker(roleId));
}

/** 既存の募集ID（作成はしない） */
export function findRecruitmentIdForVolunteerRole(roleId: string): string | null {
  const existing = findStoreRecruitmentByVolunteerRoleId(roleId);
  return existing?.id ?? null;
}

export function getOrCreateStoreRecruitmentForVolunteerRole(
  role: VolunteerRoleRecruitmentSource,
  organizerId: string = getDevOrganizerId()
): StoreRecruitment {
  const existing = findStoreRecruitmentByVolunteerRoleId(role.id);
  if (existing) return existing;

  return addStoreRecruitment({
    organizer_id: organizerId,
    event_id: role.eventId || null,
    type: "volunteer",
    title: role.title,
    description: role.description,
    status: "public",
    start_at: null,
    end_at: null,
    meeting_place: role.location,
    meeting_lat: null,
    meeting_lng: null,
    roles: [{ name: "ボランティア", count: role.capacity }],
    capacity: role.capacity,
    items_to_bring: null,
    provisions: role.perksText ?? null,
    notes: volunteerRoleNoteMarker(role.id),
    image_url: null,
  });
}

export async function getOrCreateRecruitmentForVolunteerRole(
  supabase: SupabaseClient,
  role: VolunteerRoleRecruitmentSource,
  organizerId: string
): Promise<string> {
  const marker = volunteerRoleNoteMarker(role.id);
  const { data: existing } = await supabase
    .from("recruitments")
    .select("id")
    .eq("organizer_id", organizerId)
    .ilike("notes", `%${marker}%`)
    .maybeSingle();

  if (existing?.id) return existing.id;

  return createRecruitmentMvp(supabase, organizerId, {
    event_id: role.eventId || null,
    title: role.title,
    description: role.description,
    status: "public",
    meeting_place: role.location,
    capacity: role.capacity,
    provisions: role.perksText ?? null,
    notes: marker,
    type: "volunteer",
    roles: [{ name: "ボランティア", count: role.capacity }],
  });
}

export async function findRecruitmentIdForVolunteerRoleAsync(
  supabase: SupabaseClient,
  roleId: string,
  organizerId: string
): Promise<string | null> {
  const marker = volunteerRoleNoteMarker(roleId);
  const { data } = await supabase
    .from("recruitments")
    .select("id")
    .eq("organizer_id", organizerId)
    .ilike("notes", `%${marker}%`)
    .maybeSingle();
  return data?.id ?? null;
}
