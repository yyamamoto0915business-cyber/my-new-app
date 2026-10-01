import { processLock } from "@supabase/auth-js";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(url, key, {
      auth: {
        // タブをまたぐ Navigator Lock が別画面の getSession で掴まれたままになると、
        // ログイン自体が待たされて中断される。同一タブ内の直列化だけにする。
        lock: processLock,
      },
    });
  }
  return browserClient;
}
