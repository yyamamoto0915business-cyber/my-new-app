"use client";

import Link from "next/link";
import { Landmark, MessageSquare } from "lucide-react";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { cn } from "@/lib/utils";

const MESSAGES_HREF = "/messages";

type Props = {
  title: string;
  /** タイトル直下の説明文（任意） */
  description?: string;
  /** タイトルの追加クラス（任意） */
  titleClassName?: string;
  /** 説明文の追加クラス（任意） */
  descriptionClassName?: string;
  backHref?: string;
  backLabel?: string;
  /** 右上の「メッセージ」導線を表示する */
  showMessages?: boolean;
  /** プライマリCTA（未指定時はイベント用：新規作成） */
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  /** プライマリCTAを表示する（例：設定ページでは非表示にしたい） */
  showPrimaryCta?: boolean;
  /** セカンダリCTA（例：募集作成） */
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  /** サブ導線（例：売上受取設定） */
  tertiaryCtaHref?: string;
  tertiaryCtaLabel?: string;
  /** 未設定時はやや目立つスタイルにする */
  tertiaryCtaHighlight?: boolean;
};

/** 主催者ダッシュボード用ヘッダー：主要CTA2つ + サブナビ（スマホは縦並び・主ボタン全幅） */
export function OrganizerHeader({
  title,
  description,
  backHref = "/events",
  backLabel = "← イベント一覧へ",
  showMessages = true,
  primaryCtaLabel = "新規作成",
  primaryCtaHref = "/organizer/events/new",
  showPrimaryCta = true,
  secondaryCtaLabel,
  secondaryCtaHref,
  tertiaryCtaHref,
  tertiaryCtaLabel = "売上受取設定",
  tertiaryCtaHighlight,
  titleClassName,
  descriptionClassName,
}: Props) {
  const unreadCount = useUnreadCount(true);

  const tertiaryStyle = tertiaryCtaHighlight
    ? "border-amber-400/80 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-600/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-900/40"
    : "border-[var(--border)] bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800";

  const tertiaryMobileClass = cn(
    "inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 text-[13px] font-medium transition-colors",
    tertiaryStyle
  );

  const tertiaryDesktopClass = cn(
    "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
    tertiaryStyle
  );

  return (
    <header
      className={cn(
        "z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:dark:bg-slate-900/90",
        "max-sm:relative",
        "sm:sticky sm:top-16"
      )}
    >
      {/* スマホ：縦並び・主CTA優先 */}
      <div className="mx-auto max-w-6xl sm:hidden">
        <div className="px-4 py-3">
          {backHref && (
            <Link
              href={backHref}
              className="inline-block text-[13px] text-[var(--foreground-muted)] hover:underline"
            >
              {backLabel}
            </Link>
          )}
          <div className={cn("mt-2", !backHref && "mt-0")}>
            <h1
              className={cn(
                "text-[22px] font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-100",
                titleClassName
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  "mt-1.5 text-[13px] leading-relaxed text-[var(--foreground-muted)]",
                  descriptionClassName
                )}
              >
                {description}
              </p>
            )}
          </div>

          {showPrimaryCta && (
            <Link
              href={primaryCtaHref}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-4 text-[15px] font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99]"
            >
              {primaryCtaLabel}
            </Link>
          )}

          {(showMessages || tertiaryCtaHref || (secondaryCtaHref && secondaryCtaLabel)) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {showMessages && (
                <Link
                  href={MESSAGES_HREF}
                  className="inline-flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-2 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300"
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  <span className="truncate">メッセージ</span>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              {tertiaryCtaHref && (
                <Link href={tertiaryCtaHref} className={tertiaryMobileClass}>
                  <Landmark className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  <span className="truncate">{tertiaryCtaLabel}</span>
                </Link>
              )}
              {secondaryCtaHref && secondaryCtaLabel && (
                <Link
                  href={secondaryCtaHref}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[var(--border)] bg-white px-3 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {secondaryCtaLabel}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* デスクトップ：従来の横並び */}
      <div className="mx-auto hidden max-w-6xl px-4 py-4 pr-14 md:pr-16 sm:block">
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
            <h1
              className={cn(
                "text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl",
                titleClassName
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  "mt-1 text-sm text-[var(--foreground-muted)]",
                  descriptionClassName
                )}
              >
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {showMessages && (
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
            )}
            {tertiaryCtaHref && (
              <Link href={tertiaryCtaHref} className={tertiaryDesktopClass}>
                {tertiaryCtaLabel}
              </Link>
            )}
            {secondaryCtaHref && secondaryCtaLabel && (
              <Link
                href={secondaryCtaHref}
                className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {secondaryCtaLabel}
              </Link>
            )}
            {showPrimaryCta && (
              <Link
                href={primaryCtaHref}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {primaryCtaLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
