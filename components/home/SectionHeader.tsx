"use client";

import Link from "next/link";

type Props = {
  title: string;
  /** 右上「すべて見る→」のhref（続きがある棚だけ表示） */
  href?: string;
  /** サブテキスト */
  subtitle?: string;
  /** 見出し横の小バッジ（例：選択中カテゴリ） */
  badge?: string;
};

export function SectionHeader({ title, href, subtitle, badge }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
            {title}
          </h2>
          {badge && (
            <span className="rounded-md border border-[var(--border)] bg-white/80 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-[var(--background)] dark:text-zinc-400">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 pt-0.5 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          すべて見る →
        </Link>
      )}
    </div>
  );
}
