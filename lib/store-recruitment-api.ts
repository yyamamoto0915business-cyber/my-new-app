import type { SupabaseClient } from "@supabase/supabase-js";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import {
  getDevOrganizerId,
  getStoreRecruitmentById,
  type StoreRecruitment,
} from "@/lib/created-recruitments-store";

export function isStoreRecruitmentId(id: string): boolean {
  return id.startsWith("store-r-");
}

export function getStoreRecruitmentIfExists(id: string): StoreRecruitment | null {
  return getStoreRecruitmentById(id);
}

/** 開発ストア募集を、ログイン中の主催者が管理できるか */
export async function canManageStoreRecruitment(
  supabase: SupabaseClient | null,
  userId: string,
  recruitment: StoreRecruitment
): Promise<boolean> {
  if (supabase) {
    const organizerId = await getOrganizerIdByProfileId(supabase, userId);
    if (organizerId && organizerId === recruitment.organizer_id) return true;
  }
  return recruitment.organizer_id === getDevOrganizerId();
}
