"use client";

import Link from "next/link";

type Props = {
  title: string;
  /** 右上のリンクhref（続きがある棚だけ表示） */
  href?: string;
  /** リンクラベル（省略時は「すべて見る」） */
  linkLabel?: string;
  /** サブテキスト */
  subtitle?: string;
  /** 見出し横の小バッジ（例：選択中カテゴリ） */
  badge?: string;
};

export function SectionHeader({ title, href, subtitle, badge, linkLabel }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-zinc-100 sm:text-lg">
            {title}
          </h2>
          {badge && (
            <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-[var(--background)] dark:text-zinc-400">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 pt-0.5 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          {linkLabel ?? "すべて見る"} →
        </Link>
      )}
    </div>
  );
}
