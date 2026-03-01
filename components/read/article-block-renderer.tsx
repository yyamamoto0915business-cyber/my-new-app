"use client";

import type { ArticleBlock } from "@/lib/read-article-types";
import { getTocFromBlocks } from "@/lib/read-article-types";
import { EventEmbedBlock } from "./event-embed-block";

type Props = {
  blocks: ArticleBlock[];
  /** 見出しに付与する id 用に、ブロックの index を渡すと heading に id を付与 */
  blockIndexOffset?: number;
};

function getHeadingId(blocks: ArticleBlock[], blockIndex: number): string | undefined {
  const toc = getTocFromBlocks(blocks);
  let headingCount = 0;
  for (let i = 0; i <= blockIndex; i++) {
    if (blocks[i]?.type === "heading") headingCount += 1;
  }
  return toc[headingCount - 1]?.id;
}

/** blocks JSON を note 風にレンダリング（prose 風スタイル） */
export function ArticleBlockRenderer({ blocks, blockIndexOffset = 0 }: Props) {
  if (!blocks?.length) return null;

  return (
    <div className="article-body space-y-8">
      {blocks.map((block, i) => {
        const globalIndex = blockIndexOffset + i;

        if (block.type === "heading") {
          const toc = getTocFromBlocks(blocks);
          const headingIndex = blocks.slice(0, i).filter((b) => b.type === "heading").length;
          const id = toc[headingIndex]?.id;

          return (
            <h2
              key={globalIndex}
              id={id}
              className="scroll-mt-24 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-2xl"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p
              key={globalIndex}
              className="max-w-none text-base leading-relaxed text-zinc-700 dark:text-zinc-300"
            >
              {block.text}
            </p>
          );
        }

        if (block.type === "timeline") {
          const items = block.items ?? [];
          if (items.length === 0) return null;
          return (
            <div key={globalIndex} className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
              <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                当日の流れ
              </h3>
              <ul className="space-y-3">
                {items.map((item, j) => (
                  <li key={j} className="flex gap-4">
                    <span className="shrink-0 font-mono text-sm font-medium text-[var(--accent)]">
                      {item.time}
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (block.type === "qa") {
          const items = block.items ?? [];
          if (items.length === 0) return null;
          return (
            <div key={globalIndex} className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
              <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                よくある質問
              </h3>
              <dl className="space-y-4">
                {items.map((item, j) => (
                  <div key={j}>
                    <dt className="font-medium text-zinc-900 dark:text-zinc-100">
                      Q. {item.q}
                    </dt>
                    <dd className="mt-1 pl-4 text-zinc-600 dark:text-zinc-400">
                      A. {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        }

        if (block.type === "eventEmbed") {
          return <EventEmbedBlock key={globalIndex} block={block} />;
        }

        return null;
      })}
    </div>
  );
}
