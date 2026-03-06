"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signUpWithEmail } from "@/app/auth/actions";

type Tab = "login" | "signup";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? searchParams.get("returnTo") ?? searchParams.get("redirect") ?? searchParams.get("callbackUrl");
  const returnTo = nextParam && nextParam !== "/auth" && !nextParam.startsWith("/auth") ? nextParam : "/";
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(tabParam === "signup" ? "signup" : "login");

  useEffect(() => {
    if (tabParam === "signup") setTab("signup");
    else if (tabParam === "login" || !tabParam) setTab("login");
  }, [tabParam]);

  const switchTab = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    if (t === "signup") url.searchParams.set("tab", "signup");
    else url.searchParams.delete("tab");
    window.history.replaceState({}, "", url.pathname + url.search);
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("エラーが発生しました。しばらくしてからもう一度お試しください。");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("メールアドレスの確認がまだ完了していません。確認メールをご確認ください");
      } else {
        setError("エラーが発生しました。しばらくしてからもう一度お試しください。");
      }
      return;
    }

    router.push(returnTo);
    router.refresh();
  };

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupLoading(true);

    const result = await signUpWithEmail({
      email: signupEmail.trim().toLowerCase(),
      password: signupPassword,
      displayName: displayName.trim() || undefined,
    });

    setSignupLoading(false);

    if (!result.ok) {
      setSignupError(result.message ?? "エラーが発生しました。しばらくしてからもう一度お試しください。");
      return;
    }

    router.push(`/auth/check-email?email=${encodeURIComponent(signupEmail.trim().toLowerCase())}`);
  };

  return (
    <div
      className="min-h-screen bg-[var(--mg-paper)] px-4 py-6 sm:py-10"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <header className="mx-auto mb-6 max-w-sm sm:mb-8">
        <Link
          href="/?mode=select"
          className="inline-flex items-center text-sm text-[var(--mg-muted)] hover:text-[var(--mg-ink)]"
        >
          ← トップへ
        </Link>
        <h1
          className="mt-3 text-xl font-semibold tracking-tight text-[var(--mg-ink)] sm:text-2xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          MachiGlyph
        </h1>
        <p className="mt-0.5 text-sm text-[var(--mg-muted)] leading-relaxed">
          まちの出来事に出会う
        </p>
      </header>

      <div className="mx-auto max-w-sm rounded-2xl border border-[var(--mg-line)] bg-white shadow-[var(--mg-shadow)] overflow-hidden">
        <div className="flex border-b border-[var(--mg-line)]">
          <button
            type="button"
            onClick={() => switchTab("login")}
            className="flex-1 py-4 text-sm font-medium transition-colors min-h-[var(--mg-touch-min)] flex items-center justify-center"
            style={{
              color: tab === "login" ? "var(--mg-ink)" : "var(--mg-muted)",
              borderBottom: tab === "login" ? "2px solid var(--mg-accent)" : "2px solid transparent",
            }}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => switchTab("signup")}
            className="flex-1 py-4 text-sm font-medium transition-colors min-h-[var(--mg-touch-min)] flex items-center justify-center"
            style={{
              color: tab === "signup" ? "var(--mg-ink)" : "var(--mg-muted)",
              borderBottom: tab === "signup" ? "2px solid var(--mg-accent)" : "2px solid transparent",
            }}
          >
            新規登録
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="auth-email" className="block text-sm font-medium text-[var(--mg-ink)]">
                  メールアドレス
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="メールアドレスを入力"
                  autoComplete="email"
                  className="mt-2 h-12 w-full min-h-[var(--mg-touch-min)] rounded-xl border border-[var(--mg-line)] bg-[var(--mg-paper)] px-4 text-base text-[var(--mg-ink)] placeholder:text-[var(--mg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-accent)]/40"
                />
              </div>
              <div>
                <label htmlFor="auth-password" className="block text-sm font-medium text-[var(--mg-ink)]">
                  パスワード
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="パスワードを入力"
                  autoComplete="current-password"
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
                {loading ? "ログイン中..." : "ログイン"}
              </button>
              <p className="text-center text-sm text-[var(--mg-muted)] leading-relaxed">
                <Link href="/auth/reset-password" className="underline hover:text-[var(--mg-ink)]">
                  パスワードを忘れた方はこちら
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-[var(--mg-ink)]">
                  メールアドレス
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  placeholder="メールアドレスを入力"
                  autoComplete="email"
                  className="mt-2 h-12 w-full min-h-[var(--mg-touch-min)] rounded-xl border border-[var(--mg-line)] bg-[var(--mg-paper)] px-4 text-base text-[var(--mg-ink)] placeholder:text-[var(--mg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-accent)]/40"
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-[var(--mg-ink)]">
                  パスワード
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="8文字以上で入力"
                  autoComplete="new-password"
                  className="mt-2 h-12 w-full min-h-[var(--mg-touch-min)] rounded-xl border border-[var(--mg-line)] bg-[var(--mg-paper)] px-4 text-base text-[var(--mg-ink)] placeholder:text-[var(--mg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-accent)]/40"
                />
                <p className="mt-1.5 text-xs text-[var(--mg-muted)] leading-relaxed">
                  登録後、確認メールをお送りします
                </p>
              </div>
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-[var(--mg-ink)]">
                  表示名（任意）
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例: 山田 太郎"
                  className="mt-2 h-12 w-full min-h-[var(--mg-touch-min)] rounded-xl border border-[var(--mg-line)] bg-[var(--mg-paper)] px-4 text-base text-[var(--mg-ink)] placeholder:text-[var(--mg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-accent)]/40"
                />
              </div>
              {signupError && (
                <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{signupError}</p>
              )}
              <button
                type="submit"
                disabled={signupLoading}
                className="flex h-12 w-full min-h-[var(--mg-touch-min)] items-center justify-center rounded-xl bg-[var(--mg-accent)] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {signupLoading ? "送信中..." : "確認メールを送る"}
              </button>
              <p className="text-center text-sm text-[var(--mg-muted)] leading-relaxed">
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="underline hover:text-[var(--mg-ink)]"
                >
                  すでに登録済みの方はこちら
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-sm text-center text-sm text-[var(--mg-muted)]">
        <Link href="/?mode=select" className="underline hover:text-[var(--mg-ink)]">
          ← トップへ
        </Link>
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--mg-paper)]">
          <p className="text-sm text-[var(--mg-muted)]">読み込み中...</p>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
