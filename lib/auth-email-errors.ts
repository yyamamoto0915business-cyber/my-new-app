import type { AuthError } from "@supabase/supabase-js";

/** Supabase のメール系 API エラーをユーザー向け文言に変換（redirect 不許可・レート制限など） */
export function mapAuthEmailError(
  err: AuthError,
  context: "initial" | "resend" = "initial"
): string {
  const m = (err.message || "").toLowerCase();
  const resendPrefix = context === "resend" ? "再送に失敗しました。" : "";
  if (
    m.includes("redirect") ||
    m.includes("redirect_uri") ||
    m.includes("redirect url") ||
    err.code === "validation_failed"
  ) {
    return `${resendPrefix}送信先URLの許可設定に問題がある可能性があります。時間をおいて試すか、サポートへお問い合わせください。`.trim();
  }
  if (err.status === 429 || m.includes("rate") || m.includes("too many") || m.includes("email rate")) {
    return `${resendPrefix}送信回数の上限に達しました。しばらく時間をおいてからお試しください。`.trim();
  }
  const generic = "通信に失敗しました。時間をおいてもう一度お試しください。";
  if (context === "resend") {
    return `再送に失敗しました。${generic}`;
  }
  return generic;
}
