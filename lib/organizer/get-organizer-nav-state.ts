import { getOrganizerAccess } from "@/lib/organizer/team";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCachedAuthUser } from "@/lib/supabase/get-cached-auth-user";

/**
 * 主催レイアウトと主催トップで同じ認証・登録判定を共有し、
 * 1リクエストあたりの Supabase 往復を避ける。
 */
export const getOrganizerNavState = cache(async (): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
  organizerRegistered: boolean;
  organizerId: string | null;
}> => {
  const supabase = await createClient();
  if (!supabase) {
    return { supabase: null, user: null, organizerRegistered: false, organizerId: null };
  }
  const user = await getCachedAuthUser();
  if (!user) {
    return { supabase, user: null, organizerRegistered: false, organizerId: null };
  }
  // 本人の主催者か、TEAM のメンバーとして所属する主催者
  const access = await getOrganizerAccess(supabase, user.id);
  return {
    supabase,
    user,
    organizerRegistered: !!access,
    organizerId: access?.organizerId ?? null,
  };
});
