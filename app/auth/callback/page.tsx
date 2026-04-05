"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { sessionIsPasswordRecovery } from "@/lib/auth-session";
import { AuthPageHeader } from "@/components/auth/auth-result-screen";

function recoveryFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (hashParams.get("type") === "recovery") return true;
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("type") === "recovery") return true;
  // PKCE 交換後も code だけ消えて残る（GoTrue が recovery をコールバックに載せないための明示フラグ）
  if (searchParams.get("flow") === "recovery") return true;
  return false;
}

/** PKCE 交換前に古いセッションで誤遷移しないよう、code 付きの間は同期 getSession を使わない */
function hasPkceCodeInUrl(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("code");
}

/**
 * メール内リンクの受け口（互換・旧 redirectTo 用）。
 * PKCE の再設定では hash に type がなく SIGNED_IN のみ届くことがあるため、
 * sessionIsPasswordRecovery で JWT を見る。
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.replace("/auth/error");
      return;
    }

    let redirected = false;
    const go = (path: string) => {
      if (redirected) return;
      redirected = true;
      router.replace(path);
    };

    const routeAfterSession = (session: Session | null) => {
      if (recoveryFromUrl()) {
        if (session) {
          go("/auth/update-password");
        }
        return;
      }
      if (!session) return;
      if (sessionIsPasswordRecovery(session)) {
        go("/auth/update-password");
        return;
      }
      go("/auth/verified");
      router.refresh();
    };

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        go("/auth/update-password");
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        if (event === "INITIAL_SESSION" && hasPkceCodeInUrl()) {
          return;
        }
        routeAfterSession(session);
      }
    });

    void (async () => {
      if (typeof window !== "undefined" && window.location.hash) {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        if (params.get("error")) {
          go("/auth/error");
          return;
        }
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        go("/auth/error");
        return;
      }

      if (session && !redirected && !hasPkceCodeInUrl()) {
        routeAfterSession(session);
      }
    })();

    timeoutId = setTimeout(() => {
      if (redirected) return;
      void (async () => {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        if (redirected) return;
        if (s) {
          routeAfterSession(s);
        } else {
          go("/auth/error");
        }
      })();
    }, 5000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
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
