"use client";

import Link from "next/link";

export type BoardPostCategory = "イベント" | "募集" | "ストーリー" | "お知らせ";

type Props = {
  category: BoardPostCategory;
  title: string;
  sub: string;
  href: string;
};

const CATEGORY_STYLES: Record<BoardPostCategory, string> = {
  イベント: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  募集: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  ストーリー: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  お知らせ: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
};

/** 掲示板風投稿カード（貼り紙の雰囲気・清潔に） */
export function BoardPostCard({ category, title, sub, href }: Props) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)]"
    >
      <div className="min-w-0 flex-1">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[category]}`}
        >
          {category}
        </span>
        <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
          {title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-[var(--foreground-muted)]">{sub}</p>
      </div>
      <span className="shrink-0 text-sm font-medium text-[var(--accent)] group-hover:underline">
        見る →
      </span>
    </Link>
  );
}
