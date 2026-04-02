import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * conversations.other_user_id 等が profiles(id) を参照するため、
 * トリガ未実行などで profiles が無いユーザーがいると会話作成が FK で失敗する。
 * サーバー側で 1 行だけ確保する（organizer/register と同様に Service Role を優先）。
 */
export async function ensureProfileRowForUser(
  supabase: SupabaseClient,
  user: {
    id: string;
    email: string | null;
    name: string | null;
  }
): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (data) return;

  const admin = createAdminClient();
  const writer = admin ?? supabase;
  const { error } = await writer.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? undefined,
      display_name: user.name ?? user.email ?? undefined,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}
