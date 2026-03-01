"use client";

import Link from "next/link";

export default function ProfileSettingsPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link
        href="/profile"
        className="mb-6 inline-block text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← マイページへ
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        通知設定
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        お知らせの受け取り方を設定できます（準備中）
      </p>
      <div className="mt-8 rounded-xl border border-[var(--border)] bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900/90">
        <p className="text-sm text-[var(--foreground-muted)]">
          通知設定は準備中です。しばらくお待ちください。
        </p>
      </div>
    </div>
  );
}
