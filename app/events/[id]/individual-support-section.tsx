"use client";

import { useState, useEffect } from "react";
import type { SponsorTier, SponsorPurchase } from "@/lib/db/types";

type SponsorData = {
  tiers: { individual: SponsorTier[]; company: SponsorTier[] };
  purchases: SponsorPurchase[];
  applications: unknown[];
  totalAmount: number;
};

type Props = { eventId: string; onPurchaseSuccess?: () => void };

export function IndividualSupportSection({ eventId, onPurchaseSuccess }: Props) {
  const [data, setData] = useState<SponsorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<SponsorTier | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/sponsor-tiers`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/sponsor-purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierId: selectedTier.id,
          amount: selectedTier.price,
          quantity: 1,
          displayName: displayName.trim() || undefined,
          isAnonymous,
          comment: comment.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setDone(true);
        onPurchaseSuccess?.();
        fetch(`/api/events/${eventId}/sponsor-tiers`)
          .then((r) => r.json())
          .then(setData);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          応援する（個人）
        </h2>
        <p className="mt-2 text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  const tiers = data.tiers.individual.slice(0, 3);
  const supporterCount = data.purchases.length;
  const totalAmount = data.totalAmount ?? 0;

  return (
    <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        応援チケット（個人）
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        このイベントを続けていくための運営サポートです。※参加権ではありません／匿名OK
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
        応援金の使い道：備品・保険・広報・運営交通費など
      </p>

      {supporterCount > 0 && (
        <div className="mt-3 flex gap-4 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            支援総額 <strong className="text-zinc-900 dark:text-zinc-100">¥{totalAmount.toLocaleString()}</strong>
          </span>
          <span className="text-zinc-600 dark:text-zinc-400">
            支援者数 <strong className="text-zinc-900 dark:text-zinc-100">{supporterCount}</strong>人
          </span>
        </div>
      )}

      {done ? (
        <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          応援ありがとうございます！
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              応援プランを選択
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selectedTier?.id === tier.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    ¥{tier.price.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-sm font-medium">{tier.name}</p>
                  {tier.description && (
                    <p className="mt-1 text-xs text-zinc-500">{tier.description}</p>
                  )}
                  {tier.benefits?.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {tier.benefits.map((b) => (
                        <li key={b}>・{b}</li>
                      ))}
                    </ul>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              匿名で応援する
            </label>
            {!isAnonymous && (
              <input
                type="text"
                placeholder="表示名（任意）"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            )}
          </div>

          <div>
            <label className="block text-sm">応援メッセージ（任意）</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="一言メッセージ"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedTier || submitting}
            className="rounded-lg bg-[var(--accent)] px-6 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "処理中..."
              : selectedTier
                ? `¥${selectedTier.price.toLocaleString()}で応援する`
                : "プランを選択してください"}
          </button>
        </form>
      )}
    </div>
  );
}
