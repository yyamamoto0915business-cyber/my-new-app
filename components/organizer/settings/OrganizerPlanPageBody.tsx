"use client";

import { useState } from "react";
import Link from "next/link";
import { OrganizerHeader } from "@/components/organizer/organizer-header";
import { useOrganizerBilling } from "@/hooks/use-organizer-billing";
import {
  getPlanLabel,
  isPaidPlan,
  isFounderActive,
  getNormalSlotsUsed,
  getFounderBonusSlotsUsed,
  NORMAL_SLOTS,
  FOUNDER_BONUS_SLOTS_UI,
} from "@/lib/organizer-billing-display";

export function OrganizerPlanPageBody() {
  const {
    data,
    loading,
    error,
    checkoutLoading,
    portalLoading,
    handleCheckout,
    handlePortal,
  } = useOrganizerBilling();
  const [billingAgreed, setBillingAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <OrganizerHeader
        title="主催者プラン（公開枠）"
        description="イベントの公開枠に関するプランです。プランの比較やアップグレード、お支払いの管理ができます"
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
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : data ? (
          <div className="flex flex-col gap-8">
            <section
              className="min-h-[200px] rounded-2xl border border-[var(--mg-accent)]/25 bg-gradient-to-br from-[var(--accent-soft)]/50 via-[var(--mg-accent-soft)]/30 to-[var(--mg-paper)] p-4 shadow-[var(--mg-shadow)] dark:from-[var(--accent-soft)]/25 dark:via-[var(--mg-accent-soft)]/15 dark:to-[var(--mg-paper)] sm:p-6"
              aria-labelledby="summary-heading"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[var(--mg-ink)] shadow-sm dark:bg-zinc-800/90 dark:text-zinc-100">
                  プラン・公開枠
                </span>
                {!isPaidPlan(data) && (
                  <span className="inline-flex rounded-full bg-amber-100/90 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                    無料プラン利用中
                  </span>
                )}
              </div>
              <h2 id="summary-heading" className="mt-3 text-lg font-bold text-[var(--mg-ink)] sm:text-xl">
                現在の利用状況
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-[var(--mg-ink)]">
                <li className="flex gap-2">
                  <span className="text-[var(--mg-muted)]">現在のプラン：</span>
                  <span className="font-semibold">{getPlanLabel(data)}</span>
                </li>
                {!isPaidPlan(data) && (
                  <li className="flex gap-2">
                    <span className="text-[var(--mg-muted)]">毎月使える公開枠：</span>
                    <span className="font-semibold">
                      {getNormalSlotsUsed(data.monthlyPublished)}/{NORMAL_SLOTS}
                    </span>
                  </li>
                )}
                {!isPaidPlan(data) && isFounderActive(data) && (
                  <>
                    <li className="flex gap-2">
                      <span className="text-[var(--mg-muted)]">特典の公開枠：</span>
                      <span className="font-semibold">
                        {getFounderBonusSlotsUsed(data.monthlyPublished)}/{FOUNDER_BONUS_SLOTS_UI}
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[var(--mg-muted)]">今月公開できる件数：</span>
                      <span className="font-semibold">
                        最大{NORMAL_SLOTS + FOUNDER_BONUS_SLOTS_UI}件
                      </span>
                    </li>
                  </>
                )}
              </ul>
              <p className="mt-4 text-sm text-[var(--mg-muted)]">
                売上の受け取り（Stripe）は{" "}
                <Link
                  href="/organizer/settings/payouts"
                  className="font-medium text-[var(--mg-accent)] underline underline-offset-2 hover:no-underline"
                >
                  売上受取設定
                </Link>
                で行います。
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <a
                  href="#recommended-plan"
                  className="order-1 flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:opacity-90 sm:w-auto"
                >
                  プランを変更する
                </a>
              </div>
            </section>

            {!isPaidPlan(data) && (
              <section className="rounded-[14px] border border-[var(--border)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90">
                <h3 className="text-base font-bold text-[var(--mg-ink)]">無料プランと Starter の違い</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mg-muted)]">
                  無料プランでは毎月の公開枠に上限があります。より多くのイベントを公開したい場合は、下のプランから Starter へアップグレードしてください。
                </p>
              </section>
            )}

            <section id="recommended-plan" className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--mg-ink)] sm:text-[22px]">プランを選ぶ</h3>
              <p className="text-sm text-[var(--mg-muted)]">
                ご利用に合わせてプランをお選びください。アップグレードはカード決済でお手続きできます。
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-h-[220px] rounded-2xl border border-[#eaeaea] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90 sm:p-6">
                  <span className="inline-block rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-[var(--mg-muted)] dark:bg-zinc-700 dark:text-zinc-400">
                    まずは気軽に始めたい方におすすめ
                  </span>
                  <h4 className="mt-4 text-lg font-bold text-[var(--mg-ink)] sm:text-xl">無料プラン</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--mg-muted)]">
                    まずは気軽に主催を始めたい方向けのプランです。
                    毎月1件まで無料で公開できます。
                  </p>
                  {!isPaidPlan(data) && (
                    <span className="mt-4 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                      現在利用中
                    </span>
                  )}
                  {isPaidPlan(data) && (
                    <p className="mt-6 text-sm text-[var(--mg-muted)]">—</p>
                  )}
                </div>

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
                    公開枠の制限なく、運営をスムーズに進めやすくなります。
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-[var(--mg-ink)]">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> 公開枠を気にせず公開しやすい
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> 継続的な主催に向いたプラン
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> お支払いは Stripe で安全に管理
                    </li>
                  </ul>
                  {isPaidPlan(data) ? (
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
                        {portalLoading ? "処理中..." : "お支払い・プランを管理する"}
                      </button>
                    </div>
                  ) : data.organizer.subscription_status === "past_due" ? (
                    <div className="mt-6">
                      <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                        要対応
                      </span>
                      <p className="mt-2 text-sm text-[var(--mg-muted)]">
                        お支払いでエラーが発生しています。カード情報をご確認ください。
                      </p>
                      <button
                        type="button"
                        onClick={handlePortal}
                        disabled={portalLoading}
                        className="mt-4 flex min-h-[var(--mg-touch-min)] w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
                      >
                        {portalLoading ? "処理中..." : "カード情報を確認する"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        <p className="text-xs leading-relaxed text-slate-500">
                          お申し込み前に、
                          <Link href="/terms" target="_blank" className="text-slate-700 underline underline-offset-2 hover:text-[var(--mg-accent)]">
                            利用規約
                          </Link>
                          、
                          <Link href="/commerce" target="_blank" className="text-slate-700 underline underline-offset-2 hover:text-[var(--mg-accent)]">
                            特定商取引法に基づく表記
                          </Link>
                          、
                          <Link href="/terms#cancellation" target="_blank" className="text-slate-700 underline underline-offset-2 hover:text-[var(--mg-accent)]">
                            キャンセル条件
                          </Link>
                          をご確認ください。
                        </p>
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={billingAgreed}
                            onChange={(e) => setBillingAgreed(e.target.checked)}
                            className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-slate-300"
                          />
                          <span className="text-[13px] leading-relaxed text-slate-700">
                            <Link href="/terms" target="_blank" className="font-medium text-[var(--mg-ink)] underline underline-offset-2 hover:text-[var(--mg-accent)]">
                              利用規約
                            </Link>
                            ・
                            <Link href="/commerce" target="_blank" className="font-medium text-[var(--mg-ink)] underline underline-offset-2 hover:text-[var(--mg-accent)]">
                              特定商取引法に基づく表記
                            </Link>
                            ・
                            <Link href="/terms#cancellation" target="_blank" className="font-medium text-[var(--mg-ink)] underline underline-offset-2 hover:text-[var(--mg-accent)]">
                              キャンセル条件
                            </Link>
                            を確認し、同意します
                          </span>
                        </label>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <button
                          type="button"
                          onClick={handleCheckout}
                          disabled={checkoutLoading || !billingAgreed}
                          className="flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
                        >
                          {checkoutLoading ? "処理中..." : "このプランを選ぶ（アップグレード）"}
                        </button>
                        <a
                          href="#plan-detail"
                          className="flex items-center justify-center text-sm font-semibold text-[var(--mg-accent)] underline hover:no-underline sm:w-auto"
                        >
                          プラン比較を見る
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section id="plan-detail" className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-[var(--border)] dark:border-zinc-700">
                <div className="border-b border-[var(--border)] bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80">
                  <h4 className="px-4 py-3 text-sm font-semibold text-[var(--mg-ink)] sm:px-4 sm:py-3">プラン比較</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[280px] text-[13px] sm:text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80">
                        <th className="p-3 pr-3 text-left font-medium text-[var(--mg-muted)] sm:p-[14px_16px]" />
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
                        <td className="p-3 text-center sm:p-[14px_16px]">毎月1件まで</td>
                        <td className="p-3 text-center font-medium sm:p-[14px_16px]">制限なし</td>
                      </tr>
                      <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                        <td className="p-3 font-medium sm:p-[14px_16px]">イベント作成</td>
                        <td className="p-3 text-center sm:p-[14px_16px]">利用可能</td>
                        <td className="p-3 text-center sm:p-[14px_16px]">利用可能</td>
                      </tr>
                      <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                        <td className="p-3 font-medium sm:p-[14px_16px]">スタッフ募集管理</td>
                        <td className="p-3 text-center sm:p-[14px_16px]">利用可能</td>
                        <td className="p-3 text-center sm:p-[14px_16px]">利用可能</td>
                      </tr>
                      <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                        <td className="p-3 font-medium sm:p-[14px_16px]">チャット</td>
                        <td className="p-3 text-center sm:p-[14px_16px]">利用可能</td>
                        <td className="p-3 text-center sm:p-[14px_16px]">利用可能</td>
                      </tr>
                      <tr className="border-b border-[var(--border)] dark:border-zinc-600">
                        <td className="p-3 font-medium sm:p-[14px_16px]">売上受取（Stripe）</td>
                        <td className="p-3 text-center sm:p-[14px_16px]">別途設定</td>
                        <td className="p-3 text-center sm:p-[14px_16px]">別途設定</td>
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

            {isFounderActive(data) && (
              <section className="rounded-2xl border border-[var(--border)] bg-zinc-50/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-[var(--mg-ink)]">先着特典</h3>
                <p className="mt-2 text-sm font-semibold text-[var(--mg-ink)]">先着特典 適用中</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--mg-muted)]">
                  先着でご利用中の主催者向け特典が適用されています。
                  特典期間中は、公開に使える特典枠を利用できます。
                </p>
                <ul className="mt-3 space-y-1 text-sm text-[var(--mg-muted)]">
                  <li>
                    特典の公開枠：{getFounderBonusSlotsUsed(data.monthlyPublished)}/{FOUNDER_BONUS_SLOTS_UI}
                  </li>
                  <li>
                    特典終了日：
                    {new Date(data.organizer.founder30_end_at!).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </li>
                </ul>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
              <h3 className="text-base font-semibold text-[var(--mg-ink)]">参加費・協賛金の受け取り</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mg-muted)]">
                カード決済での売上受け取りは、主催者プラン（公開枠）とは別に「売上受取設定」で Stripe を連携します。
              </p>
              <Link
                href="/organizer/settings/payouts"
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                売上受取設定を開く
              </Link>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
