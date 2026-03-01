"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ReadArticle } from "@/lib/read-article-types";

const MOCK_ORGANIZER_ID = "org-1";
const MOCK_ORGANIZER_NAME = "地域振興会";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OrganizerArticlesPage() {
  const [articles, setArticles] = useState<ReadArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/read-articles?authorId=${encodeURIComponent(MOCK_ORGANIZER_ID)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <Link
            href="/organizer/events"
            className="text-sm text-[var(--foreground-muted)] hover:underline"
          >
            ← 主催メニュー
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              記事の管理
            </h1>
            <Link
              href="/organizer/articles/new"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              新規作成
            </Link>
          </div>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            読みもの記事の下書き・公開を管理します
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--background)]"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-10 text-center dark:bg-[var(--background)]">
            <p className="text-[var(--foreground-muted)]">まだ記事がありません</p>
            <Link
              href="/organizer/articles/new"
              className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              最初の記事を書く
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {articles.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border)] bg-white p-4 dark:bg-[var(--background)]"
              >
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={a.coverImageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                    {a.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                    {formatDate(a.updatedAt)}
                    {a.status === "draft" && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        下書き
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {a.status === "published" && (
                    <Link
                      href={`/read/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      表示
                    </Link>
                  )}
                  <Link
                    href={`/organizer/articles/new?edit=${a.id}`}
                    className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    編集
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          <Link
            href="/read"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            読みもの一覧を見る →
          </Link>
        </div>
      </main>
    </div>
  );
}
