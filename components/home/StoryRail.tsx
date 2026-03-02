"use client";

import Link from "next/link";
import Image from "next/image";
import type { Story } from "@/lib/story-types";

type Props = {
  stories: Story[];
  loading?: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

/** 1枚目：大きめ Note 風 */
function StoryCardLarge({ story }: { story: Story }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-all hover:shadow-md dark:bg-[var(--background)]"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-[4/3] sm:w-1/2">
          <Image
            src={story.coverImageUrl}
            alt=""
            fill
            className="object-cover transition-transform group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center p-6">
          <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
            {story.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            {story.lead}
          </p>
          <div className="mt-4 flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
            <span>{story.authorName}</span>
            <span>{formatDate(story.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** 小カード */
function StoryCardSmall({ story }: { story: Story }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-all hover:shadow-md dark:bg-[var(--background)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={story.coverImageUrl}
          alt=""
          fill
          className="object-cover transition-transform group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, 300px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="line-clamp-2 font-serif text-sm font-semibold text-white drop-shadow-sm">
            {story.title}
          </h3>
        </div>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-xs text-[var(--foreground-muted)]">
          {story.lead}
        </p>
      </div>
    </Link>
  );
}

export function StoryRail({ stories, loading }: Props) {
  if (loading) {
    return (
      <section className="mb-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          まちのストーリー
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700"
            />
          ))}
        </div>
      </section>
    );
  }

  if (stories.length === 0) return null;

  const [first, ...rest] = stories;

  return (
    <section className="mb-10" aria-label="まちのストーリー">
      <h2 className="mb-4 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        まちのストーリー
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {first && (
          <div className="sm:col-span-2">
            <StoryCardLarge story={first} />
          </div>
        )}
        <div className="flex flex-col gap-4 sm:col-span-1">
          {rest.slice(0, 2).map((s) => (
            <StoryCardSmall key={s.id} story={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
