"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthMobileFormShell, FIELD_ICON_OFFSET, FIELD_ICON_OFFSET_COMPACT } from "./AuthMobileFormShell";

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
  handleSignup: (e: React.FormEvent) => void;
};

const labelClass = `mb-1.5 block ${FIELD_ICON_OFFSET} text-[13px] font-medium text-[#1e3828]`;

const inputClass =
  "h-12 w-full rounded-2xl border border-[#d8e0da] bg-white px-4 text-[14px] text-[#1e3828] shadow-sm placeholder:text-[#9aab9f] focus-visible:border-[#b8ccc0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4efe8]";

const inputClassCompact =
  "h-11 w-full rounded-2xl border border-[#d8e0da] bg-white px-3.5 text-[13px] text-[#1e3828] shadow-sm placeholder:text-[#9aab9f] focus-visible:border-[#b8ccc0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4efe8]";

function FieldIconCircle({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#e8f2ec] text-[#3d6b50]",
        compact ? "h-10 w-10" : "h-11 w-11"
      )}
    >
      {children}
    </span>
  );
}

function FieldRow({
  label,
  htmlFor,
  icon,
  children,
  compact,
}: {
  label: string;
  htmlFor: string;
  icon: ReactNode;
  children: ReactNode;
  compact?: boolean;
}) {
  const labelCls = compact
    ? `mb-1 block ${FIELD_ICON_OFFSET_COMPACT} text-[12px] font-medium text-[#1e3828]`
    : labelClass;

  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      <div className={cn("flex items-center", compact ? "gap-2" : "gap-2.5")}>
        <FieldIconCircle compact={compact}>{icon}</FieldIconCircle>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function SubmitButton({
  loading,
  label,
  loadingLabel,
  disabled,
  compact,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={cn(
        "relative flex w-full items-center overflow-hidden rounded-full bg-gradient-to-r from-[#2a5540] via-[#3a6b50] to-[#5a9a72] pl-3 pr-4 font-semibold text-white shadow-[0_8px_22px_rgba(42,85,64,0.25)] transition hover:opacity-95 disabled:opacity-60",
        compact ? "h-11 text-[14px]" : "h-12 text-[15px]"
      )}
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-16 overflow-hidden opacity-50">
        <span className="relative block h-full w-full">
          <Image
            src="/auth/icon-support-leaf.jpg"
            alt=""
            fill
            unoptimized
            sizes="64px"
            className="object-cover"
          />
        </span>
      </span>
      <span className="relative z-10 flex-1 text-center">
        {loading ? loadingLabel : label}
      </span>
      {!loading && (
        <ChevronRight className="relative z-10 h-5 w-5 shrink-0" aria-hidden />
      )}
    </button>
  );
}

const footerLinkClass =
  "font-semibold text-[#2d5a43] underline underline-offset-2 hover:text-[#1e3828]";

export function AuthMobileFormContent({
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
  handleSignup,
}: Props) {
  const isLogin = tab === "login";

  return (
    <AuthMobileFormShell tab={tab} switchTab={switchTab}>
      {isLogin ? (
        <form onSubmit={handleLogin} className="space-y-3">
          <FieldRow
            label="メールアドレス"
            htmlFor="auth-mobile-email"
            icon={<Mail className="h-4 w-4" aria-hidden />}
          >
            <input
              id="auth-mobile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="メールアドレスを入力"
              autoComplete="email"
              className={inputClass}
            />
          </FieldRow>

          <FieldRow
            label="パスワード"
            htmlFor="auth-mobile-password"
            icon={<Lock className="h-4 w-4" aria-hidden />}
          >
            <div className="relative">
              <input
                id="auth-mobile-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="パスワードを入力"
                autoComplete="current-password"
                className={`${inputClass} pr-11`}
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
          </FieldRow>

          {error && (
            <p className="text-sm leading-relaxed text-red-600">{error}</p>
          )}

          <SubmitButton loading={loading} label="ログインする" loadingLabel="ログイン中..." />

          <div className="space-y-2 pt-1 text-center text-[13px]">
            <p className="text-[#5a7464]">
              はじめての方はこちら{" "}
              <button type="button" onClick={() => switchTab("signup")} className={footerLinkClass}>
                新規登録へ
                <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" aria-hidden />
              </button>
            </p>
            <p>
              <Link href="/auth/reset-password" className={footerLinkClass}>
                パスワードを忘れた方はこちら
                <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" aria-hidden />
              </Link>
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-2.5">
          <div>
            <label htmlFor="auth-mobile-signup-name" className="mb-1 block text-[12px] font-medium text-[#1e3828]">
              表示名（任意）
            </label>
            <input
              id="auth-mobile-signup-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名を入力"
              className={inputClassCompact}
            />
          </div>

          <FieldRow
            label="メールアドレス"
            htmlFor="auth-mobile-signup-email"
            icon={<Mail className="h-4 w-4" aria-hidden />}
            compact
          >
            <input
              id="auth-mobile-signup-email"
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
              placeholder="メールアドレスを入力"
              autoComplete="email"
              className={inputClassCompact}
            />
          </FieldRow>

          <FieldRow
            label="パスワード"
            htmlFor="auth-mobile-signup-password"
            icon={<Lock className="h-4 w-4" aria-hidden />}
            compact
          >
            <input
              id="auth-mobile-signup-password"
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              minLength={8}
              placeholder="パスワードを設定"
              autoComplete="new-password"
              className={inputClassCompact}
            />
          </FieldRow>
          <p className={`${FIELD_ICON_OFFSET_COMPACT} text-[10px] leading-snug text-[#8a9a90]`}>
            登録後、確認メールをお送りします。
          </p>

          {signupError && (
            <p className="text-sm leading-relaxed text-red-600">{signupError}</p>
          )}

          <div className="rounded-2xl border border-[#e8ebe6] bg-white/90 p-2">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c8dcd0]"
              />
              <span className="text-[11px] leading-snug text-[#3d5c48]">
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

          <SubmitButton
            loading={signupLoading}
            label="登録してはじめる"
            loadingLabel="登録中..."
            disabled={!agreedToTerms}
            compact
          />

          <p className="pt-1.5 text-center text-[12px] text-[#5a7464]">
            すでにアカウントをお持ちの方はこちら{" "}
            <button type="button" onClick={() => switchTab("login")} className={footerLinkClass}>
              ログインへ
            </button>
          </p>
        </form>
      )}
    </AuthMobileFormShell>
  );
}
