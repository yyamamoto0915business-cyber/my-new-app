"use client";

import { useState } from "react";
import { Heart, HandHeart } from "lucide-react";

const SUPPORT_AMOUNTS = [500, 1000, 3000] as const;

type Props = { eventId: string };

export function EventDetailSupportBanner({ eventId }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount == null) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/stripe/checkout/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, amount }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        window.location.href = json.url;
        return;
      }
      setError(json.error ?? "送信できませんでした");
    } catch {
      setError("通信エラーです。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden bg-[#faf6ee]">
      <div className="flex flex-col gap-3 p-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:px-5 min-[900px]:py-3.5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 text-amber-800">
            <HandHeart className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--mg-ink)]">
              このイベントを応援する
            </h2>
            <p className="mt-0.5 text-xs text-[var(--mg-muted)]">
              会場費や備品代など、開催の支援につながります
            </p>
          </div>
        </div>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-[#9a6b2f] px-5 text-sm font-semibold text-white transition hover:opacity-90 min-[900px]:self-center"
          >
            <Heart className="h-4 w-4" aria-hidden />
            応援する
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-3 min-[900px]:shrink-0"
          >
            <div className="flex flex-wrap gap-2">
              {SUPPORT_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    amount === a
                      ? "border-[var(--accent)] bg-white text-[var(--accent)]"
                      : "border-[var(--mg-line)] bg-white text-[var(--mg-ink)]"
                  }`}
                >
                  ¥{a.toLocaleString()}
                </button>
              ))}
            </div>
            {error ? (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setAmount(null);
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-[var(--mg-line)] py-2 text-sm"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={amount == null || submitting}
                className="flex-1 rounded-lg bg-[#9a6b2f] py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "処理中..." : "決済へ進む"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
