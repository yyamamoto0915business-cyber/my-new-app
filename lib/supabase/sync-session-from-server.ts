import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ブラウザの Supabase が Cookie をまだ読めないとき、サーバー側のセッションを
 * /api/auth/bootstrap 経由で取得して setSession する。
 */
export async function syncSupabaseSessionFromServer(supabase: SupabaseClient): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/bootstrap", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      session: { access_token: string; refresh_token: string } | null;
    };
    if (!data.session?.access_token || !data.session.refresh_token) return false;
    const { error } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function syncSupabaseSessionFromServerWithRetries(
  supabase: SupabaseClient,
  delaysMs: number[] = [0, 120, 400]
): Promise<boolean> {
  for (const ms of delaysMs) {
    if (ms > 0) {
      await new Promise((r) => setTimeout(r, ms));
    }
    if (await syncSupabaseSessionFromServer(supabase)) {
      return true;
    }
  }
  return false;
}
