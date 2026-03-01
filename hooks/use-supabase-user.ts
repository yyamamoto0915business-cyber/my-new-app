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

    const init = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
      setLoading(false);
    };

    init();

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
