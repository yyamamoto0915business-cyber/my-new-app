"use client";

import Link from "next/link";
import { OrganizerHeader } from "@/components/organizer/organizer-header";
import { useOrganizerBilling } from "@/hooks/use-organizer-billing";
import { getReceivingStatus } from "@/lib/organizer-billing-display";

function showStripeConnectResetCta(error: string | null): boolean {
  if (!error) return false;
  // リセットでは直らない（APP_URL / HTTPS の問題）
  if (/Livemode requests must always be redirected via HTTPS/i.test(error)) {
    return false;
  }
  return (
    /Stripe 連携エラー/i.test(error) ||
    /保存されている Stripe 連携先/i.test(error) ||
    /連携先が、いまの秘密鍵/i.test(error) ||
    /not connected to your platform/i.test(error)
  );
}

function showStripeAppUrlHttpsHint(error: string | null): boolean {
  if (!error) return false;
  return /Livemode requests must always be redirected via HTTPS/i.test(error);
}

export function OrganizerPayoutsPageBody() {
  const {
    data,
    loading,
    error,
    connectLoading,
    resetConnectLoading,
    handleConnect,
    handleResetStripeConnect,
  } = useOrganizerBilling();

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <OrganizerHeader
        title="売上受取設定"
        description="Stripeで売上を受け取るための連携・口座設定を行います"
        titleClassName="text-[22px] font-bold sm:text-[28px]"
        descriptionClassName="text-[13px] sm:text-sm"
        backHref="/organizer/settings"
        backLabel="← 設定へ"
        showMessages={false}
        showPrimaryCta={false}
      />
      <main className="mx-auto max-w-[960px] px-4 pb-24 pt-6 sm:px-6">
        {loading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
        ) : data ? (
          <div className="flex flex-col gap-8">
            {error && data.stripeConnectConfigured !== false ? (
              <div
                className="rounded-2xl border border-red-200/90 bg-red-50/90 p-4 dark:border-red-900/40 dark:bg-red-950/25 sm:p-5"
                role="alert"
              >
                <p className="text-sm leading-relaxed text-red-800 dark:text-red-200">{error}</p>
                {showStripeAppUrlHttpsHint(error) ? (
                  <p className="mt-3 text-sm leading-relaxed text-red-900/90 dark:text-red-100/90">
                    Vercel の環境変数{" "}
                    <code className="rounded bg-white/90 px-1 py-0.5 text-xs dark:bg-zinc-900/90">
                      APP_URL
                    </code>{" "}
                    が <code className="text-xs">http://</code>{" "}
                    で始まっていると本番で失敗します。{" "}
                    <code className="text-xs">https://www.machiglyph.jp</code>{" "}
                    のように <strong>https</strong> で保存し、再デプロイしてください。
                  </p>
                ) : null}
                {showStripeConnectResetCta(error) ? (
                  <button
                    type="button"
                    onClick={handleResetStripeConnect}
                    disabled={resetConnectLoading}
                    className="mt-4 flex h-11 w-full items-center justify-center rounded-[10px] border border-red-300/80 bg-white px-4 text-sm font-semibold text-red-900 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-100 dark:hover:bg-zinc-800 sm:w-auto"
                  >
                    {resetConnectLoading
                      ? "処理中..."
                      : "連携をやり直す（古い Stripe アカウント紐付けを消去）"}
                  </button>
                ) : null}
              </div>
            ) : null}
            {!data.stripeConnectConfigured ? (
              <section
                className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-5 shadow-sm dark:border-amber-800/40 dark:bg-amber-950/25 sm:p-6"
                role="status"
              >
                <h2 className="text-base font-bold text-[var(--mg-ink)]">
                  売上受取の決済連携が、サイト側でまだ有効になっていません
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mg-muted)]">
                  参加費や協賛金の受け取りには Stripe のサーバー設定が必要です。こちらから進めてもエラーになる状態です。運営・開発の方は、本番の環境変数に{" "}
                  <code className="rounded bg-white/80 px-1 py-0.5 text-xs dark:bg-zinc-900/80">
                    STRIPE_SECRET_KEY
                  </code>{" "}
                  を設定し、再デプロイしてください。一括反映する場合は{" "}
                  <code className="rounded bg-white/80 px-1 py-0.5 text-xs dark:bg-zinc-900/80">
                    ./scripts/vercel-env-sync.sh
                  </code>{" "}
                  に Stripe 用の変数が含まれています。
                </p>
              </section>
            ) : null}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90 sm:p-6">
              <h2 className="text-lg font-bold text-[var(--mg-ink)]">Stripeで売上を受け取る</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mg-muted)]">
                参加費や協賛金を受け取るには、Stripe アカウントの連携が必要です。料金プラン（公開枠）とは別の設定です。
              </p>
              <p className="mt-3 text-sm">
                <Link
                  href="/organizer/settings/plan"
                  className="font-medium text-[var(--mg-accent)] underline underline-offset-2 hover:no-underline"
                >
                  料金プラン・公開枠
                </Link>
                はこちら
              </p>
            </section>

            <section id="receiving-section" className="space-y-4">
              <h3 className="text-xl font-bold text-[var(--mg-ink)]">受取の状態</h3>
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
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                          {getReceivingStatus(data)}
                        </span>
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
                      disabled={connectLoading || !data.stripeConnectConfigured}
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
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                          {getReceivingStatus(data)}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[var(--mg-muted)]">受け取り：</span>
                        未開始
                      </li>
                    </ul>
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={connectLoading || !data.stripeConnectConfigured}
                      className="mt-5 flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {connectLoading ? "処理中..." : "Stripeで売上を受け取る（設定を始める）"}
                    </button>
                  </div>
                </>
              )}
            </section>

            {data.stripeConnectConfigured && !data.organizer.stripe_account_charges_enabled && (
              <section className="rounded-[14px] border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
                <p className="text-sm leading-relaxed text-[var(--mg-ink)]">
                  有料イベントやスポンサー支援を受けるには、Stripeの設定を完了してください。
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
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : null}
      </main>
    </div>
  );
}
