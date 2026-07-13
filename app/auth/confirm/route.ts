import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * メール確認リンクの受け口（SSR フロー）。
 *
 * Supabase メールテンプレ例（emailRedirectTo はオリジンのみ）:
 * `{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
 * または `type=email`（プロジェクトのテンプレに合わせる）
 *
 * token_hash をサーバー側で verifyOtp し、セッションを確立してから完了/エラー画面へリダイレクトする。
 * Confirm signup ではリンクの type が `signup` と `email` のどちらかになることがあるため、
 * 失敗時はもう一方でも一度試す。
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

  let error = (
    await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    })
  ).error;

  if (error && (type === "email" || type === "signup")) {
    const alternate: EmailOtpType = type === "email" ? "signup" : "email";
    error = (
      await supabase.auth.verifyOtp({
        token_hash,
        type: alternate,
      })
    ).error;
  }

  if (error) {
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(verifiedUrl);
}
