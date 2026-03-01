"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProfileLink } from "@/components/profile-link";
import { Breadcrumb } from "@/components/breadcrumb";

type Article = {
  id: string;
  authorName: string;
  title: string;
  body: string;
  excerpt: string | null;
  imageUrl: string | null;
  likeCount: number;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ArticleDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/articles/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="h-8 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-6 h-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <p className="text-[var(--foreground-muted)]">記事が見つかりません</p>
          <Link href="/articles" className="mt-4 text-sm text-[var(--accent)] hover:underline">
            記事一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex justify-end">
            <ProfileLink />
          </div>
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "記事", href: "/articles" },
              { label: article.title.length > 20 ? `${article.title.slice(0, 20)}…` : article.title },
            ]}
          />
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-4 py-8">
        {article.imageUrl && (
          <div className="relative mb-8 h-48 w-full overflow-hidden rounded-xl sm:h-64">
            <Image
              src={article.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 672px"
            />
          </div>
        )}

        <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          {article.title}
        </h1>

        <div className="mt-4 flex items-center gap-4 text-sm text-[var(--foreground-muted)]">
          <span>{article.authorName}</span>
          <span>{formatDate(article.createdAt)}</span>
          {article.likeCount > 0 && <span>♡ {article.likeCount}</span>}
        </div>

        <div className="mt-8 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
          {article.body}
        </div>

        {article.eventId && (
          <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)]/20 p-4">
            <Link
              href={`/events/${article.eventId}`}
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              関連イベントを見る →
            </Link>
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/articles"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← 記事一覧に戻る
          </Link>
        </div>
      </article>
    </div>
  );
}
