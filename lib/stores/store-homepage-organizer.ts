import { createClient } from "@/lib/supabase/server";
import { getOrganizerById } from "@/lib/db/organizers";
import type { StoreHomepageOrganizer } from "@/components/stores/detail/StoreHomepage";

/** お店のページに出す「運営」の情報（名前・アイコン・Instagram）。取れなければ null */
export async function getStoreHomepageOrganizer(organizerId: string | null | undefined): Promise<StoreHomepageOrganizer | null> {
  if (!organizerId) return null;
  try {
    const supabase = await createClient();
    if (!supabase) return null;
    const o = await getOrganizerById(supabase, organizerId);
    if (!o) return null;
    return {
      id: o.id,
      name: o.organizationName,
      avatarUrl: o.avatarUrl,
      shortBio: o.shortBio,
      instagramUrl: o.instagramUrl,
    };
  } catch {
    return null;
  }
}
