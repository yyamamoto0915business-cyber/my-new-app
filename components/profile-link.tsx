"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

export function ProfileLink() {
  const { data: session, status } = useSession();

  // 開発中: ログイン機能をオフにしている場合は何も表示しない
  if (AUTH_DISABLED) return null;

  const btnClass =
    "inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <Link href={`/login?returnTo=${encodeURIComponent("/profile")}`} className={btnClass}>
        ログイン
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/profile" className={btnClass}>
        マイページ
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        ログアウト
      </button>
    </div>
  );
}
