import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * メール確認リンクの受け口（SSR フロー）。
 * メールテンプレートの {{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email から遷移する。
 * token_hash をサーバー側で verifyOtp し、セッションを確立してから完了/エラー画面へリダイレクトする。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const origin = request.nextUrl.origin;
  const verifiedUrl = `${origin}/auth/verified`;
  const errorUrl = `${origin}/auth/error`;

  if (!token_hash || !type) {
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(errorUrl);
  }

  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/089f2869-4b0b-45dc-b221-b1a3b9e2669a", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "6ef341",
    },
    body: JSON.stringify({
      sessionId: "6ef341",
      runId: "pre-fix",
      hypothesisId: "H1-H3",
      location: "app/auth/confirm/route.ts:before-verifyOtp",
      message: "About to verify email OTP",
      data: { token_hash_present: !!token_hash, type },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as EmailOtpType,
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
      runId: "pre-fix",
      hypothesisId: "H1-H3",
      location: "app/auth/confirm/route.ts:after-verifyOtp",
      message: "Result of verifyOtp in confirm route",
      data: { hasError: !!error, errorMessage: error?.message, errorStatus: (error as any)?.status },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  if (error) {
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(verifiedUrl);
}
