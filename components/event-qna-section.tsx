"use client";

import { useState, useEffect, useCallback } from "react";
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

  const load = useCallback(() => {
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
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const shellClass = "pt-1";
  const titleClass =
    "text-[15px] font-semibold text-[var(--ed-ink,var(--mg-ink))] min-[900px]:text-lg";
  const cardClass = "ed-qna-card p-3.5";

  if (loading) {
    return (
      <div className={shellClass}>
        <h2 className={titleClass}>よくある質問</h2>
        <p className="mt-2 text-sm text-[var(--ed-muted,var(--mg-muted))]">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={shellClass}>
        <h2 className={titleClass}>よくある質問</h2>
        <p className="mt-2 text-sm text-red-600/90">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-2 text-sm font-medium text-[var(--ed-forest,var(--ed-accent))] underline"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={shellClass}>
      <h2 className="sr-only min-[900px]:not-sr-only min-[900px]:mb-3 min-[900px]:text-lg min-[900px]:font-semibold min-[900px]:text-[var(--mg-ink)]">
        よくある質問
      </h2>
      <ul className="space-y-2.5">
        {items.map((q, index) => (
          <li key={q.id || `qna-${index}`} className={cardClass}>
            <span className="text-[10px] font-medium tracking-wide text-[var(--ed-forest,var(--ed-accent))]">
              {QNA_CATEGORY_LABELS[q.category as QnACategory] ?? q.category}
            </span>
            <p className="mt-1 text-[13px] font-semibold text-[var(--ed-ink,var(--mg-ink))]">
              Q. {q.question}
            </p>
            {q.answer && (
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--ed-muted,var(--mg-muted))]">
                A. {q.answer}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
