"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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

    const recoverSessionFromServer = async (): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth/bootstrap", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) return false;
        const data = (await res.json()) as {
          session: { access_token: string; refresh_token: string } | null;
        };
        if (!data.session?.access_token || !data.session.refresh_token) return false;
        const { error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (error) return false;
        const {
          data: { user: u },
        } = await supabase.auth.getUser();
        if (u) {
          setUser(u);
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    };

    const init = async () => {
      try {
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
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          return;
        }

        if (await recoverSessionFromServer()) {
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (AUTH_DISABLED) {
    return { user: null, loading: false };
  }

  return { user, loading };
}
