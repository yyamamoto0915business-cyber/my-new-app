/**
 * Supabase Admin Client（Service Role・RLSバイパス）
 * サーバー側のWebhook・管理処理のみで使用。クライアントに絶対に露出しないこと。
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Service Role クライアント（RLSバイパス） */
export function createAdminClient() {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
