const LOCAL_FALLBACK = "http://localhost:3000";

export function normalizeBaseUrl(url: string): string {
  let u = url.trim().replace(/\/+$/, "");
  if (!u) return LOCAL_FALLBACK;

  if (!/^https?:\/\//i.test(u)) {
    const isLocal =
      /^localhost(:\d+)?$/i.test(u) ||
      /^127\.0\.0\.1(:\d+)?$/i.test(u) ||
      /^\[::1\](:\d+)?$/i.test(u);
    u = isLocal ? `http://${u}` : `https://${u}`;
  }

  try {
    const parsed = new URL(u);
    const host = parsed.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      parsed.protocol = "http:";
      u = parsed.toString().replace(/\/$/, "");
    }
  } catch {
    return LOCAL_FALLBACK;
  }

  return u.replace(/\/+$/, "");
}

/**
 * アプリのサイトベース URL（末尾スラッシュなし）。
 * - NEXT_PUBLIC_SITE_URL（本番ドメインなど）
 * - 未設定時: NEXT_PUBLIC_VERCEL_URL または Vercel 実行時の VERCEL_URL（Preview 用・https を付与）
 * - それも無い場合: http://localhost:3000
 */
export function getURL(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    return normalizeBaseUrl(site);
  }

  const vercelPublic = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  const vercelRuntime =
    typeof process.env.VERCEL_URL === "string" ? process.env.VERCEL_URL.trim() : "";
  const vercel = vercelPublic || vercelRuntime;

  if (vercel) {
    const withProto = /^https?:\/\//i.test(vercel) ? vercel : `https://${vercel}`;
    return normalizeBaseUrl(withProto);
  }

  return LOCAL_FALLBACK;
}

/**
 * メール内の RedirectTo / emailRedirectTo 用オリジン。
 * クライアントで NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_VERCEL_URL がどちらも無いときは
 * window.location.origin（ローカル・Vercel Preview で現在のデプロイ URL に合わせる）。
 */
export function getSiteOriginForAuthEmails(): string {
  if (typeof window !== "undefined") {
    const hasConfiguredPublicOrigin =
      Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()) ||
      Boolean(process.env.NEXT_PUBLIC_VERCEL_URL?.trim());
    if (!hasConfiguredPublicOrigin) {
      return normalizeBaseUrl(window.location.origin);
    }
  }
  return getURL();
}

/**
 * signUp / resend の `emailRedirectTo` に渡す値（サイトオリジンのみ・末尾スラッシュなし）。
 *
 * Supabase の `{{ .RedirectTo }}` にこの値が入る。プロジェクトのメールテンプレは次の形式を前提にしている:
 * `{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup` または `type=email`
 *
 * 注意: オリジンに `/auth/confirm` まで含めた URL を渡すと、上記テンプレで
 * `.../auth/confirm/auth/confirm?...` のようになりリンクが壊れる。
 */
export function getSignupEmailRedirectTo(): string {
  return getSiteOriginForAuthEmails();
}
