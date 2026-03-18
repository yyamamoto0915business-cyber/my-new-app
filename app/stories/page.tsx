import Link from "next/link";
import { getPublishedStories } from "@/lib/stories-store";
import { StoryCard } from "@/components/story/story-card";

export const metadata = {
  title: "ストーリー | MachiGlyph",
  description: "主催者ストーリー・参加レポ・運営振り返り。地域のストーリー一覧",
};

export default function StoriesListPage() {
  const stories = getPublishedStories();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            ストーリー
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            主催者ストーリー・参加レポ・運営振り返り
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {stories.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-12 text-center dark:bg-[var(--background)]">
            <p className="text-[var(--foreground-muted)]">現在公開中のストーリーはありません</p>
            <Link
              href="/events"
              className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
            >
              イベント一覧を見る →
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2">
            {stories.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/events"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            イベント一覧 →
          </Link>
          <Link
            href="/organizer/stories"
            className="text-sm text-[var(--foreground-muted)] hover:underline"
          >
            主催者の方はストーリーを書く
          </Link>
        </div>
      </main>
    </div>
  );
}
