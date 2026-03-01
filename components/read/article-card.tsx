"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReadArticle } from "@/lib/read-article-types";

type Props = { article: ReadArticle };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** note 風の記事カード（一覧用） */
export function ArticleCard({ article }: Props) {
  return (
    <Link
      href={`/read/${article.slug}`}
      className="block overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-all hover:border-[var(--accent)]/50 hover:shadow-md dark:bg-[var(--background)]"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={article.coverImageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
      </div>
      <div className="p-5">
        {article.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
          {article.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
          {article.lead}
        </p>
        <div className="mt-4 flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
          <span>{article.authorName}</span>
          <span>{formatDate(article.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
