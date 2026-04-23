import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * 主催レイアウトと主催トップで同じ認証・登録判定を共有し、
 * 1リクエストあたりの Supabase 往復を避ける。
 */
export const getOrganizerNavState = cache(async (): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
  organizerRegistered: boolean;
}> => {
  const supabase = await createClient();
  if (!supabase) {
    return { supabase: null, user: null, organizerRegistered: false };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, user: null, organizerRegistered: false };
  }
  const { data } = await supabase
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  return { supabase, user, organizerRegistered: !!data };
});
