import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getStoryBySlug,
  getStoriesByAuthor,
  getStoriesByEventId,
} from "@/lib/stories-store";
import { getEvents, getRankedEvents } from "@/lib/events";
import { StoryBlockRenderer } from "@/components/story/story-block-renderer";
import { StoryToc } from "@/components/story/story-toc";
import { StoryCard } from "@/components/story/story-card";
import { EventCard } from "@/app/events/event-card";

type Props = { params: Promise<{ slug: string }> };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateStaticParams() {
  const { getPublishedStories } = await import("@/lib/stories-store");
  const stories = getPublishedStories();
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) return { title: "ストーリーが見つかりません" };
  return {
    title: `${story.title} | ストーリー`,
    description: story.lead,
  };
}

export default async function StoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) notFound();

  const sameAuthorStories = getStoriesByAuthor(story.authorId).filter(
    (s) => s.id !== story.id && s.status === "published"
  );
  const allEvents = getEvents();
  const recommendedEvents = getRankedEvents(allEvents, "newest", 6);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <article className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={story.coverImageUrl}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>

        <header className="mt-8">
          <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {story.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--foreground-muted)]">
            {story.lead}
          </p>
          {story.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {story.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
            <span>{story.authorName}</span>
            <span>{formatDate(story.updatedAt)}</span>
          </div>
        </header>

        <div className="mt-10 lg:grid lg:grid-cols-[1fr_240px] lg:gap-12">
          <div className="min-w-0">
            <StoryBlockRenderer blocks={story.blocks} />
          </div>
          <aside className="mt-10 lg:mt-0 lg:shrink-0">
            <div className="lg:sticky lg:top-24">
              <StoryToc blocks={story.blocks} />
            </div>
          </aside>
        </div>

        {sameAuthorStories.length > 0 && (
          <section className="mt-16 border-t border-[var(--border)] pt-10">
            <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              この投稿者の他のストーリー
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {sameAuthorStories.slice(0, 2).map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          </section>
        )}

        {recommendedEvents.length > 0 && (
          <section className="mt-16 border-t border-[var(--border)] pt-10">
            <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              おすすめイベント
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedEvents.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/events"
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                イベント一覧を見る →
              </Link>
            </div>
          </section>
        )}

        <section className="mt-16 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/events"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              イベントに参加する
            </Link>
            <Link
              href="/event-requests/new"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              問い合わせ
            </Link>
          </div>
        </section>

        <div className="mt-10">
          <Link
            href="/stories"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← ストーリー一覧に戻る
          </Link>
        </div>
      </article>
    </div>
  );
}
