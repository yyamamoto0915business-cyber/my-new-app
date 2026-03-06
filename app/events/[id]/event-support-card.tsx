"use client";

import { useState, useEffect, useCallback } from "react";
import type { SponsorTier } from "@/lib/db/types";

const SUPPORT_AMOUNTS = [500, 1000, 3000] as const;

type Props = { eventId: string };

/** ページ下部の小さめ応援カード（常時表示・シンプル） */
export function EventSupportCard({ eventId }: Props) {
  const [tiers, setTiers] = useState<SponsorTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTiers = useCallback(() => {
    setLoading(true);
    fetch(`/api/events/${eventId}/sponsor-tiers`)
      .then((r) => r.json())
      .then((data) => {
        const individual = (data.tiers?.individual ?? []) as SponsorTier[];
        const byPrice = individual.filter((t) =>
          SUPPORT_AMOUNTS.includes(t.price as (typeof SUPPORT_AMOUNTS)[number])
        );
        const ordered = SUPPORT_AMOUNTS.map(
          (p) => byPrice.find((t) => t.price === p) ?? { id: `f-ind-${p}`, eventId, price: p, name: "応援", type: "individual" as const, description: null, benefits: [], sortOrder: 0, isActive: true }
        ).filter((t): t is SponsorTier => !!t.id);
        setTiers(ordered.length > 0 ? ordered : SUPPORT_AMOUNTS.map((p, i) => ({
          id: `f-ind-${p}`,
          eventId,
          price: p,
          name: "応援",
          type: "individual" as const,
          description: null,
          benefits: [],
          sortOrder: i,
          isActive: true,
        })));
      })
      .catch(() => setTiers(SUPPORT_AMOUNTS.map((p, i) => ({
        id: `f-ind-${p}`,
        eventId,
        price: p,
        name: "応援",
        type: "individual" as const,
        description: null,
        benefits: [],
        sortOrder: i,
        isActive: true,
      }))))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount == null) return;
    setError(null);
    setSubmitting(true);
    try {
      const tier = tiers.find((t) => t.price === amount);
      const tierId = tier?.id ?? `f-ind-${amount}`;
      const res = await fetch(`/api/events/${eventId}/sponsor-purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierId,
          amount,
          quantity: 1,
          isAnonymous: true,
          comment: comment.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setDone(true);
        setOpen(false);
        setAmount(null);
        setComment("");
      } else {
        setError(json.error ?? "送信できませんでした");
      }
    } catch {
      setError("通信エラーです。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-6 rounded-xl border border-[var(--mg-line)] bg-white/80 p-4 dark:bg-zinc-900/50">
      <h2 className="text-sm font-medium text-[var(--mg-ink)]">
        このイベントを応援する
      </h2>
      <p className="mt-1 text-xs text-[var(--mg-muted)]">
        会場費や備品代など、開催の支援につながります
      </p>

      {done ? (
        <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400">
          応援ありがとうございます
        </p>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={loading}
          className="mt-3 w-full rounded-lg border border-[var(--border)] bg-white py-2.5 text-sm font-medium text-[var(--mg-ink)] transition hover:bg-zinc-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
        >
          {loading ? "読み込み中..." : "応援する"}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-[var(--mg-muted)]">金額を選ぶ</p>
            <div className="mt-2 flex gap-2">
              {SUPPORT_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                    amount === a
                      ? "border-[var(--accent)] bg-[var(--mg-accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-white text-[var(--mg-ink)] hover:bg-zinc-50 dark:bg-zinc-800/50"
                  }`}
                >
                  ¥{a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--mg-muted)]">
              応援メッセージ（任意）
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="主催者へ一言"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-800/50"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); setAmount(null); setComment(""); }}
              className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm text-[var(--mg-muted)]"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={amount == null || submitting}
              className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "送信中..." : `¥${amount?.toLocaleString() ?? "—"}で応援する`}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
