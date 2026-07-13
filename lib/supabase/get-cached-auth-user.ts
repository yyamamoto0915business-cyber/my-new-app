import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * 同一リクエスト内で auth.getUser を共有する。
 * organizer layout など複数箇所からの二重呼び出しを防ぐ。
 */
export const getCachedAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
