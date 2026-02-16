"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileLink() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoggedIn(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setLoggedIn(!!session?.user)
    );
    return () => subscription.unsubscribe();
  }, []);

  if (loggedIn === null) return null;

  if (!loggedIn) {
    return (
      <Link
        href={`/login?returnTo=${encodeURIComponent("/profile")}`}
        className="text-sm text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ログイン
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      className="text-sm text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      マイページ
    </Link>
  );
}
