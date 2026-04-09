"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncSupabaseSessionFromServer } from "@/lib/supabase/sync-session-from-server";
import type { User } from "@supabase/supabase-js";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

export type SupabaseUserState = {
  user: User | null;
  loading: boolean;
};

/**
 * Supabase Auth のユーザー状態を取得するフック
 */
export function useSupabaseUser(): SupabaseUserState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    /** Cookie 反映や RSC 遷移のタイミングで 1 回目が空でも、サーバーはセッションを持っていることがある */
    const recoverSessionFromServerWithRetries = async (): Promise<boolean> => {
      const delays = [0, 120, 400];
      for (const ms of delays) {
        if (ms > 0) {
          await new Promise((r) => setTimeout(r, ms));
        }
        if (await syncSupabaseSessionFromServer(supabase)) {
          const {
            data: { user: u },
          } = await supabase.auth.getUser();
          if (u) {
            setUser(u);
            return true;
          }
        }
      }
      return false;
    };

    /**
     * Supabase クライアントが一時的に user を返せないときに、
     * サーバー判定（cookie ベース）でログイン状態を補完する。
     */
    const recoverUserFromApiWithRetries = async (): Promise<boolean> => {
      const delays = [0, 120, 400];
      for (const ms of delays) {
        if (ms > 0) {
          await new Promise((r) => setTimeout(r, ms));
        }
        try {
          const res = await fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
          });
          if (!res.ok) continue;
          const data = (await res.json()) as {
            user?: { id?: string; email?: string | null; name?: string | null } | null;
          };
          const apiUser = data?.user;
          if (apiUser?.id) {
            const fallbackUser = {
              id: apiUser.id,
              email: apiUser.email ?? null,
              user_metadata: {
                display_name: apiUser.name ?? apiUser.email?.split("@")[0] ?? null,
                name: apiUser.name ?? null,
              },
              app_metadata: {},
              aud: "authenticated",
              created_at: new Date(0).toISOString(),
            } as unknown as User;
            setUser(fallbackUser);
            return true;
          }
        } catch {
          // ignore and retry
        }
      }
      return false;
    };

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          return;
        }

        try {
          const {
            data: { user: u },
          } = await supabase.auth.getUser();
          if (u) {
            setUser(u);
            return;
          }
        } catch {
          // ページ遷移・Fast Refresh 等で内部 fetch が中断されると AbortError になり得る
        }

        if (await recoverSessionFromServerWithRetries()) {
          return;
        }

        if (await recoverUserFromApiWithRetries()) {
          return;
        }

        setUser(null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        return;
      }
      setUser((prev) => session?.user ?? prev);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (AUTH_DISABLED) {
    return { user: null, loading: false };
  }

  return { user, loading };
}
