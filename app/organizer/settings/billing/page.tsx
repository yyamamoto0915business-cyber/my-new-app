"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { OrganizerHeader } from "@/components/organizer/organizer-header";

type BillingData = {
  organizer: {
    plan: string;
    earlybird_eligible?: boolean;
    full_feature_trial_end_at?: string | null;
    founder30_granted_at?: string | null;
    founder30_end_at?: string | null;
    subscription_status?: string | null;
    current_period_end?: string | null;
    stripe_account_charges_enabled?: boolean;
  };
  monthlyPublished: number;
  publishLimit: number | null;
};

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = async () => {
    try {
      const res = await fetch("/api/organizer/billing");
      if (!res.ok) throw new Error("取得に失敗しました");
      const d = await res.json();
      setData(d);
    } catch {
      setError("課金情報を取得できませんでした");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (params.get("checkout") === "success" || params.get("connected") === "1") {
      fetchBilling();
    }
  }, []);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "エラー");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "エラー");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      let res = await fetch("/api/connect/create-account", { method: "POST" });
      let json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "エラー");
      res = await fetch("/api/connect/onboard", { method: "POST" });
      json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "エラー");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <OrganizerHeader
        title="課金・請求"
        backHref="/organizer/events"
        backLabel="← 主催イベントへ"
      />

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : data ? (
          <div className="space-y-6">
            {/* Earlybird / Trial */}
            {data.organizer.earlybird_eligible && data.organizer.full_feature_trial_end_at && (
              <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                <h2 className="font-medium text-emerald-800 dark:text-emerald-300">
                  早期登録キャンペーン
                </h2>
                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                  全機能無料 残り
                  {new Date(data.organizer.full_feature_trial_end_at).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  まで
                </p>
              </section>
            )}

            {/* Founder30 */}
            {data.organizer.founder30_end_at &&
              new Date(data.organizer.founder30_end_at) >= new Date() && (
                <section className="rounded-xl border border-[var(--border)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90">
                  <h2 className="font-medium text-zinc-900 dark:text-zinc-100">Founder30 特典</h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    今月の無料公開 {data.monthlyPublished}/3　特典終了：
                    {new Date(data.organizer.founder30_end_at).toLocaleDateString("ja-JP")}
                  </p>
                </section>
              )}

            {/* 通常枠 */}
            {!data.organizer.founder30_end_at ||
              new Date(data.organizer.founder30_end_at) < new Date() ||
              data.organizer.subscription_status === "active" ? (
              data.organizer.subscription_status !== "active" && (
                <section className="rounded-xl border border-[var(--border)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90">
                  <h2 className="font-medium text-zinc-900 dark:text-zinc-100">通常枠</h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    今月の無料公開 {data.monthlyPublished}/1
                  </p>
                </section>
              )
            ) : null}

            {/* サブスク状態 */}
            <section className="rounded-xl border border-[var(--border)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90">
              <h2 className="font-medium text-zinc-900 dark:text-zinc-100">Starter プラン（月980円）</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {data.organizer.subscription_status === "active"
                  ? `有効（次回更新：${data.organizer.current_period_end ? new Date(data.organizer.current_period_end).toLocaleDateString("ja-JP") : "-"}）`
                  : data.organizer.subscription_status === "past_due"
                    ? "支払いエラー（カード情報を確認してください）"
                    : "未加入"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.organizer.subscription_status !== "active" && (
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {checkoutLoading ? "処理中..." : "月980円で継続"}
                  </button>
                )}
                {data.organizer.subscription_status === "active" && (
                  <button
                    type="button"
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {portalLoading ? "処理中..." : "請求・解約"}
                  </button>
                )}
              </div>
            </section>

            {/* Connect 受取設定 */}
            <section className="rounded-xl border border-[var(--border)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90">
              <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
                協賛金の受取設定（Stripe連携）
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {data.organizer.stripe_account_charges_enabled
                  ? "受取OK"
                  : "設定中または未設定"}
              </p>
              {!data.organizer.stripe_account_charges_enabled && (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connectLoading}
                  className="mt-3 rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/5 disabled:opacity-50"
                >
                  {connectLoading ? "処理中..." : "受取設定を行う"}
                </button>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
