import { headers } from "next/headers";
import { getURL, normalizeBaseUrl } from "@/lib/site-url";

/**
 * Server Action / Route Handler 用の emailRedirectTo オリジン。
 * NEXT_PUBLIC_SITE_URL が無いと getURL() が Vercel ホストになり、
 * Supabase の許可 URL（本番ドメイン）とずれてメール送信やリンクが失敗することがあるため、
 * リクエストの Host（ユーザーがアクセスしているドメイン）を優先する。
 */
export async function getSignupEmailRedirectToServer(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }

  const h = await headers();
  const host =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host")?.trim() || "";
  if (host && !/^localhost(:\d+)?$/i.test(host) && !/^127\.0\.0\.1/.test(host)) {
    const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    return normalizeBaseUrl(`${proto}://${host}`);
  }

  return getURL();
}
