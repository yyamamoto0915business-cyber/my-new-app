"use client";

import { useState } from "react";
import Link from "next/link";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AuthResultScreen, AuthPageHeader, authResultButtonClass } from "@/components/auth/auth-result-screen";
import { getPasswordResetEmailRedirectUrl } from "@/lib/auth-redirect";

/** Supabase のエラー内容に応じた案内（redirect 不許可・レート制限など） */
function mapAuthEmailError(err: AuthError, context: "initial" | "resend" = "initial"): string {
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

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("エラーが発生しました。しばらくしてからもう一度お試しください。");
      setLoading(false);
      return;
    }

    const redirectTo = getPasswordResetEmailRedirectUrl();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: redirectTo || undefined }
    );

    setLoading(false);

    if (resetError) {
      setError(mapAuthEmailError(resetError));
      return;
    }

    setResendError(null);
    setSent(true);
  };

  const handleResend = async () => {
    setResendError(null);
    setResendLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setResendError("通信に失敗しました。時間をおいてもう一度お試しください。");
      setResendLoading(false);
      return;
    }
    const redirectTo = getPasswordResetEmailRedirectUrl();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: redirectTo || undefined }
    );
    setResendLoading(false);
    if (resetError) {
      setResendError(mapAuthEmailError(resetError, "resend"));
      return;
    }
  };

  if (sent) {
    return (
      <AuthResultScreen
        icon="mail"
        title="再設定メールを送信しました"
        description="メール内のリンクから、新しいパスワードを設定してください。"
        note="メールが届かない場合は、迷惑メールフォルダもご確認ください。"
        error={resendError ?? undefined}
      >
        <Link href="/auth" className={authResultButtonClass.primary}>
          ログイン画面に戻る
        </Link>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading}
          className={authResultButtonClass.secondary}
        >
          {resendLoading ? "送信中..." : "メールを再送する"}
        </button>
      </AuthResultScreen>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--mg-paper)] px-4 py-6 sm:py-10"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <AuthPageHeader />
      <div className="mx-auto max-w-sm rounded-2xl border border-[var(--mg-line)] bg-white p-6 shadow-[var(--mg-shadow)] sm:p-8">
        <h1 className="text-lg font-semibold text-[var(--mg-ink)] leading-tight">パスワードを再設定する</h1>
        <p className="mt-2 text-sm text-[var(--mg-muted)] leading-relaxed">
          登録済みのメールアドレスを入力してください。再設定用のメールをお送りします。
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--mg-ink)]">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="メールアドレスを入力"
              autoComplete="email"
              className="mt-2 h-12 w-full min-h-[var(--mg-touch-min)] rounded-xl border border-[var(--mg-line)] bg-[var(--mg-paper)] px-4 text-base text-[var(--mg-ink)] placeholder:text-[var(--mg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-accent)]/40"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full min-h-[var(--mg-touch-min)] items-center justify-center rounded-xl bg-[var(--mg-accent)] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "送信中..." : "再設定メールを送る"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--mg-muted)]">
          <Link href="/auth" className="underline hover:text-[var(--mg-ink)]">
            ログイン画面に戻る
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-[var(--mg-muted)]">
          <Link href="/?mode=select" className="underline hover:text-[var(--mg-ink)]">← トップへ</Link>
        </p>
      </div>
    </div>
  );
}
