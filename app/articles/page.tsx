"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProfileLink } from "@/components/profile-link";
import { Breadcrumb } from "@/components/breadcrumb";

type Article = {
  id: string;
  authorName: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  likeCount: number;
  createdAt: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => res.json())
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumb
              items={[
                { label: "トップ", href: "/" },
                { label: "記事一覧" },
              ]}
            />
            <div className="flex items-center gap-2">
              <Link
                href="/articles/new"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                記事を書く
              </Link>
              <ProfileLink />
            </div>
          </div>
          <h1 className="mt-2 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            ストーリー
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--background)]"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-12 text-center dark:bg-[var(--background)]">
            <p className="text-[var(--foreground-muted)]">まだ記事がありません</p>
            <Link
              href="/articles/new"
              className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              最初の記事を書く
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="block overflow-hidden rounded-xl border border-[var(--border)] bg-white transition-all hover:border-[var(--accent)] dark:bg-[var(--background)]"
              >
                <div className="flex flex-col sm:flex-row">
                  {a.imageUrl && (
                    <div className="relative h-40 w-full shrink-0 sm:h-32 sm:w-48">
                      <Image
                        src={a.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 192px"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-center p-4">
                    <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {a.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--foreground-muted)]">
                      {a.excerpt ?? a.title}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
                      <span>{a.authorName}</span>
                      <span>{formatDate(a.createdAt)}</span>
                      {a.likeCount > 0 && (
                        <span>♡ {a.likeCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Link
            href="/events"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            イベント一覧 →
          </Link>
          <Link
            href="/collections"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            特集一覧 →
          </Link>
        </div>
      </main>
    </div>
  );
}
