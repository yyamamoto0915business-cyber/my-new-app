"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSignupEmailRedirectToServer } from "@/lib/auth-email-redirect-server";
import {
  validateSignupAgreed,
  validateSignupDisplayName,
  validateSignupEmail,
  validateSignupHoneypot,
} from "@/lib/signup-guards";
import { checkSignupRateLimit, getRequestIpFromHeaders } from "@/lib/signup-rate-limit";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile";

/**
 * 新規登録（メール確認フロー）。
 *
 * emailRedirectTo はオリジンのみ（getSignupEmailRedirectToServer）。メールテンプレで
 * {{ .RedirectTo }}/auth/confirm?token_hash=...&type=signup 等と組み合わせる。
 *
 * Supabase「Site URL」は本番で https://www.machiglyph.jp を推奨。
 */
export async function signUpWithEmail(formData: {
  email: string;
  password: string;
  displayName?: string;
  agreedToTerms?: boolean;
  /** ハニーポット（人間は空欄） */
  website?: string;
  /** Cloudflare Turnstile トークン（キー設定時は必須） */
  captchaToken?: string;
}) {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "エラーが発生しました。しばらくしてからもう一度お試しください。" };
  }

  const email = String(formData.email || "").trim().toLowerCase();
  const password = String(formData.password || "");
  const displayName = String(formData.displayName || "").trim();

  const honeypot = validateSignupHoneypot(formData.website);
  if (!honeypot.ok) return honeypot;

  const agreed = validateSignupAgreed(formData.agreedToTerms);
  if (!agreed.ok) return agreed;

  const emailCheck = validateSignupEmail(email);
  if (!emailCheck.ok) return emailCheck;

  const nameCheck = validateSignupDisplayName(displayName);
  if (!nameCheck.ok) return nameCheck;

  if (!password || password.length < 8) {
    return { ok: false, message: "パスワードは8文字以上で設定してください。" };
  }

  const headerList = await headers();
  const ip = getRequestIpFromHeaders(headerList);

  const rate = checkSignupRateLimit({ ip, email });
  if (!rate.ok) return rate;

  const captcha = await verifyTurnstileToken(formData.captchaToken, ip);
  if (!captcha.ok) return captcha;

  const emailRedirectTo = await getSignupEmailRedirectToServer();

  const signUpOptions: {
    emailRedirectTo: string;
    data: { display_name?: string; name: string };
    captchaToken?: string;
  } = {
    emailRedirectTo,
    data: {
      display_name: displayName || undefined,
      name: displayName || email.split("@")[0] || "User",
    },
  };

  // Supabase Dashboard で CAPTCHA を有効にしている場合に必要
  if (isTurnstileConfigured() && formData.captchaToken?.trim()) {
    signUpOptions.captchaToken = formData.captchaToken.trim();
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: signUpOptions,
  });

  if (error) {
    // デバッグ用: サーバーログに出力
    console.error("[signUp] Supabase error:", error.message, error.code);

    if (
      error.message.includes("already registered") ||
      error.message.includes("already been registered")
    ) {
      return { ok: false, message: "このメールアドレスはすでに登録されています。ログインしてください。" };
    }
    if (/captcha/i.test(error.message)) {
      return {
        ok: false,
        message: "認証の確認に失敗しました。もう一度お試しください。",
      };
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

  // メール確認が無効（自動確認）の場合は signUp がセッションを返す＝すでにログイン済み。
  // その場合は「確認メール送信」画面ではなくオンボーディングへ直接進める。
  return { ok: true, emailConfirmationRequired: !data.session };
}
