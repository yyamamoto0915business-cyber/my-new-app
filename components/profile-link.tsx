"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

export function ProfileLink() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  if (AUTH_DISABLED) return null;

  const btnClass =
    "inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

  if (loading) return null;

  if (!user) {
    return (
      <Link href={`/auth?next=${encodeURIComponent("/profile")}`} className={btnClass}>
        ログイン
      </Link>
    );
  }

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link href="/profile" className={btnClass}>
        マイページ
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        ログアウト
      </button>
    </div>
  );
}
