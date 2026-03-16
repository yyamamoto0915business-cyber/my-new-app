"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * 新規登録（メール確認フロー）。
 * emailRedirectTo にオリジンのみを渡し、Supabase のメールテンプレートで
 * {{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email となるようにする。
 * 本番では NEXT_PUBLIC_SITE_URL を使い、localhost や誤った host に飛ばないようにする。
 */
export async function signUpWithEmail(formData: {
  email: string;
  password: string;
  displayName?: string;
}) {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "エラーが発生しました。しばらくしてからもう一度お試しください。" };
  }

  const email = String(formData.email || "").trim().toLowerCase();
  const password = String(formData.password || "");
  const displayName = String(formData.displayName || "").trim();

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/089f2869-4b0b-45dc-b221-b1a3b9e2669a", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "6ef341",
    },
    body: JSON.stringify({
      sessionId: "6ef341",
      runId: "signup-pre-fix",
      hypothesisId: "H-signup-1",
      location: "app/auth/actions.ts:before-signUp",
      message: "About to call supabase.auth.signUp",
      data: {
        hasSupabase: !!supabase,
        origin,
        emailLength: email.length,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin,
      data: {
        display_name: displayName || undefined,
        name: displayName || email.split("@")[0] || "User",
      },
    },
  });

  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/089f2869-4b0b-45dc-b221-b1a3b9e2669a", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "6ef341",
    },
    body: JSON.stringify({
      sessionId: "6ef341",
      runId: "signup-pre-fix",
      hypothesisId: "H-signup-1",
      location: "app/auth/actions.ts:after-signUp",
      message: "Result of supabase.auth.signUp",
      data: {
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  if (error) {
    // デバッグ用: サーバーログに出力
    console.error("[signUp] Supabase error:", error.message, error.code);

    if (
      error.message.includes("already registered") ||
      error.message.includes("already been registered")
    ) {
      return { ok: false, message: "このメールアドレスはすでに登録されています。ログインしてください。" };
    }
    // 開発時は実際のエラー内容を表示（本番では汎用メッセージのみ）
    const devMessage =
      process.env.NODE_ENV === "development"
        ? `${error.message} (${error.code || "unknown"})`
        : "エラーが発生しました。しばらくしてからもう一度お試しください。";
    return { ok: false, message: devMessage };
  }

  // メール確認ON時、既存メールだとエラーにならず identities が空になる
  if (data.user?.identities?.length === 0) {
    return { ok: false, message: "このメールアドレスはすでに登録されています。ログインしてください。" };
  }

  return { ok: true };
}
