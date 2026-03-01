import Link from "next/link";
import { getPublishedArticles } from "@/lib/read-articles-store";
import { ArticleCard } from "@/components/read/article-card";

export const metadata = {
  title: "読みもの | 地域イベントプラットフォーム",
  description: "特集・インタビュー・参加レポ・街ガイドなど、地域の読みもの記事一覧",
};

export default function ReadListPage() {
  const articles = getPublishedArticles();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            読みもの
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            特集・インタビュー・参加レポ・街ガイド
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {articles.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-12 text-center dark:bg-[var(--background)]">
            <p className="text-[var(--foreground-muted)]">まだ記事がありません</p>
            <Link
              href="/events"
              className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
            >
              イベント一覧を見る →
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
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
            href="/organizer/articles"
            className="text-sm text-[var(--foreground-muted)] hover:underline"
          >
            主催者の方は記事を書く
          </Link>
        </div>
      </main>
    </div>
  );
}
