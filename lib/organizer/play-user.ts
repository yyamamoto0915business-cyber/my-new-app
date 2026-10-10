import { createClient } from "@/lib/supabase/server";

/** 参加画面を開いているログイン中のアカウント。未ログインは null。 */
export async function readPlayUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}
