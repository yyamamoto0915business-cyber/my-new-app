"use client";

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

const SETUP_STEPS = [
  {
    key: "account",
    label: "アカウント連携",
    sub: "Stripeアカウントを作成、または既存のものをつなぐ",
    icon: "/organizer/payouts/step-account.png",
  },
  {
    key: "bank",
    label: "口座情報の登録",
    sub: "売上の振り込み先を登録する",
    icon: "/organizer/payouts/step-bank.png",
  },
  {
    key: "verify",
    label: "本人確認",
    sub: "審査が終わると受け取りが始まる",
    icon: "/organizer/payouts/step-verify.png",
  },
] as const;

const NOTE_ITEMS = [
  "審査には数日かかることがあります",
  "カード売上はだいたい週1回、登録した口座へ振り込まれます。当日すぐには入りません",
  "次の振込日や口座の変更は、「振込日・口座を確認する」から見られます",
  "「ウェブサイト」欄は、公式サイトのほか公開SNS（Instagram・Xなど）で大丈夫です",
  "店舗ページを使う場合は、先に公開してからそのURLを貼ってください",
  "サイトもSNSもない場合は、事業説明に「何を・どこで・どう売る」を書いてください",
  "振込手数料は Stripe の利用規約に準じます",
] as const;

const PAYOUTS_CARD =
  "org-payouts-card flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-[#dde8df] bg-white p-3.5 shadow-[0_2px_10px_rgba(26,34,20,0.05)] max-[899px]:p-3";
const PAYOUTS_NOTES =
  "org-payouts-notes rounded-[14px] border border-[#dde8df] bg-white p-3 shadow-[0_2px_8px_rgba(26,34,20,0.04)] max-[899px]:p-2.5";

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

  function confirmAndResetStripeConnect() {
    const ok = window.confirm(
      "受取連携を解除します。参加費・協賛・レジのカード決済も同じ連携です。振込先を変えるだけなら、「振込日・口座を確認する」から口座を更新してください。よろしいですか？"
    );
    if (!ok) return;
    void handleResetStripeConnect();
  }

  if (loading) {
    return (
      <OrganizerPageShell
        className="org-payouts-page"
        contentClassName="mx-auto w-full max-w-3xl space-y-3"
      >
        <div className="h-12 animate-pulse rounded-xl bg-[#e4ede0] min-[900px]:h-16" />
        <div className="h-52 animate-pulse rounded-2xl bg-[#d8e8dc]" />
      </OrganizerPageShell>
    );
  }

  const isConnected = Boolean(data?.organizer.stripe_account_charges_enabled);
  const stripeConfigured = Boolean(data?.stripeConnectConfigured);
  const progress = data
    ? getProgressState(data.organizer)
    : { account: false, bank: false, verify: false };

  return (
    <OrganizerPageShell
      className="org-payouts-page"
      contentClassName="mx-auto w-full max-w-3xl space-y-2.5 min-[900px]:space-y-3"
    >
      <OrganizerWorkspacePageHeader
        className="min-[900px]:hidden"
        compact
        title="売上受取設定"
        subtitle="カード売上を、登録した口座で受け取る設定です。"
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
                onClick={confirmAndResetStripeConnect}
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
            <section className={PAYOUTS_CARD} aria-labelledby="payouts-main-heading">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <PayoutIcon
                    src="/organizer/payouts/stripe-logo.png"
                    size={36}
                    className="!rounded-xl"
                  />
                  <div className="min-w-0">
                    <h2
                      id="payouts-main-heading"
                      className="text-[14px] font-bold text-[#1a2214]"
                    >
                      売上の受け取り
                    </h2>
                    <p className="mt-0.5 text-[11px] leading-snug text-[#566358]">
                      お客さんのカード払いを、口座で受け取れます
                    </p>
                  </div>
                </div>
                {isConnected ? (
                  <span className="shrink-0 rounded-full bg-[#eaf4ed] px-2.5 py-0.5 text-[10px] font-bold text-[#2d7a4f]">
                    設定済み
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-[#e7d39a] bg-[#fff8e6] px-2.5 py-0.5 text-[10px] font-bold text-[#7a5800]">
                    未設定
                  </span>
                )}
              </div>

              {isConnected ? (
                <div className="flex flex-col">
                  <div className="mb-3 flex items-start gap-2 rounded-[10px] border border-[#c5dfc5] bg-[#eaf4ed] p-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2d7a4f] text-white" aria-hidden>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold leading-snug text-[#2d7a4f]">
                        受け取りが有効です
                      </p>
                      <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#3d6b4d]">
                        カード売上は、登録した口座へ自動で振り込まれます。当日すぐではなく、だいたい週に1回です。次の振込日や口座の変更は、下のボタンから確認できます。
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={connectLoading || !stripeConfigured}
                      className="rounded-[8px] bg-[#2f4a7e] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      {connectLoading ? "処理中..." : "振込日・口座を確認する"}
                    </button>
                    <button
                      type="button"
                      onClick={confirmAndResetStripeConnect}
                      disabled={resetConnectLoading}
                      className="rounded-[8px] border border-[#e8e0d4] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#43382d] disabled:opacity-50"
                    >
                      {resetConnectLoading ? "処理中..." : "連携を解除する"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <ol className="mb-3 space-y-2">
                    {SETUP_STEPS.map((step, i) => {
                      const done = progress[step.key];
                      return (
                        <li key={step.key} className="flex items-center gap-2.5">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                              done
                                ? "bg-[#2d7a4f] text-white"
                                : "bg-[#eef2ee] text-[#7a8a7e]"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <PayoutIcon
                            src={step.icon}
                            size={22}
                            className={done ? "" : "opacity-45"}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-[#1a2214]">{step.label}</p>
                            <p className="text-[10px] leading-snug text-[#7a8a7e]">{step.sub}</p>
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
                  <p className="mb-3 text-[11px] leading-relaxed text-[#566358]">
                    主催者プラン（公開枠）とは別の設定です。レジのカード決済も、この同じ設定を使います。設定が終わると、カード売上が口座へ振り込まれます。現金はその場の受け取りです。
                  </p>
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={connectLoading || !stripeConfigured}
                    className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#2d7a4f] px-3.5 py-2.5 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(45,122,79,0.24)] hover:opacity-92 disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                      <rect x="1" y="4" width="22" height="16" rx="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    {connectLoading ? "処理中..." : "設定を始める"}
                  </button>
                </div>
              )}
            </section>

            <section className={PAYOUTS_NOTES} aria-label="設定のヒント">
              <details className="group min-[900px]:hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="org-payouts-notes__head flex cursor-pointer list-none items-center gap-2">
                  <PayoutIcon src="/organizer/payouts/alert.png" size={20} />
                  <h2 className="org-payouts-notes__title flex-1 text-[12px] font-bold text-[#1a2214]">
                    設定するときのヒント
                  </h2>
                  <span className="text-[10px] font-semibold text-[#7a8a7e]" aria-hidden>
                    <span className="group-open:hidden">開く</span>
                    <span className="hidden group-open:inline">閉じる</span>
                  </span>
                </summary>
                <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-[#566358] [&_li]:relative [&_li]:pl-3 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-[#9aab9e] [&_li]:before:content-['•']">
                  {NOTE_ITEMS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link
                  href="/organizer/settings/plan"
                  className="mt-2.5 inline-flex text-[11px] font-semibold text-[#2d7a4f] underline underline-offset-2"
                >
                  主催者プラン・公開枠はこちら
                </Link>
              </details>
              <div className="hidden min-[900px]:block">
                <div className="org-payouts-notes__head mb-2 flex items-center gap-2">
                  <PayoutIcon src="/organizer/payouts/alert.png" size={20} />
                  <h2 className="org-payouts-notes__title text-[12px] font-bold text-[#1a2214]">
                    設定するときのヒント
                  </h2>
                </div>
                <ul className="space-y-1 text-[11px] leading-relaxed text-[#566358] [&_li]:relative [&_li]:pl-3 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-[#9aab9e] [&_li]:before:content-['•']">
                  {NOTE_ITEMS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link
                  href="/organizer/settings/plan"
                  className="mt-2.5 inline-flex text-[11px] font-semibold text-[#2d7a4f] underline underline-offset-2 hover:opacity-85"
                >
                  主催者プラン・公開枠はこちら
                </Link>
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
