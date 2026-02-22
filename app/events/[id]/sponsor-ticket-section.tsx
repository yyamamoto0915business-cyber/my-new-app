"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_PRICES = [300, 500, 1000, 3000, 5000];
const DEFAULT_PERKS: Record<number, string> = {
  300: "応援バッジ",
  500: "応援メッセージ",
  1000: "限定特典",
  3000: "限定体験枠",
  5000: "優先枠・特典パック",
};

type Props = {
  eventId: string;
  eventTitle: string;
  prices: number[];
  perks: Record<number, string>;
};

export function SponsorTicketSection({
  eventId,
  eventTitle,
  prices: pricesProp,
  perks: perksProp,
}: Props) {
  void eventTitle; // Reserved for future use (e.g. confirmation message)
  const prices = pricesProp.length ? pricesProp : DEFAULT_PRICES;
  const perks = Object.keys(perksProp).length ? perksProp : DEFAULT_PERKS;
  const [selectedAmount, setSelectedAmount] = useState(prices[0] ?? 300);
  const [message, setMessage] = useState("");
  const [addOns, setAddOns] = useState({ enGuide: false, priority: false, volunteerExperience: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
    const supabase = createClient();
    if (!supabase) {
      setDone(true);
      setLoading(false);
      return;
    }
    if (!authDisabled) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = `/login?returnTo=${encodeURIComponent(`/events/${eventId}`)}`;
        setLoading(false);
        return;
      }
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
        地域貢献・限定体験の特典を受け取りましょう
      </p>
      {!done ? (
        <form onSubmit={handlePurchase} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">価格を選択（¥300〜¥5,000）</label>
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              追加オプション（任意）
            </label>
            <div className="mt-2 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addOns.enGuide}
                  onChange={(e) => setAddOns((o) => ({ ...o, enGuide: e.target.checked }))}
                />
                ENガイド（参加サポート）
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addOns.priority}
                  onChange={(e) => setAddOns((o) => ({ ...o, priority: e.target.checked }))}
                />
                優先枠（参加保証・満席回避）
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addOns.volunteerExperience}
                  onChange={(e) => setAddOns((o) => ({ ...o, volunteerExperience: e.target.checked }))}
                />
                短時間ボランティア体験
              </label>
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
