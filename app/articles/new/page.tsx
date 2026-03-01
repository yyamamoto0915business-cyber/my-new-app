"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProfileLink } from "@/components/profile-link";
import { Breadcrumb } from "@/components/breadcrumb";

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !body.trim()) {
      setError("タイトルと本文は必須です");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          excerpt: excerpt.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          authorName: authorName.trim() || "ゲスト",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "投稿に失敗しました");
        return;
      }

      router.push(`/articles/${data.id}`);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

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
              { label: "新規作成" },
            ]}
          />
          <h1 className="mt-2 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            記事を書く
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              タイトル *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-zinc-900 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="記事のタイトル"
              required
            />
          </div>

          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              著者名
            </label>
            <input
              id="authorName"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-zinc-900 focus:border-[var(--accent)] focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="ハンドルネームやニックネーム"
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              本文 *
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-zinc-900 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="記事の本文を書いてください。改行はそのまま反映されます。"
              required
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              抜粋（一覧用、任意）
            </label>
            <input
              id="excerpt"
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-zinc-900 focus:border-[var(--accent)] focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="記事の要約"
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              画像URL（任意）
            </label>
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-zinc-900 focus:border-[var(--accent)] focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--accent)] px-6 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "投稿中..." : "投稿する"}
            </button>
            <Link
              href="/articles"
              className="rounded-lg border border-[var(--border)] px-6 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
