import { createClient } from "@/lib/supabase/server";
import { getUserById } from "@/lib/auth-users";

/**
 * ユーザーIDから表示名を取得。
 * Supabase profiles を優先し、見つからなければ auth-users（モック）にフォールバック。
 */
export async function getProfileDisplayName(userId: string): Promise<string> {
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", userId)
      .single();
    if (data) {
      return data.display_name ?? data.email ?? "ユーザー";
    }
  }

  const stored = getUserById(userId);
  return stored?.name ?? stored?.email ?? "ユーザー";
}
