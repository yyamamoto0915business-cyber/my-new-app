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

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as EmailOtpType,
  });

  if (error) {
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(verifiedUrl);
}
