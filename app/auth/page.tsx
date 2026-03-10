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

  const isLogin = tab === "login";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFCF7] via-white to-[#F8FAFC] px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-md items-center justify-center">
        <section className="w-full">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="absolute left-[-40px] top-[40px] h-32 w-32 rounded-full bg-amber-100/40 blur-3xl" />
              <div className="absolute right-[-32px] top-[16px] h-28 w-28 rounded-full bg-sky-100/40 blur-3xl" />
            </div>

            <div className="relative space-y-6">
              <header>
                <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium tracking-wide text-slate-600 shadow-sm">
                  MachiGlyph
                </span>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  {isLogin ? "ログイン" : "はじめて利用する"}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {isLogin
                    ? "続きから、地域のイベントや活動を見つけられます"
                    : "イベント参加も、活動の主催も、ここから始められます"}
                </p>
              </header>

              <div className="rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-600">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => switchTab("login")}
                    className={`flex h-9 items-center justify-center rounded-full transition-colors ${
                      isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    ログイン
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab("signup")}
                    className={`flex h-9 items-center justify-center rounded-full transition-colors ${
                      !isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    はじめて利用する
                  </button>
                </div>
              </div>

              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label htmlFor="auth-email" className="block text-sm font-medium text-slate-900">
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
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-password" className="block text-sm font-medium text-slate-900">
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
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
                    />
                  </div>
                  {error && (
                    <p className="text-sm leading-relaxed text-red-600">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--mg-accent)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {loading ? "ログイン中..." : "ログインする"}
                  </button>
                  <div className="space-y-2 pt-1 text-center text-sm">
                    <p className="text-slate-600">
                      はじめての方はこちら{" "}
                      <button
                        type="button"
                        onClick={() => switchTab("signup")}
                        className="font-medium text-slate-800 underline underline-offset-2 hover:text-slate-900"
                      >
                        新規登録へ
                      </button>
                    </p>
                    <p className="text-slate-500">
                      <Link
                        href="/auth/reset-password"
                        className="underline underline-offset-2 hover:text-slate-700"
                      >
                        パスワードを忘れた方はこちら
                      </Link>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-5">
                  <div>
                    <label htmlFor="signup-name" className="block text-sm font-medium text-slate-900">
                      表示名（任意）
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="表示名を入力"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-email" className="block text-sm font-medium text-slate-900">
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
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-password" className="block text-sm font-medium text-slate-900">
                      パスワード
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="パスワードを設定"
                      autoComplete="new-password"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
                    />
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      登録後、確認メールをお送りします。
                    </p>
                  </div>
                  {signupError && (
                    <p className="text-sm leading-relaxed text-red-600">{signupError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--mg-accent)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {signupLoading ? "登録中..." : "登録してはじめる"}
                  </button>
                  <div className="pt-1 text-center text-sm text-slate-600">
                    すでにアカウントをお持ちの方はこちら{" "}
                    <button
                      type="button"
                      onClick={() => switchTab("login")}
                      className="font-medium text-slate-800 underline underline-offset-2 hover:text-slate-900"
                    >
                      ログインへ
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link
              href="/welcome"
              className="underline underline-offset-2 hover:text-slate-700"
            >
              welcome に戻る
            </Link>
          </p>
        </section>
      </div>
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
