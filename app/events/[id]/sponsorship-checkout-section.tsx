"use client";

import { useState } from "react";

const TIERS = [
  { amount: 10000, label: "1万円" },
  { amount: 30000, label: "3万円" },
  { amount: 50000, label: "5万円" },
] as const;

type Props = { eventId: string };

export function SponsorshipCheckoutSection({ eventId }: Props) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorCompany, setSponsorCompany] = useState("");
  const [sponsorEmail, setSponsorEmail] = useState("");

  const handleCheckout = async (tier: number) => {
    setError(null);
    setLoading(tier);
    try {
      const res = await fetch("/api/sponsor/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          tier,
          sponsorName: sponsorName.trim() || undefined,
          sponsorCompany: sponsorCompany.trim() || undefined,
          sponsorEmail: sponsorEmail.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "エラー");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setLoading(null);
    }
  };

  const platformFee = (amount: number) => Math.max(Math.round(amount * 0.05), 300);
  const organizerNet = (amount: number) => amount - platformFee(amount);

  return (
    <div className="border-t border-[var(--mg-line)] pt-6">
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        企業・団体の応援（クレジット決済）
      </h3>
      <p className="mt-2 text-xs text-[var(--mg-muted)]">
        主催者へ直接入金されます。
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {TIERS.map(({ amount, label }) => (
          <button
            key={amount}
            type="button"
            onClick={() => {
              setSelectedTier(amount);
              setModalOpen(true);
            }}
            className="rounded-lg border border-[var(--accent)] bg-white px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/5 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            ¥{label}
          </button>
        ))}
      </div>

      {modalOpen && selectedTier && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setModalOpen(false)}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              協賛 ¥{selectedTier.toLocaleString()}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">お名前（任意）</label>
                <input
                  type="text"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">企業名（任意）</label>
                <input
                  type="text"
                  value={sponsorCompany}
                  onChange={(e) => setSponsorCompany(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">メール（任意・領収書用）</label>
                <input
                  type="email"
                  value={sponsorEmail}
                  onChange={(e) => setSponsorEmail(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              協賛金 ¥{selectedTier.toLocaleString()}　手数料 ¥{platformFee(selectedTier).toLocaleString()}　主催者受取 ¥{organizerNet(selectedTier).toLocaleString()}
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleCheckout(selectedTier)}
                disabled={loading !== null}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading === selectedTier ? "処理中..." : "決済へ進む"}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
              >
                キャンセル
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
