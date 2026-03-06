/**
 * 認証まわりで使うリダイレクトURL用のオリジン。
 * メール内リンクが localhost や誤った host にならないよう、
 * 本番では NEXT_PUBLIC_SITE_URL を優先する。
 */
export function getAuthRedirectOrigin(): string {
  if (typeof window !== "undefined") {
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (site) return site.replace(/\/$/, "");
    return window.location.origin;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return site ? site.replace(/\/$/, "") : "";
}

/**
 * メール確認（signup）は SSR フローで /auth/confirm を使用。
 * signUp 時の emailRedirectTo はオリジンのみ（app/auth/actions.ts で NEXT_PUBLIC_SITE_URL を使用）。
 * メールテンプレートで {{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email とすること。
 */

/** パスワード再設定など hash フロー用の受け口 */
export const AUTH_CALLBACK_PATH = "/auth/callback";

export function getAuthCallbackUrl(): string {
  const origin = getAuthRedirectOrigin();
  return origin ? `${origin}${AUTH_CALLBACK_PATH}` : "";
}
