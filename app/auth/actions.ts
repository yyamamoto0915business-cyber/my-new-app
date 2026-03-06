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

  const { error } = await supabase.auth.signUp({
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

  if (error) {
    if (
      error.message.includes("already registered") ||
      error.message.includes("already been registered")
    ) {
      return { ok: false, message: "このメールアドレスはすでに登録されています。ログインしてください。" };
    }
    return { ok: false, message: "エラーが発生しました。しばらくしてからもう一度お試しください。" };
  }

  return { ok: true };
}
