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

  const btnClass =
    "inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

  if (!loggedIn) {
    return (
      <Link href={`/login?returnTo=${encodeURIComponent("/profile")}`} className={btnClass}>
        ログイン
      </Link>
    );
  }

  return (
    <Link href="/profile" className={btnClass}>
      マイページ
    </Link>
  );
}
