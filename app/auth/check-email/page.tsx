"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthResultScreen, authResultButtonClass } from "@/components/auth/auth-result-screen";
import { getSignupEmailRedirectTo } from "@/lib/site-url";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [justSentEmail, setJustSentEmail] = useState<string | null>(null);
  const hasEmail = emailFromQuery.trim().length > 0 || !!justSentEmail;
  const emailToUse = hasEmail
    ? (emailFromQuery.trim() || justSentEmail || "").toLowerCase()
    : emailInput.trim().toLowerCase();

  const handleResend = async () => {
    const email = emailToUse;
    if (!email) {
      setError("メールアドレスを入力してください。");
      return;
    }
    setError(null);
    setResendLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setResendLoading(false);
      return;
    }
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getSignupEmailRedirectTo(),
      },
    });
    setResendLoading(false);
    if (resendError) {
      setError("通信に失敗しました。時間をおいてもう一度お試しください。");
      return;
    }
    if (!hasEmail) {
      setJustSentEmail(email);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", `/auth/check-email?email=${encodeURIComponent(email)}`);
      }
    }
  };

  return (
    <AuthResultScreen
      icon="mail"
      title={hasEmail ? "確認メールを送信しました" : "確認メールを再送する"}
      description={
        hasEmail
          ? "入力したメールアドレスに確認メールを送りました。メール内のリンクを開いて登録を完了してください。"
          : "登録に使ったメールアドレスを入力してください。確認メールを再送します。"
      }
      note={hasEmail ? "メールが届かない場合は、迷惑メールフォルダもご確認ください。" : undefined}
      error={error ?? undefined}
    >
      {!hasEmail && (
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="メールアドレスを入力"
          className="h-12 w-full min-h-[var(--mg-touch-min)] rounded-xl border border-[var(--mg-line)] bg-[var(--mg-paper)] px-4 text-base text-[var(--mg-ink)] placeholder:text-[var(--mg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-accent)]/40"
        />
      )}
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

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--mg-paper)]">
          <p className="text-sm text-[var(--mg-muted)]">読み込み中...</p>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
