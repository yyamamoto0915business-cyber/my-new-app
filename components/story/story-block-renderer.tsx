"use client";

import Link from "next/link";
import Image from "next/image";
import type { StoryBlock } from "@/lib/story-types";
import { getTocFromStoryBlocks } from "@/lib/story-types";
import { getEventById } from "@/lib/events";
import { EventCard } from "@/app/events/event-card";

type Props = { blocks: StoryBlock[]; blockIndexOffset?: number };

export function StoryBlockRenderer({ blocks, blockIndexOffset = 0 }: Props) {
  if (!blocks?.length) return null;

  return (
    <div className="article-body space-y-8">
      {blocks.map((block, i) => {
        const key = blockIndexOffset + i;

        if (block.type === "heading") {
          const toc = getTocFromStoryBlocks(blocks);
          const headingIndex = blocks.slice(0, i).filter((b) => b.type === "heading").length;
          const id = toc[headingIndex]?.id;
          return (
            <h2
              key={key}
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
              key={key}
              className="max-w-none text-base leading-relaxed text-zinc-700 dark:text-zinc-300"
            >
              {block.text}
            </p>
          );
        }

        if (block.type === "bullets") {
          const items = block.items ?? [];
          if (items.length === 0) return null;
          return (
            <ul key={key} className="list-inside list-disc space-y-1 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              {items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "timeline") {
          const items = block.items ?? [];
          if (items.length === 0) return null;
          return (
            <div key={key} className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
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
            <div key={key} className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
              <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                よくある質問
              </h3>
              <dl className="space-y-4">
                {items.map((item, j) => (
                  <div key={j}>
                    <dt className="font-medium text-zinc-900 dark:text-zinc-100">Q. {item.q}</dt>
                    <dd className="mt-1 pl-4 text-zinc-600 dark:text-zinc-400">A. {item.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        }

        if (block.type === "rating") {
          const { atmosphere, physical, recommend } = block;
          const labels: { v?: number; label: string }[] = [];
          if (atmosphere != null) labels.push({ v: atmosphere, label: "雰囲気" });
          if (physical != null) labels.push({ v: physical, label: "体力" });
          if (recommend != null) labels.push({ v: recommend, label: "おすすめ度" });
          if (labels.length === 0) return null;
          return (
            <div key={key} className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
              <h3 className="mb-3 font-serif text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                簡易評価
              </h3>
              <div className="flex flex-wrap gap-4">
                {labels.map(({ v, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
                    <span className="font-medium text-[var(--accent)]">
                      {v != null ? "★".repeat(v) : "—"}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          );
        }

        if (block.type === "imageGallery") {
          const urls = block.imageUrls ?? [];
          if (urls.length === 0) return null;
          return (
            <div key={key} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {urls.slice(0, 5).map((url, j) => (
                <div key={j} className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={url.startsWith("data:")}
                    sizes="(max-width:640px) 50vw, 200px"
                  />
                </div>
              ))}
            </div>
          );
        }

        if (block.type === "eventEmbed") {
          const ids = (block.eventIds ?? []).slice(0, 6);
          const events = ids
            .map((id) => getEventById(id))
            .filter((e): e is NonNullable<typeof e> => e != null);
          if (events.length === 0) return null;
          return (
            <aside
              key={key}
              className="my-10 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]"
              aria-label="関連イベント"
            >
              <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                関連イベント
              </h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/events" className="text-sm font-medium text-[var(--accent)] hover:underline">
                  イベント一覧を見る →
                </Link>
              </div>
            </aside>
          );
        }

        return null;
      })}
    </div>
  );
}
