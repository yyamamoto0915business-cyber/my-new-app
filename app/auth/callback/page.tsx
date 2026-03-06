"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthPageHeader } from "@/components/auth/auth-result-screen";

/**
 * メール内リンクの受け口。認証処理のみ行い、成功/失敗で専用ページへ遷移する。
 * - 確認メール（signup）成功 → /auth/verified
 * - パスワード再設定（recovery）→ /auth/update-password
 * - エラー → /auth/error
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.replace("/auth/error");
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let subscription: { unsubscribe: () => void } | null = null;

    const run = async () => {
      let isRecovery = false;
      if (typeof window !== "undefined" && window.location.hash) {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        isRecovery = params.get("type") === "recovery";
        const error = params.get("error");
        if (error) {
          router.replace("/auth/error");
          return;
        }
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        router.replace("/auth/error");
        return;
      }

      if (session) {
        if (isRecovery) {
          router.replace("/auth/update-password");
          return;
        }
        router.replace("/auth/verified");
        router.refresh();
        return;
      }

      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && isRecovery) {
          router.replace("/auth/update-password");
          return;
        }
        if (session) {
          router.replace("/auth/verified");
          router.refresh();
        }
      });
      subscription = sub;

      timeoutId = setTimeout(async () => {
        subscription?.unsubscribe();
        subscription = null;
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s) {
          const params = new URLSearchParams(typeof window !== "undefined" ? (window.location.hash || "").replace(/^#/, "") : "");
          if (params.get("type") === "recovery") {
            router.replace("/auth/update-password");
            return;
          }
          router.replace("/auth/verified");
          router.refresh();
        } else {
          router.replace("/auth/error");
        }
      }, 4000);
    };

    run();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [router]);

  return (
    <div
      className="min-h-screen bg-[var(--mg-paper)] px-4 py-6 sm:py-10"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <AuthPageHeader />
      <div className="mx-auto max-w-sm rounded-2xl border border-[var(--mg-line)] bg-white p-6 shadow-[var(--mg-shadow)] sm:p-8">
        <p className="text-center text-sm text-[var(--mg-muted)] leading-relaxed">
          確認中...
        </p>
      </div>
    </div>
  );
}
