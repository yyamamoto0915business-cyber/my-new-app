"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signUpWithEmail } from "@/app/auth/actions";
import { AuthPcPageLayout } from "@/components/auth/pc/AuthPcPageLayout";
import { AuthPcHeroPanel } from "@/components/auth/pc/AuthPcHeroPanel";
import { AuthPcFormContent } from "@/components/auth/pc/AuthPcFormContent";
import { AuthMobileBackground } from "@/components/auth/mobile/AuthMobileBackground";
import { AuthMobileFormContent } from "@/components/auth/mobile/AuthMobileFormContent";

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isAbortLikeError = (err: unknown): boolean => {
    if (err instanceof DOMException && err.name === "AbortError") return true;
    if (err instanceof Error) {
      return (
        err.name === "AbortError" ||
        /aborted/i.test(err.message) ||
        /operation was aborted/i.test(err.message)
      );
    }
    if (typeof err === "object" && err !== null && "name" in err) {
      return String((err as { name?: unknown }).name) === "AbortError";
    }
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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

      if (signInError) {
        setLoading(false);
        if (signInError.message.includes("Invalid login credentials")) {
          setError("メールアドレスまたはパスワードが正しくありません");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("メールアドレスの確認がまだ完了していません。確認メールをご確認ください");
        } else {
          setError("エラーが発生しました。しばらくしてからもう一度お試しください。");
        }
        return;
      }

      try {
        await supabase.auth.getSession();
      } catch (sessionErr) {
        if (!isAbortLikeError(sessionErr)) {
          console.warn("getSession failed after sign-in:", sessionErr);
        }
      }

      window.location.assign(returnTo);
    } catch (err) {
      if (isAbortLikeError(err)) {
        window.location.assign(returnTo);
        return;
      }
      setLoading(false);
      setError("通信が途中で中断されました。時間をおいて、もう一度お試しください。");
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError("エラーが発生しました。しばらくしてからもう一度お試しください。");
        setGoogleLoading(false);
        return;
      }

      const redirectTo = new URL("/auth/callback", window.location.origin);
      if (returnTo !== "/") {
        redirectTo.searchParams.set("next", returnTo);
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      });

      if (oauthError) {
        setGoogleLoading(false);
        setError("Googleログインを開始できませんでした。しばらくしてからもう一度お試しください。");
      }
    } catch {
      setGoogleLoading(false);
      setError("Googleログインを開始できませんでした。しばらくしてからもう一度お試しください。");
    }
  };

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setSignupError("利用規約とプライバシーポリシーへの同意が必要です。");
      return;
    }
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

  const formProps = {
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
    googleLoading,
    handleGoogleLogin,
  };

  return (
    <>
      <AuthMobileBackground />
      {/* PC: 上部ナビ＋左サイドバー内に収める（fixed だと入場アニメの transform で下端が切れる） */}
      <div className="relative z-[10] hidden min-h-0 min-[900px]:ml-20 min-[900px]:mt-[var(--mg-pc-top-nav-h)] min-[900px]:flex min-[900px]:h-[calc(100dvh-var(--mg-pc-top-nav-h))] min-[900px]:w-[calc(100%-5rem)]">
        <AuthPcPageLayout>
          <AuthPcHeroPanel />
          <AuthPcFormContent {...formProps} />
        </AuthPcPageLayout>
      </div>

      {/* モバイル: 水彩背景 + 新デザインフォーム（新規登録時は縦スクロール） */}
      <div
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain min-[900px]:hidden"
        style={{
          scrollPaddingBottom:
            "calc(80px + 2.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <AuthMobileFormContent {...formProps} />
      </div>
    </>
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
