"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  eventId: string;
  eventTitle: string;
  prices: number[];
  perks: Record<number, string>;
};

export function SponsorTicketSection({
  eventId,
  eventTitle,
  prices,
  perks,
}: Props) {
  const [selectedAmount, setSelectedAmount] = useState(prices[0] ?? 300);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!prices.length) return null;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setDone(true);
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/login?returnTo=${encodeURIComponent(`/events/${eventId}`)}`;
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/events/${eventId}/sponsor-tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: selectedAmount, message }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
  };

  return (
    <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        スポンサーチケットで応援する
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        イベントを応援して、特典を受け取りましょう
      </p>
      {!done ? (
        <form onSubmit={handlePurchase} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">価格を選択</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {prices.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedAmount(p)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium ${
                    selectedAmount === p
                      ? "bg-[var(--accent)] text-white"
                      : "border border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  ¥{p.toLocaleString()}
                  {perks[p] && (
                    <span className="ml-1 text-xs opacity-90">
                      ({perks[p]})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm">応援メッセージ（任意）</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[var(--accent)] px-6 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "処理中..." : `¥${selectedAmount.toLocaleString()}で応援する`}
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200">
          応援ありがとうございます！
        </p>
      )}
    </div>
  );
}
