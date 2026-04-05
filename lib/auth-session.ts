import type { Session } from "@supabase/supabase-js";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * PKCE のパスワード再設定では、URL に type=recovery が付かず GoTrue が SIGNED_IN のみ送ることがある。
 * その場合でも JWT の amr に recovery が入るため、再設定セッションを識別できる。
 */
export function sessionIsPasswordRecovery(session: Session | null): boolean {
  if (!session?.access_token) return false;
  const payload = decodeJwtPayload(session.access_token);
  if (!payload) return false;
  const amr = payload.amr;
  if (!Array.isArray(amr)) return false;
  return amr.some((entry: unknown) => {
    if (entry === "recovery") return true;
    return (
      typeof entry === "object" &&
      entry !== null &&
      "method" in entry &&
      (entry as { method: string }).method === "recovery"
    );
  });
}
