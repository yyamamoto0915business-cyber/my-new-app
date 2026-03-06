"use client";

import Link from "next/link";
import type { ProfileMode } from "./mode-switcher";
import { MODE_CONFIG } from "./mode-config";

type Props = {
  mode: ProfileMode;
  unreadCount?: number;
};

/** ヘッダー：タイトル＋説明＋主CTA＋メッセージボタン */
export function ModeHeader({ mode, unreadCount = 0 }: Props) {
  const config = MODE_CONFIG[mode];

  return (
    <section>
      <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
        {config.title}
      </h2>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        {config.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={config.ctaHref}
          className="inline-flex items-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-95"
        >
          {config.ctaLabel}
        </Link>
        <Link
          href="/messages"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <span>メッセージ</span>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-xs font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </section>
  );
}
