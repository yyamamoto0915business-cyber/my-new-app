"use client";

import { useState, useEffect } from "react";
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
    stripe_account_details_submitted?: boolean;
  };
  monthlyPublished: number;
  publishLimit: number | null;
};

/** 現在のプラン名を取得 */
function getPlanLabel(data: BillingData): string {
  if (data.organizer.subscription_status === "active") return "Starterプラン";
  return "無料プラン";
}

/** Founder特典が有効か */
function isFounderActive(data: BillingData): boolean {
  return !!(
    data.organizer.founder30_end_at &&
    new Date(data.organizer.founder30_end_at) >= new Date()
  );
}

/** 今月の無料公開枠表示（例: 0/1 または 0/4） */
function getSlotsLabel(data: BillingData): string {
  const limit = data.publishLimit;
  if (limit === null) return "無制限";
  return `${data.monthlyPublished}/${limit}`;
}

const NORMAL_SLOTS = 1;
const FOUNDER_BONUS_SLOTS = 3;

/** 通常枠の使用数（最大1） */
function getNormalSlotsUsed(published: number): number {
  return Math.min(published, NORMAL_SLOTS);
}

/** Founder追加枠の使用数（通常1件を超えた分、最大3） */
function getFounderBonusSlotsUsed(published: number): number {
  return Math.max(0, published - NORMAL_SLOTS);
}

/** 受取設定の状態 */
function getReceivingStatus(data: BillingData): "未設定" | "設定済み" {
  return data.organizer.stripe_account_charges_enabled ? "設定済み" : "未設定";
}

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
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((d as { error?: string }).error ?? "取得に失敗しました");
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "課金情報を取得できませんでした");
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
        title="プラン・決済設定"
        description="主催者プランの確認、アップグレード、売上の受取設定ができます"
        titleClassName="text-[22px] font-bold sm:text-[28px]"
        descriptionClassName="text-[13px] sm:text-sm"
        backHref="/organizer/settings"
        backLabel="← 設定へ"
      />
      <main className="mx-auto max-w-[960px] px-4 pb-24 pt-6 sm:px-6">
        {loading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : data ? (
          <div className="flex flex-col gap-8">
            {/* ========== 1. 現在の利用状況カード ========== */}
            <section
              className="min-h-[220px] rounded-2xl bg-gradient-to-br from-[var(--accent-soft)]/60 via-[var(--mg-accent-soft)]/40 to-[var(--mg-paper)] p-4 shadow-[var(--mg-shadow)] dark:from-[var(--accent-soft)]/30 dark:via-[var(--mg-accent-soft)]/20 dark:to-[var(--mg-paper)] sm:p-6"
              aria-labelledby="summary-heading"
            >
              <h2 id="summary-heading" className="text-lg font-bold text-[var(--mg-ink)] sm:text-xl">
                現在の利用状況
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-[var(--mg-ink)]">
                <li className="flex gap-2">
                  <span className="text-[var(--mg-muted)]">現在のプラン：</span>
                  <span className="font-semibold">{getPlanLabel(data)}</span>
                </li>
                {data.organizer.subscription_status !== "active" && (
                  <li className="flex gap-2">
                    <span className="text-[var(--mg-muted)]">毎月使える公開枠：</span>
                    <span className="font-semibold">
                      {getNormalSlotsUsed(data.monthlyPublished)}/{NORMAL_SLOTS}
                    </span>
                  </li>
                )}
                {data.organizer.subscription_status !== "active" && isFounderActive(data) && (
                  <>
                    <li className="flex gap-2">
                      <span className="text-[var(--mg-muted)]">特典の公開枠：</span>
                      <span className="font-semibold">
                        {getFounderBonusSlotsUsed(data.monthlyPublished)}/{FOUNDER_BONUS_SLOTS}
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[var(--mg-muted)]">今月公開できる件数：</span>
                      <span className="font-semibold">
                        最大{NORMAL_SLOTS + FOUNDER_BONUS_SLOTS}件
                      </span>
                    </li>
                  </>
                )}
                <li className="flex gap-2">
                  <span className="text-[var(--mg-muted)]">売上の受取設定：</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      getReceivingStatus(data) === "設定済み"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                    }`}
                  >
                    {getReceivingStatus(data)}
                  </span>
                </li>
              </ul>
              {/* ボタン：主1つ＋第2、PC横・スマホ縦 */}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {!data.organizer.stripe_account_charges_enabled ? (
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={connectLoading}
                    className="order-1 flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
                  >
                    {connectLoading ? "処理中..." : "Stripeを設定する"}
                  </button>
                ) : null}
                <a
                  href="#recommended-plan"
                  className="order-2 flex h-11 w-full items-center justify-center rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--mg-ink)] hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 sm:w-auto"
                >
                  プランを変更
                </a>
              </div>
            </section>

            {/* ========== 2. 次にやることボックス ========== */}
            {(!data.organizer.stripe_account_charges_enabled ||
              data.organizer.subscription_status !== "active") && (
              <section className="rounded-[14px] border border-[var(--border)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90">
                <h3 className="text-base font-bold text-[var(--mg-ink)]">次にやること</h3>
                <ul className="mt-2 space-y-1 text-sm leading-relaxed text-[var(--mg-muted)]">
                  {!data.organizer.stripe_account_charges_enabled && (
                    <li>Stripeを設定する</li>
                  )}
                  {data.organizer.subscription_status !== "active" && (
                    <li>Starterプランを確認する</li>
                  )}
                </ul>
              </section>
            )}

            {/* ========== 3. 主催者プランセクション ========== */}
            <section id="recommended-plan" className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--mg-ink)] sm:text-[22px]">主催者プラン</h3>
              <p className="text-sm text-[var(--mg-muted)]">
                イベントを続けて主催したい方向けに、使い方に合ったプランを選べます。
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
              {/* 無料プランカード */}
              <div className="min-h-[220px] rounded-2xl border border-[#eaeaea] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90 sm:p-6">
                <span className="inline-block rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-[var(--mg-muted)] dark:bg-zinc-700 dark:text-zinc-400">
                  まずは気軽に始めたい方におすすめ
                </span>
                <h4 className="mt-4 text-lg font-bold text-[var(--mg-ink)] sm:text-xl">無料プラン</h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mg-muted)]">
                  まずは気軽に主催を始めたい方向けのプランです。
                  毎月1件まで無料で公開できます。
                </p>
                {data.organizer.subscription_status !== "active" && (
                  <span className="mt-4 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                    現在利用中
                  </span>
                )}
              </div>

              {/* Starterプランカード（おすすめ・強い枠線・薄影） */}
              <div className="min-h-[300px] rounded-2xl border-2 border-[var(--mg-accent)]/40 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-[var(--mg-accent)]/50 dark:bg-zinc-900/90 dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] sm:p-6">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block rounded-full bg-[var(--mg-accent)] px-2.5 py-1 text-xs font-medium text-white">
                    おすすめ
                  </span>
                  <span className="inline-block rounded-full bg-zinc-200 px-2 py-1 text-xs font-medium text-[var(--mg-muted)] dark:bg-zinc-700 dark:text-zinc-400">
                    続けて主催したい方におすすめ
                  </span>
                </div>
                <h4 className="mt-4 text-lg font-bold text-[var(--mg-ink)] sm:text-xl">
                  Starterプラン（月額980円）
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mg-muted)]">
                  継続してイベントを主催したい方向けの基本プランです。
                  無料プランよりも、公開や管理をスムーズに進めやすくなります。
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[var(--mg-ink)]">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> 継続して主催しやすい
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> 公開や管理がスムーズ
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> これからの運営にちょうどいい
                  </li>
                </ul>
                {data.organizer.subscription_status === "active" ? (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                      現在利用中
                    </span>
                    <p className="text-sm text-[var(--mg-muted)]">
                      次回更新：
                      {data.organizer.current_period_end
                        ? new Date(data.organizer.current_period_end).toLocaleDateString("ja-JP")
                        : "-"}
                    </p>
                    <button
                      type="button"
                      onClick={handlePortal}
                      disabled={portalLoading}
                      className="flex h-11 w-full min-h-[44px] items-center justify-center rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 sm:w-auto"
                    >
                      {portalLoading ? "処理中..." : "プランを変更"}
                    </button>
                  </div>
                ) : data.organizer.subscription_status === "past_due" ? (
                  <div className="mt-6">
                    <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                      要対応
                    </span>
                    <p className="mt-2 text-sm text-[var(--mg-muted)]">
                      支払いエラー（カード情報を確認してください）
                    </p>
                    <button
                      type="button"
                      onClick={handlePortal}
                      disabled={portalLoading}
                      className="mt-4 flex min-h-[var(--mg-touch-min)] w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
                    >
                      {portalLoading ? "処理中..." : "カードを確認"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
                    >
                      {checkoutLoading ? "処理中..." : "Starterプランに加入する"}
                    </button>
                    <a
                      href="#plan-detail"
                      className="flex items-center justify-center text-sm font-semibold text-[var(--mg-accent)] underline hover:no-underline sm:w-auto"
                    >
                      プラン比較を見る
                    </a>
                  </div>
                )}
              </div>
              </div>
            </section>

            {/* ========== 4. プラン比較表 ========== */}
            <section id="plan-detail" className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-[var(--border)] dark:border-zinc-700">
                <div className="border-b border-[var(--border)] bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80">
                  <h4 className="px-4 py-3 text-sm font-semibold text-[var(--mg-ink)] sm:px-4 sm:py-3">プラン比較</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[280px] text-[13px] sm:text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80">
                          <th className="p-3 pr-3 text-left font-medium text-[var(--mg-muted)] sm:p-[14px_16px]"></th>
                          <th className="p-3 text-center font-medium text-[var(--mg-ink)] sm:p-[14px_16px]">無料プラン</th>
                          <th className="p-3 text-center font-medium text-[var(--mg-accent)] sm:p-[14px_16px]">Starterプラン</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--mg-ink)]">
                        <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                          <td className="p-3 font-medium sm:p-[14px_16px]">月額料金</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">0円</td>
                          <td className="p-3 text-center font-medium sm:p-[14px_16px]">月額980円</td>
                        </tr>
                        <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                          <td className="p-3 font-medium sm:p-[14px_16px]">公開枠</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">1件まで</td>
                          <td className="p-3 text-center font-medium sm:p-[14px_16px]">続けて主催したい方向け</td>
                        </tr>
                        <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                          <td className="p-3 font-medium sm:p-[14px_16px]">イベント作成</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">使える</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">使える</td>
                        </tr>
                        <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                          <td className="p-3 font-medium sm:p-[14px_16px]">募集管理</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">使える</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">使える</td>
                        </tr>
                        <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                          <td className="p-3 font-medium sm:p-[14px_16px]">チャット</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">使える</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">使える</td>
                        </tr>
                        <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                          <td className="p-3 font-medium sm:p-[14px_16px]">売上受取</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">設定して使える</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">設定して使える</td>
                        </tr>
                        <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                          <td className="p-3 font-medium sm:p-[14px_16px]">協賛受付</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">対応</td>
                          <td className="p-3 text-center sm:p-[14px_16px]">対応</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium sm:p-[14px_16px]">おすすめ</td>
                          <td className="p-3 text-center text-[var(--mg-muted)] sm:p-[14px_16px]">まずは気軽に始めたい方</td>
                          <td className="p-3 text-center font-medium text-[var(--mg-accent)] sm:p-[14px_16px]">続けて主催したい方</td>
                        </tr>
                      </tbody>
                    </table>
                </div>
              </div>

              {/* 早期登録キャンペーン（Founder外） */}
              {data.organizer.earlybird_eligible &&
                data.organizer.full_feature_trial_end_at &&
                !isFounderActive(data) && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      早期登録キャンペーン：全機能無料
                    </p>
                    <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                      {new Date(data.organizer.full_feature_trial_end_at).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      まで
                    </p>
                  </div>
                )}
            </section>

            {/* ========== 5. 売上の受取設定カード ========== */}
            <section id="receiving-section" className="space-y-4">
              <h3 className="text-xl font-bold text-[var(--mg-ink)]">売上の受取設定</h3>
              {data.organizer.stripe_account_charges_enabled ? (
                <>
                  <p className="text-sm leading-relaxed text-[var(--mg-muted)]">
                    Stripeの設定が完了しています。
                    参加費や協賛金の受け取りを開始できます。
                  </p>
                  <div className="rounded-2xl border border-[var(--border)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90 sm:p-6">
                    <ul className="space-y-2 text-sm leading-relaxed text-[var(--mg-ink)]">
                      <li className="flex items-center gap-2">
                        <span className="text-[var(--mg-muted)]">状態：</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">設定済み</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[var(--mg-muted)]">本人確認：</span>
                        完了
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[var(--mg-muted)]">振込先口座：</span>
                        登録済み
                      </li>
                    </ul>
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={connectLoading}
                      className="mt-5 flex h-11 w-full items-center justify-center rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50"
                    >
                      {connectLoading ? "処理中..." : "設定内容を確認する"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-[var(--mg-muted)]">
                    参加費や協賛金を受け取るには、Stripeの設定が必要です。
                    現在はまだ設定が完了していないため、売上の受け取りは開始されていません。
                  </p>
                  <div className="rounded-2xl border border-[var(--border)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90 sm:p-6">
                    <ul className="space-y-2 text-sm leading-relaxed text-[var(--mg-ink)]">
                      <li className="flex items-center gap-2">
                        <span className="text-[var(--mg-muted)]">状態：</span>
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">未設定</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[var(--mg-muted)]">受け取り：</span>
                        未開始
                      </li>
                    </ul>
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={connectLoading}
                      className="mt-5 flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {connectLoading ? "処理中..." : "Stripeを設定する"}
                    </button>
                  </div>
                </>
              )}
            </section>

            {/* ========== 6. 先着特典カード（補足・下部） ========== */}
            {isFounderActive(data) && (
              <section className="rounded-2xl border border-[var(--border)] bg-zinc-50/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-[var(--mg-ink)]">先着特典</h3>
                <p className="mt-2 text-sm font-semibold text-[var(--mg-ink)]">
                  先着特典 適用中
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--mg-muted)]">
                  先着でご利用中の主催者向け特典が適用されています。
                  特典期間中は、公開に使える特典枠を利用できます。
                </p>
                <ul className="mt-3 space-y-1 text-sm text-[var(--mg-muted)]">
                  <li>
                    特典の公開枠：{getFounderBonusSlotsUsed(data.monthlyPublished)}/{FOUNDER_BONUS_SLOTS}
                  </li>
                  <li>
                    特典終了日：{new Date(data.organizer.founder30_end_at!).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </li>
                </ul>
              </section>
            )}

            {/* ========== 7. ページ最下部の案内ボックス ========== */}
            {!data.organizer.stripe_account_charges_enabled && (
              <section className="rounded-[14px] border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
                <p className="text-sm leading-relaxed text-[var(--mg-ink)]">
                  有料イベントやスポンサー支援を受けるには、先にStripe設定を完了してください。
                </p>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connectLoading}
                  className="mt-5 flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
                >
                  {connectLoading ? "処理中..." : "設定をはじめる"}
                </button>
              </section>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
