"use client";

import { useState, useEffect, useActionState, Suspense } from "react";
import { useFormStatus } from "react-dom";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SponsorTier } from "@/lib/db/types";
import { submitSponsorApplication } from "./actions";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-lg bg-[var(--accent)] px-6 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "送信中..." : "申込する"}
    </button>
  );
}

function SponsorApplyForm() {
  const params = useParams() as { id?: string };
  const searchParams = useSearchParams();
  const eventId = String(params.id ?? "");
  const tierIdParam = searchParams.get("tier");

  const [tier, setTier] = useState<SponsorTier | null>(null);
  const [tiers, setTiers] = useState<SponsorTier[]>([]);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [state, formAction] = useActionState(submitSponsorApplication, null);

  useEffect(() => {
    if (!eventId) return;
    Promise.all([
      fetch(`/api/events/${eventId}/sponsor-tiers`).then((r) => r.json()),
      fetch(`/api/events/${eventId}`).then((r) => r.json()).catch(() => null),
    ]).then(([tierData, eventData]) => {
      setTiers(tierData.tiers?.company ?? []);
      setEventTitle(eventData?.title ?? "イベント");
      const t = (tierData.tiers?.company ?? []).find((x: SponsorTier) => x.id === tierIdParam);
      setTier(t ?? (tierData.tiers?.company ?? [])[0] ?? null);
    }).catch(() => setTiers([])).finally(() => setLoading(false));
  }, [eventId, tierIdParam]);

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        読み込み中...
      </div>
    );
  }

  const targetTier = tier ?? tiers[0];
  if (!targetTier) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-zinc-500">プラン情報を取得できませんでした</p>
        <Link href={`/events/${eventId}`} className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">
          イベント詳細へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          スポンサー申込
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {eventTitle} / {targetTier.name}（¥{targetTier.price.toLocaleString()}）
        </p>
      </div>

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="tierId" value={tier?.id ?? ""} />
          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {state.error}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              協賛プランを選択
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {tiers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`rounded-xl border p-4 text-left transition ${
                    tier?.id === t.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    ¥{t.price.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-sm font-medium">{t.name}</p>
                  {t.description && (
                    <p className="mt-1 text-xs text-zinc-500">{t.description}</p>
                  )}
                  {t.benefits?.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {t.benefits.map((b) => (
                        <li key={b}>・{b}</li>
                      ))}
                    </ul>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              会社名 <span className="text-red-500">*</span>
            </label>
            <input
              name="companyName"
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              担当者名 <span className="text-red-500">*</span>
            </label>
            <input
              name="contactName"
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              電話番号（任意）
            </label>
            <input
              name="phone"
              type="tel"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ロゴURL（任意）
            </label>
            <input
              name="logoUrl"
              type="url"
              placeholder="https://..."
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              請求情報（任意）
            </label>
            <textarea
              name="invoiceInfo"
              rows={2}
              placeholder="請求書の宛名など"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              メッセージ（任意）
            </label>
            <textarea
              name="message"
              rows={3}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <SubmitButton disabled={!tier} />
            <Link
              href={`/events/${eventId}`}
              className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium dark:border-zinc-600"
            >
              キャンセル
            </Link>
          </div>
        </form>
    </div>
  );
}

function BackLink() {
  const params = useParams();
  const eventId = String(params.id ?? "");
  return (
    <Link
      href={eventId ? `/events/${eventId}` : "/events"}
      className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
    >
      ← {eventId ? "イベント詳細へ" : "イベント一覧へ"}
    </Link>
  );
}

export default function SponsorApplyPage() {
  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm dark:bg-zinc-900/95 [border-color:var(--mg-line)]">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <BackLink />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Suspense fallback={<div className="py-8 text-center text-sm text-zinc-500">読み込み中...</div>}>
          <SponsorApplyForm />
        </Suspense>
      </main>
    </div>
  );
}
