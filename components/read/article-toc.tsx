"use client";

import type { ArticleBlock } from "@/lib/read-article-types";
import { getTocFromBlocks } from "@/lib/read-article-types";

type TocItem = { id: string; text: string };

type Props = {
  blocks: ArticleBlock[];
  className?: string;
};

/** 見出しから目次を自動生成 */
export function ArticleToc({ blocks, className = "" }: Props) {
  const toc = getTocFromBlocks(blocks);
  if (toc.length === 0) return null;

  return (
    <nav
      className={`rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)] ${className}`}
      aria-label="目次"
    >
      <h2 className="mb-3 font-serif text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
        目次
      </h2>
      <ol className="space-y-2">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-sm text-zinc-600 underline decoration-[var(--accent)]/40 underline-offset-2 hover:text-[var(--accent)] hover:decoration-[var(--accent)] dark:text-zinc-400"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
