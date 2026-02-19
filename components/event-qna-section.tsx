"use client";

import { useState, useEffect } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { QNA_CATEGORY_LABELS, type QnACategory } from "@/lib/qna-mock";

type QnAItem = {
  id: string;
  question: string;
  answer: string | null;
  category: string;
  pinned: boolean;
};

type Props = {
  eventId: string;
};

export function EventQnASection({ eventId }: Props) {
  const [items, setItems] = useState<QnAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchWithTimeout(`/api/events/${eventId}/qna?public=true`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {
        setError("読み込みに失敗しました");
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [eventId]);

  if (loading) {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          よくある質問
        </h2>
        <p className="mt-2 text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          よくある質問
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-2 text-sm text-[var(--accent)] underline"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        よくある質問
      </h2>
      <ul className="mt-3 space-y-3">
        {items.map((q) => (
          <li
            key={q.id}
            className="rounded-lg border border-zinc-200/60 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
          >
            <span className="text-xs text-zinc-500">
              {QNA_CATEGORY_LABELS[q.category as QnACategory] ?? q.category}
            </span>
            <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
              Q. {q.question}
            </p>
            {q.answer && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                A. {q.answer}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
