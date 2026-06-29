"use client";

import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerPayoutsHero } from "@/components/organizer/payouts/OrganizerPayoutsHero";
import { useOrganizerBilling } from "@/hooks/use-organizer-billing";

function showStripeConnectResetCta(error: string | null): boolean {
  if (!error) return false;
  if (/Livemode requests must always be redirected via HTTPS/i.test(error)) return false;
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

const FLOW_STEPS = [
  {
    title: "アカウント連携",
    sub: "既存のStripeアカウントがあればそのまま連携できます",
    icon: "/organizer/payouts/step-account.png",
  },
  {
    title: "口座情報の登録",
    sub: "売上の振り込み先となる銀行口座を登録します",
    icon: "/organizer/payouts/step-bank.png",
  },
  {
    title: "本人確認の完了",
    sub: "Stripeの審査が完了すると受け取りが開始されます",
    icon: "/organizer/payouts/step-verify.png",
  },
] as const;

const PROGRESS_STEPS = [
  {
    key: "account",
    label: "アカウント連携",
    incomplete: "Stripeアカウントの作成または連携が完了していません",
    complete: "Stripeアカウントの連携が完了しています",
    icon: "/organizer/payouts/step-account.png",
  },
  {
    key: "bank",
    label: "口座情報の登録",
    incomplete: "銀行口座の登録が完了していません",
    complete: "銀行口座の登録が完了しています",
    icon: "/organizer/payouts/step-bank.png",
  },
  {
    key: "verify",
    label: "本人確認",
    incomplete: "本人確認が完了していません",
    complete: "本人確認が完了しています",
    icon: "/organizer/payouts/step-verify.png",
  },
] as const;

const NOTE_ITEMS_LEFT = [
  "売上受取設定は、主催者プラン（公開枠）とは別の設定です",
  "Stripeの審査には数日かかる場合があります",
] as const;

const NOTE_ITEMS_RIGHT = [
  "有料イベントを公開するには、事前にStripeの設定を完了してください",
  "振込手数料等はStripeの利用規約に準じます",
] as const;

/** Tailwind でグリッドを明示（globals.css だけに依存しない） */
const PAYOUTS_GRID =
  "grid grid-cols-1 gap-2.5 min-[720px]:grid-cols-2 min-[720px]:items-stretch min-[720px]:gap-3";
const PAYOUTS_CARD =
  "org-payouts-card flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border border-[#dde8df] bg-white p-3 shadow-[0_2px_10px_rgba(26,34,20,0.05)] sm:p-3.5";
const PAYOUTS_NOTES =
  "org-payouts-notes rounded-[14px] border border-[#dde8df] bg-white p-3 shadow-[0_2px_8px_rgba(26,34,20,0.04)] sm:p-3.5";

function PayoutsFlowStepper() {
  return (
    <div className="mb-2.5 rounded-[10px] border border-[#eef2ee] bg-[#fafbfa] p-2">
      <div className="flex items-start justify-between gap-0.5">
        {FLOW_STEPS.map((step, i) => (
          <Fragment key={step.title}>
            <div className="flex min-w-0 flex-1 flex-col items-center px-0.5 text-center">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2d7a4f] text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <p className="mt-1.5 text-[9px] font-bold leading-tight text-[#1a2214] sm:text-[10px]">
                {step.title}
              </p>
            </div>
            {i < FLOW_STEPS.length - 1 ? (
              <span
                className="mt-1.5 flex w-3 shrink-0 items-start justify-center text-[12px] leading-none text-[#c5d4c8]"
                aria-hidden
              >
                ›
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function PayoutIcon({
  src,
  size = 40,
  className = "",
}: {
  src: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-contain ${className}`}
      style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
      unoptimized
    />
  );
}

function getProgressState(organizer: {
  stripe_account_charges_enabled?: boolean;
  stripe_account_details_submitted?: boolean;
}) {
  const charges = Boolean(organizer.stripe_account_charges_enabled);
  const details = Boolean(organizer.stripe_account_details_submitted);
  return {
    account: charges || details,
    bank: details || charges,
    verify: charges,
  };
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

  if (loading) {
    return (
      <OrganizerPageShell
        className="org-payouts-page"
        contentClassName="mx-auto w-full max-w-6xl space-y-3"
      >
        <div className="h-12 animate-pulse rounded-xl bg-[#e4ede0] min-[900px]:h-16" />
        <div className={PAYOUTS_GRID}>
          <div className="h-36 animate-pulse rounded-2xl bg-[#d8e8dc]" />
          <div className="h-36 animate-pulse rounded-2xl bg-[#d8e8dc]" />
          <div className="h-36 animate-pulse rounded-2xl bg-[#d8e8dc]" />
          <div className="h-36 animate-pulse rounded-2xl bg-[#d8e8dc]" />
        </div>
      </OrganizerPageShell>
    );
  }

  const isConnected = Boolean(data?.organizer.stripe_account_charges_enabled);
  const stripeConfigured = Boolean(data?.stripeConnectConfigured);
  const progress = data ? getProgressState(data.organizer) : { account: false, bank: false, verify: false };
  const allProgressDone = progress.account && progress.bank && progress.verify;

  return (
    <OrganizerPageShell
      className="org-payouts-page"
      contentClassName="mx-auto w-full max-w-6xl space-y-3 min-[900px]:space-y-3"
    >
      <OrganizerWorkspacePageHeader
        className="min-[900px]:hidden"
        title="売上受取設定"
        subtitle="Stripeで参加費などの売上を受け取るための設定です。"
      />
      <div className="hidden min-[900px]:block">
        <OrganizerPayoutsHero />
      </div>

      <div className="w-full space-y-2.5 min-[900px]:space-y-3">
        {error && data && data.stripeConnectConfigured !== false && (
          <div className="org-payouts-alert org-payouts-alert--error" role="alert">
            <p>{error}</p>
            {showStripeAppUrlHttpsHint(error) && (
              <p className="mt-1.5 text-[11px] leading-snug opacity-90">
                Vercel の環境変数 <code className="rounded bg-white/90 px-1 py-0.5 text-[10px]">APP_URL</code> が{" "}
                <code className="text-[10px]">http://</code> で始まっていると本番で失敗します。{" "}
                <code className="text-[10px]">https://www.machiglyph.jp</code> のように <strong>https</strong>{" "}
                で保存し、再デプロイしてください。
              </p>
            )}
            {showStripeConnectResetCta(error) && (
              <button
                type="button"
                onClick={handleResetStripeConnect}
                disabled={resetConnectLoading}
                className="org-payouts-alert__btn mt-2"
              >
                {resetConnectLoading ? "処理中..." : "連携をやり直す（古いStripeアカウント紐付けを消去）"}
              </button>
            )}
          </div>
        )}

        {data && !stripeConfigured && (
          <div className="org-payouts-alert org-payouts-alert--warn">
            <p className="font-semibold">売上受取の決済連携が、サイト側でまだ有効になっていません</p>
            <p className="mt-1 text-[11px] leading-snug">
              本番の環境変数に{" "}
              <code className="rounded bg-white/80 px-1 py-0.5 text-[10px]">STRIPE_SECRET_KEY</code>{" "}
              を設定し、再デプロイしてください。
            </p>
          </div>
        )}

        {data && (
          <>
            <div className={PAYOUTS_GRID}>
              {/* 左上：Stripeで売上を受け取る */}
              <section className={PAYOUTS_CARD} aria-labelledby="payouts-intro-heading">
                <div className="org-payouts-card__header mb-2 flex items-center gap-2">
                  <PayoutIcon src="/organizer/payouts/stripe-intro.png" size={32} />
                  <h2 id="payouts-intro-heading" className="org-payouts-card__title text-[13px] font-bold text-[#1a2214]">
                    Stripeで売上を受け取る
                  </h2>
                </div>
                <p className="flex-1 text-[11px] leading-relaxed text-[#566358]">
                  参加費や協賛金を受け取るには、Stripe アカウントの連携が必要です。料金プラン（公開枠）とは別の設定です。
                </p>
                <Link
                  href="/organizer/settings/plan"
                  className="org-payouts-card__link mt-auto inline-flex w-full items-center justify-center rounded-[10px] border border-[#2d7a4f] bg-white py-2 text-[11px] font-semibold text-[#2d7a4f] transition-opacity hover:opacity-85"
                >
                  料金プラン・公開枠はこちら ＞
                </Link>
              </section>

              {/* 右上：Stripe 設定の流れ */}
              <section className={`${PAYOUTS_CARD} org-payouts-card--stripe`} aria-labelledby="payouts-stripe-heading">
                <div className="org-payouts-stripe-head mb-2 flex shrink-0 items-center gap-2.5">
                  <PayoutIcon src="/organizer/payouts/stripe-logo.png" size={40} className="!rounded-xl" />
                  <div className="min-w-0">
                    <div id="payouts-stripe-heading" className="org-payouts-stripe-head__name text-[15px] font-bold text-[#635bff]">
                      Stripe
                    </div>
                    <p className="org-payouts-stripe-head__sub text-[10px] text-[#7a6a58]">安全な決済インフラで売上を管理</p>
                  </div>
                </div>

                {isConnected ? (
                  <div className="flex flex-1 flex-col">
                    <div className="mb-2 flex items-center gap-2 rounded-[10px] border border-[#c5dfc5] bg-[#eaf4ed] p-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2d7a4f] text-white" aria-hidden>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-[12px] font-semibold text-[#2d7a4f]">Stripe 連携済み</p>
                        <p className="text-[10px] text-[#566358]">売上の受け取りが有効です</p>
                      </div>
                    </div>
                    <p className="mb-2 flex-1 text-[11px] leading-relaxed text-[#566358]">
                      Stripeアカウントとの連携が完了しています。参加費や協賛金の受け取りが可能です。
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleConnect}
                        disabled={connectLoading || !stripeConfigured}
                        className="rounded-[8px] bg-[#2f4a7e] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                      >
                        {connectLoading ? "処理中..." : "Stripeダッシュボードを開く"}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetStripeConnect}
                        disabled={resetConnectLoading}
                        className="rounded-[8px] border border-[#e8e0d4] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#43382d] disabled:opacity-50"
                      >
                        {resetConnectLoading ? "処理中..." : "連携を解除する"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col">
                    <p className="mb-1.5 text-[12px] font-bold text-[#1a2214]">設定の流れ</p>
                    <PayoutsFlowStepper />
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={connectLoading || !stripeConfigured}
                      className="mt-auto flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#2d7a4f] px-3.5 py-2.5 text-[12px] font-bold text-white shadow-[0_2px_8px_rgba(45,122,79,0.24)] hover:opacity-92 disabled:opacity-50"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                        <rect x="1" y="4" width="22" height="16" rx="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      {connectLoading ? "処理中..." : "Stripeで売上を受け取る（設定を始める）"}
                    </button>
                  </div>
                )}
              </section>

              {/* 左下：受取の状態 */}
              <section className={PAYOUTS_CARD} aria-labelledby="payouts-status-heading">
                <div className="org-payouts-card__header mb-2 flex items-center gap-2">
                  <PayoutIcon src="/organizer/payouts/payout-status.png" size={32} />
                  <h2 id="payouts-status-heading" className="org-payouts-card__title text-[13px] font-bold text-[#1a2214]">
                    受取の状態
                  </h2>
                </div>
                <div className="flex flex-1 flex-col">
                <div className="flex flex-col divide-y divide-[#eef2ee]">
                  <div className="flex items-center justify-between gap-2 py-2">
                    <span className="text-[11px] text-[#7a8a7e]">状態：</span>
                    {isConnected ? (
                      <span className="rounded-full bg-[#eaf4ed] px-2.5 py-0.5 text-[10px] font-bold text-[#2d7a4f]">
                        設定済み
                      </span>
                    ) : (
                      <span className="rounded-full border border-[#e7d39a] bg-[#fff8e6] px-2.5 py-0.5 text-[10px] font-bold text-[#7a5800]">
                        未設定
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2">
                    <span className="text-[11px] text-[#7a8a7e]">受け取り：</span>
                    <span className="text-[12px] font-semibold text-[#1a2214]">
                      {isConnected ? "受け取り可能" : "未開始"}
                    </span>
                  </div>
                </div>
                {!isConnected && (
                  <div className="mt-auto flex items-start gap-2 rounded-[10px] border border-dashed border-[#e7d39a] bg-[#fffaf0] p-2.5 pt-2">
                    <PayoutIcon src="/organizer/payouts/alert.png" size={18} className="mt-0.5 shrink-0" />
                    <p className="text-[10px] leading-relaxed text-[#72530f]">
                      参加費や協賛金の受け取りには Stripe の設定が必要です。現在はまだ完了していないため、売上の受け取りは開始されていません。
                    </p>
                  </div>
                )}
                </div>
              </section>

              {/* 右下：設定の進捗状況 */}
              <section className={`${PAYOUTS_CARD} org-payouts-card--progress`} aria-labelledby="payouts-progress-heading">
                <div className="org-payouts-card__header mb-2 flex items-center gap-2">
                  <PayoutIcon src="/organizer/payouts/progress-flag.png" size={32} />
                  <h2 id="payouts-progress-heading" className="org-payouts-card__title text-[13px] font-bold text-[#1a2214]">
                    設定の進捗状況
                  </h2>
                </div>
                <div className="flex flex-1 gap-2">
                  <ol className="min-w-0 flex-1 space-y-2">
                    {PROGRESS_STEPS.map((step) => {
                      const done = progress[step.key as keyof typeof progress];
                      return (
                        <li key={step.key} className="flex items-center gap-2">
                          <PayoutIcon
                            src={step.icon}
                            size={24}
                            className={done ? "" : "opacity-40"}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-[#1a2214]">{step.label}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              done
                                ? "bg-[#eaf4ed] text-[#2d7a4f]"
                                : "bg-[#f0f2f0] text-[#9aab9e]"
                            }`}
                          >
                            {done ? "完了" : "未完了"}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="hidden w-[80px] shrink-0 flex-col items-center justify-center gap-1 min-[720px]:flex" aria-hidden>
                    <PayoutIcon
                      src="/organizer/payouts/progress-clipboard.png"
                      size={64}
                      className="opacity-85"
                    />
                    {!allProgressDone ? (
                      <span className="rounded-full border border-[#e8e0d4] bg-[#faf8f5] px-1.5 py-0.5 text-center text-[8px] font-bold leading-tight text-[#7a6a58]">
                        まだ完了していません
                      </span>
                    ) : (
                      <span className="rounded-full border border-[#c5dfc5] bg-[#eaf4ed] px-1.5 py-0.5 text-center text-[8px] font-bold leading-tight text-[#2d7a4f]">
                        設定完了
                      </span>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* ご注意 */}
            <section className={PAYOUTS_NOTES} aria-label="ご注意">
              <div className="org-payouts-notes__head flex items-center gap-2 mb-2">
                <PayoutIcon src="/organizer/payouts/alert.png" size={22} />
                <h2 className="org-payouts-notes__title text-[12px] font-bold text-[#1a2214]">ご注意</h2>
              </div>
              <div className="grid grid-cols-1 gap-2 min-[720px]:grid-cols-2 min-[720px]:gap-4">
                <ul className="space-y-1 text-[10px] leading-relaxed text-[#566358] [&_li]:relative [&_li]:pl-3 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-[#9aab9e] [&_li]:before:content-['•']">
                  {NOTE_ITEMS_LEFT.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <ul className="space-y-1 text-[10px] leading-relaxed text-[#566358] [&_li]:relative [&_li]:pl-3 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-[#9aab9e] [&_li]:before:content-['•']">
                  {NOTE_ITEMS_RIGHT.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}

        {!data && !loading && error && (
          <p className="text-[12px] text-red-600 sm:text-sm">{error}</p>
        )}
      </div>
    </OrganizerPageShell>
  );
}
