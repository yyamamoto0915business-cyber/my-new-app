"use client";

import Link from "next/link";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

export default function MessagesPage() {
  const { user, loading: authLoading } = useSupabaseUser();

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (!user && !AUTH_DISABLED) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-zinc-600 dark:text-zinc-400">
          ログインするとメッセージを利用できます
        </p>
        <Link
          href={`/auth?next=/messages`}
          className="text-[var(--accent)] underline underline-offset-2"
        >
          ログイン
        </Link>
      </div>
    );
  }

  // PC: 2カラム時は右にプレースホルダー / スマホ: 一覧のみでこのページは表示されにくい（一覧クリックで [id] へ）
  return (
    <div className="hidden min-h-[50vh] items-center justify-center md:flex">
      <div className="text-center text-zinc-500">
        <p className="text-sm">会話を選択してください</p>
      </div>
    </div>
  );
}
