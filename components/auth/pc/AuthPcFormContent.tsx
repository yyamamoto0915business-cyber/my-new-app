"use client";

import Link from "next/link";
import { ChevronRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { AuthPcFormShell } from "./AuthPcFormShell";

type Tab = "login" | "signup";

type Props = {
  tab: Tab;
  switchTab: (tab: Tab) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  error: string | null;
  loading: boolean;
  handleLogin: (e: React.FormEvent) => void;
  signupEmail: string;
  setSignupEmail: (v: string) => void;
  signupPassword: string;
  setSignupPassword: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  signupError: string | null;
  signupLoading: boolean;
  agreedToTerms: boolean;
  setAgreedToTerms: (v: boolean) => void;
  website: string;
  setWebsite: (v: string) => void;
  onCaptchaToken: (token: string | null) => void;
  captchaResetKey: number;
  handleSignup: (e: React.FormEvent) => void;
  googleLoading: boolean;
  handleGoogleLogin: () => void;
};

const inputClass =
  "h-10 w-full rounded-[10px] border border-[#d8e0da] bg-white px-3.5 text-[13px] text-[#1e3828] placeholder:text-[#9aab9f] focus-visible:border-[#7aab8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4e8d8]";

export function AuthPcFormContent({
  tab,
  switchTab,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  error,
  loading,
  handleLogin,
  signupEmail,
  setSignupEmail,
  signupPassword,
  setSignupPassword,
  displayName,
  setDisplayName,
  signupError,
  signupLoading,
  agreedToTerms,
  setAgreedToTerms,
  website,
  setWebsite,
  onCaptchaToken,
  captchaResetKey,
  handleSignup,
  googleLoading,
  handleGoogleLogin,
}: Props) {
  const isLogin = tab === "login";

  return (
    <AuthPcFormShell isLogin={isLogin}>
      {isLogin ? (
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label
              htmlFor="auth-pc-email"
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#1e3828]"
            >
              <Mail className="h-3.5 w-3.5 text-[#6a9080]" aria-hidden />
              メールアドレス
            </label>
            <input
              id="auth-pc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="メールアドレスを入力"
              autoComplete="email"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label
              htmlFor="auth-pc-password"
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#1e3828]"
            >
              <Lock className="h-3.5 w-3.5 text-[#6a9080]" aria-hidden />
              パスワード
            </label>
            <div className="relative mt-1.5">
              <input
                id="auth-pc-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="パスワードを入力"
                autoComplete="current-password"
                className={`pr-11 ${inputClass}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9a90] hover:text-[#3d5c48]"
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm leading-relaxed text-red-600">{error}</p>
          )}

          <TurnstileWidget
            key={`login-${captchaResetKey}`}
            onToken={onCaptchaToken}
            className="flex justify-center"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center gap-1 rounded-[10px] bg-gradient-to-r from-[#2a5540] via-[#315f48] to-[#3a6b50] px-4 text-[13px] font-medium text-white shadow-[0_6px_18px_rgba(42,85,64,0.28)] transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "ログイン中..." : "ログインする"}
            {!loading && <ChevronRight className="h-4 w-4" aria-hidden />}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e8ebe6]" />
            <span className="text-[12px] text-[#8a9a90]">または</span>
            <div className="h-px flex-1 bg-[#e8ebe6]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="flex h-10 w-full items-center justify-center gap-2.5 rounded-[10px] border border-[#d8e0da] bg-white text-[13px] font-medium text-[#1e3828] transition hover:bg-[#fafaf8] disabled:opacity-60"
          >
            <GoogleIcon />
            {googleLoading ? "接続中..." : "Googleでログイン"}
          </button>

          <div className="space-y-2 pt-0.5 text-center text-[13px]">
            <p>
              <Link
                href="/auth/reset-password"
                className="text-[#5a7464] underline underline-offset-2 hover:text-[#1e3828]"
              >
                パスワードを忘れた方はこちら
              </Link>
            </p>
            <p className="text-[#5a7464]">
              はじめての方はこちら{" "}
              <button
                type="button"
                onClick={() => switchTab("signup")}
                className="font-semibold text-[#1e3828] underline underline-offset-2 hover:text-[#2d5a43]"
              >
                新規登録へ
                <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" aria-hidden />
              </button>
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-3">
          {/* ボット用ハニーポット（視覚的に隠す） */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
          >
            <label htmlFor="auth-pc-signup-website">Website</label>
            <input
              id="auth-pc-signup-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="auth-pc-signup-name"
              className="block text-[13px] font-medium text-[#1e3828]"
            >
              表示名（任意）
            </label>
            <input
              id="auth-pc-signup-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名を入力"
              maxLength={40}
              className={`mt-1.5 h-[42px] ${inputClass}`}
            />
          </div>

          <div>
            <label
              htmlFor="auth-pc-signup-email"
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#1e3828]"
            >
              <Mail className="h-3.5 w-3.5 text-[#6a9080]" aria-hidden />
              メールアドレス
            </label>
            <input
              id="auth-pc-signup-email"
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
              placeholder="メールアドレスを入力"
              autoComplete="email"
              className={`mt-1.5 h-[42px] ${inputClass}`}
            />
          </div>

          <div>
            <label
              htmlFor="auth-pc-signup-password"
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#1e3828]"
            >
              <Lock className="h-3.5 w-3.5 text-[#6a9080]" aria-hidden />
              パスワード
            </label>
            <input
              id="auth-pc-signup-password"
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              minLength={8}
              placeholder="パスワードを設定"
              autoComplete="new-password"
              className={`mt-1.5 h-[42px] ${inputClass}`}
            />
            <p className="mt-1 text-[11px] leading-relaxed text-[#8a9a90]">
              登録後、確認メールをお送りします。
            </p>
          </div>

          {signupError && (
            <p className="text-sm leading-relaxed text-red-600">{signupError}</p>
          )}

          <div className="rounded-xl border border-[#e8ebe6] bg-[#f8faf8] p-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c8dcd0]"
              />
              <span className="text-[12px] leading-relaxed text-[#3d5c48]">
                <Link href="/terms" target="_blank" className="font-medium underline underline-offset-2">
                  利用規約
                </Link>
                と
                <Link href="/privacy" target="_blank" className="font-medium underline underline-offset-2">
                  プライバシーポリシー
                </Link>
                に同意する
              </span>
            </label>
          </div>

          <TurnstileWidget
            key={`signup-${captchaResetKey}`}
            onToken={onCaptchaToken}
            className="flex justify-center"
          />

          <button
            type="submit"
            disabled={signupLoading || !agreedToTerms}
            className="flex h-[42px] w-full items-center justify-center gap-1 rounded-[10px] bg-gradient-to-r from-[#2a5540] via-[#315f48] to-[#3a6b50] px-4 text-[13px] font-medium text-white shadow-[0_6px_18px_rgba(42,85,64,0.28)] transition hover:opacity-95 disabled:opacity-60"
          >
            {signupLoading ? "登録しています..." : "登録してはじめる"}
            {!signupLoading && <ChevronRight className="h-4 w-4" aria-hidden />}
          </button>

          <p className="pt-1 text-center text-[13px] text-[#5a7464]">
            すでにアカウントをお持ちの方はこちら{" "}
            <button
              type="button"
              onClick={() => switchTab("login")}
              className="font-semibold text-[#1e3828] underline underline-offset-2 hover:text-[#2d5a43]"
            >
              ログインへ
            </button>
          </p>
        </form>
      )}
    </AuthPcFormShell>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
