/**
 * Supabase Admin Client（Service Role・RLSバイパス）
 * サーバー側のWebhook・管理処理のみで使用。クライアントに絶対に露出しないこと。
 */
import { createClient } from "@supabase/supabase-js";

/** Service Role クライアント（RLSバイパス） */
export function createAdminClient() {
  // NOTE:
  // 環境変数はスクリプト側で .env.local を動的に読み込むケースがあるため、
  // モジュール読み込み時ではなく「関数呼び出し時」に評価する。
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
