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

/** メール内リンクの受け口（従来の callback・互換用） */
export const AUTH_CALLBACK_PATH = "/auth/callback";

/** パスワード再設定メールの redirectTo（PKCE でもここに code が付いて戻る） */
export const AUTH_UPDATE_PASSWORD_PATH = "/auth/update-password";

export function getAuthCallbackUrl(): string {
  const origin = getSiteOriginForAuthEmails();
  return `${origin}${AUTH_CALLBACK_PATH}`;
}

/**
 * resetPasswordForEmail の redirectTo。
 * PKCE では GoTrue が recovery を URL / PASSWORD_RECOVERY に載せず SIGNED_IN だけ送るため、
 * クエリで再設定フローを明示する（Supabase の許可 URL に `.../auth/callback?flow=recovery` を追加すること）。
 */
export function getPasswordResetEmailRedirectUrl(): string {
  const origin = getSiteOriginForAuthEmails();
  return `${origin}${AUTH_CALLBACK_PATH}?flow=recovery`;
}
