import { getSiteOriginForAuthEmails } from "@/lib/site-url";

/**
 * 認証まわりで使うリダイレクトURL用のオリジン。
 * @see getSiteOriginForAuthEmails
 */
export function getAuthRedirectOrigin(): string {
  return getSiteOriginForAuthEmails();
}

/**
 * メール確認（signup）は SSR フローで /auth/confirm を使用。
 * signUp 時の emailRedirectTo は lib/site-url の getSignupEmailRedirectTo() を参照。
 */

/** パスワード再設定など hash フロー用の受け口 */
export const AUTH_CALLBACK_PATH = "/auth/callback";

export function getAuthCallbackUrl(): string {
  const origin = getSiteOriginForAuthEmails();
  return `${origin}${AUTH_CALLBACK_PATH}`;
}
