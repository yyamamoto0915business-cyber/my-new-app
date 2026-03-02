"use client";

import Link from "next/link";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { OrganizerSubNav } from "./organizer-sub-nav";

const MESSAGES_HREF = "/messages";

type Props = {
  title: string;
  /** タイトル直下の説明文（任意） */
  description?: string;
  backHref?: string;
  backLabel?: string;
  /** プライマリCTA（未指定時はイベント用：新規作成） */
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
};

/** 主催者ダッシュボード用ヘッダー：主要CTA2つ + サブナビ */
export function OrganizerHeader({
  title,
  description,
  backHref = "/events",
  backLabel = "← イベント一覧へ",
  primaryCtaLabel = "新規作成",
  primaryCtaHref = "/organizer/events/new",
}: Props) {
  const unreadCount = useUnreadCount(true);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 shadow-sm backdrop-blur-sm dark:bg-[var(--background)]">
      <div className="mx-auto max-w-6xl px-4 py-4 pr-14 md:pr-16">
        {/* 上段: 戻る ＋ タイトル ＋ 主要CTA2つ */}
        {backHref && (
          <Link
            href={backHref}
            className="text-sm text-[var(--foreground-muted)] hover:underline"
          >
            {backLabel}
          </Link>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={MESSAGES_HREF}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              メッセージ
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href={primaryCtaHref}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {primaryCtaLabel}
            </Link>
          </div>
        </div>
        {/* 下段: サブナビ */}
        <OrganizerSubNav />
      </div>
    </header>
  );
}
