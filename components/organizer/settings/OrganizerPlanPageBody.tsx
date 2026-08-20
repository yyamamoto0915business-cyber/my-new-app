"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerPlanHero } from "@/components/organizer/plan/OrganizerPlanHero";
import { useOrganizerBilling } from "@/hooks/use-organizer-billing";
import {
  isPaidPlan,
  isFounderActive,
  getNormalSlotsUsed,
  getFounderBonusSlotsUsed,
  NORMAL_SLOTS,
  FOUNDER_BONUS_SLOTS_UI,
} from "@/lib/organizer-billing-display";
import { SECTION_TONES } from "@/lib/section-tones";

const COMPARE_ROWS = [
  ["月額料金", "0円", "月額980円"],
  ["公開枠", "毎月1件まで", "制限なし"],
  ["イベント作成", "利用可能", "利用可能"],
  ["ボランティア募集管理", "利用可能", "利用可能"],
  ["チャット", "利用可能", "利用可能"],
  ["売上受取（Stripe）", "別途設定", "別途設定"],
  ["協賛受付", "対応", "対応"],
  ["おすすめ", "無料で始めたい方", "本格的に主催したい方"],
] as const;

const usageTone = SECTION_TONES.organizer;
const proTone = SECTION_TONES.security;
const MG_ACCENT = "#b8860b";
const MG_ACCENT_LIGHT = "#c9a227";
const MG_ACCENT_DARK = "#8a6510";

const cardBase =
  "rounded-2xl bg-white p-3 shadow-[0_1px_8px_rgba(0,0,0,0.05)] sm:p-4 dark:bg-zinc-900";
const cardBorderSoft = "border-[0.5px] border-[#e8e6e0] dark:border-zinc-700";
const pageBottomPad =
  "max-[899px]:pb-[calc(2rem+env(safe-area-inset-bottom,0px))] min-[900px]:pb-8";

const PRO_FEATURES = [
  "公開枠無制限",
  "継続的な主催に向いたプラン",
  "Stripe で安全にお支払い管理",
] as const;

function PlanIcon({
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

export function OrganizerPlanPageBody() {
  const {
    data,
    loading,
    error,
    actionError,
    checkoutLoading,
    portalLoading,
    handleCheckout,
    handlePortal,
  } = useOrganizerBilling();
  const [billingAgreed, setBillingAgreed] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  if (loading) {
    return (
      <OrganizerPageShell
        className={`org-plan-page ${pageBottomPad}`}
        contentClassName="mx-auto w-full max-w-5xl space-y-3"
      >
        <div className="h-12 animate-pulse rounded-xl bg-[#e4ede0] min-[900px]:h-16" />
        <div className="org-plan-page__grid min-[900px]:grid-cols-2">
          <div className="h-44 animate-pulse rounded-2xl bg-[#d8e8dc]" />
          <div className="h-44 animate-pulse rounded-2xl bg-[#ebe4d8]" />
        </div>
      </OrganizerPageShell>
    );
  }

  const paid = data ? isPaidPlan(data) : false;
  const founder = data ? isFounderActive(data) : false;

  const shellClass = [
    "org-plan-page",
    "org-plan-page--compact",
    pageBottomPad,
    paid ? "org-plan-page--pro-active" : "",
    founder ? "org-plan-page--founder" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <OrganizerPageShell
      className={shellClass}
      contentClassName="mx-auto w-full max-w-5xl space-y-2 min-[900px]:space-y-3.5"
    >
      <OrganizerWorkspacePageHeader
        className="min-[900px]:hidden"
        compact
        title="主催者プラン"
        subtitle="Starter（無料）と Pro（月額980円）から選べます。公開枠や特典をここで確認できます。"
      />
      <div className="hidden min-[900px]:block">
        <OrganizerPlanHero />
      </div>

      <div className="w-full space-y-2 min-[900px]:space-y-3.5">
        {error ? (
          <p className="text-[12px] text-red-600 sm:text-sm">{error}</p>
        ) : data ? (
          <>
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
                {actionError}
              </div>
            )}

            <div className="org-plan-page__grid min-[900px]:grid-cols-2">
              {/* 現在のご利用状況 */}
              <section className="org-plan-usage-card flex flex-col" aria-labelledby="plan-usage-heading">
                <div className="org-plan-usage-card__header">
                  <div className="org-plan-usage-card__header-title">
                    <PlanIcon src="/organizer/plan/usage-status.png" size={32} />
                    <h2 id="plan-usage-heading">現在のご利用状況</h2>
                  </div>
                  <span
                    className={`org-plan-usage-card__badge ${
                      paid ? "org-plan-usage-card__badge--pro" : "org-plan-usage-card__badge--starter"
                    }`}
                  >
                    {paid ? "現在利用中" : "Starter"}
                  </span>
                </div>
                <div className="org-plan-usage-card__body">
                  <div className="org-plan-usage-card__stats">
                    <div className="org-plan-usage-card__stat-row org-plan-usage-card__stat-row--plan">
                      <span className="org-plan-usage-card__stat-label">
                        <PlanIcon src="/organizer/plan/usage-status.png" size={18} className="org-plan-usage-card__stat-icon" />
                        現在のプラン
                      </span>
                      <span className="org-plan-usage-card__stat-value">
                        {paid ? "Proプラン" : "Starter（無料）"}
                      </span>
                    </div>
                    {founder && (
                      <div className="org-plan-usage-card__stat-row">
                        <span className="org-plan-usage-card__stat-label">
                          <PlanIcon src="/organizer/plan/gift.png" size={18} className="org-plan-usage-card__stat-icon" />
                          特典の公開枠
                        </span>
                        <span className="org-plan-usage-card__stat-value">
                          {getFounderBonusSlotsUsed(data.monthlyPublished)} / {FOUNDER_BONUS_SLOTS_UI} 件
                        </span>
                      </div>
                    )}
                    {paid ? (
                      <div className="org-plan-usage-card__stat-row org-plan-usage-card__stat-row--slots">
                        <span className="org-plan-usage-card__stat-label">
                          <PlanIcon src="/organizer/plan/calendar.png" size={18} className="org-plan-usage-card__stat-icon" />
                          今月公開できる件数
                        </span>
                        <span className="org-plan-usage-card__stat-value org-plan-usage-card__stat-value--accent">
                          無制限
                        </span>
                      </div>
                    ) : (
                      <div className="org-plan-usage-card__stat-row">
                        <span className="org-plan-usage-card__stat-label">
                          <PlanIcon src="/organizer/plan/calendar.png" size={18} className="org-plan-usage-card__stat-icon" />
                          毎月の公開枠
                        </span>
                        <span className="org-plan-usage-card__stat-value">
                          {getNormalSlotsUsed(data.monthlyPublished)} / {NORMAL_SLOTS} 件
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="org-plan-usage-card__note">
                    <PlanIcon src="/organizer/plan/calendar.png" size={18} className="mt-0.5" />
                    <span>参加費・協賛金の受け取りは Stripe の売上受取設定で行います。</span>
                  </p>

                  <Link href="/organizer/settings/payouts" className="org-plan-usage-card__cta">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <rect x="1" y="4" width="22" height="16" rx="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    売上受取設定へ
                  </Link>
                </div>
              </section>

              {/* Proプラン */}
              <section className="org-plan-pro-card flex flex-col" aria-labelledby="plan-pro-heading">
                <div className="org-plan-pro-card__ribbon">おすすめ</div>
                <div className="org-plan-pro-card__top">
                  <PlanIcon src="/organizer/plan/pro-plan.png" size={56} className="org-plan-pro-card__illus" />
                  <div className="min-w-0 flex-1">
                    <h2 id="plan-pro-heading" className="org-plan-pro-card__title">
                      Proプラン
                    </h2>
                    <p className="org-plan-pro-card__price">月額980円（税込）</p>
                    <p className="org-plan-pro-card__desc">
                      公開枠の制限なく、継続的に主催できます。
                    </p>
                  </div>
                </div>
                <div className="org-plan-pro-card__content flex flex-1 flex-col">
                  <ul className="org-plan-pro-card__features">
                    {PRO_FEATURES.map((text) => (
                      <li key={text} className="org-plan-pro-card__feature">
                        <span className="org-plan-pro-card__feature-check" aria-hidden>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        {text}
                      </li>
                    ))}
                  </ul>

                  <div className="org-plan-pro-card__footer mt-auto">
                    {paid ? (
                      <>
                        <span className="org-plan-pro-card__active-badge">現在利用中</span>
                        {data.organizer.current_period_end ? (
                          <p className="text-center text-[11px] text-[#7a6a58]">
                            次回更新：
                            {new Date(data.organizer.current_period_end).toLocaleDateString("ja-JP")}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          onClick={handlePortal}
                          disabled={portalLoading}
                          className="org-plan-pro-card__cta"
                        >
                          <PlanIcon src="/organizer/plan/crown.png" size={22} />
                          {portalLoading ? "処理中..." : "お支払い・プランを管理する"}
                        </button>
                      </>
                    ) : data.organizer.subscription_status === "past_due" ? (
                      <>
                        <span className="mx-auto w-fit rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800">
                          要対応
                        </span>
                        <p className="text-center text-[12px] text-[#566358]">
                          お支払いでエラーが発生しています。カード情報をご確認ください。
                        </p>
                        <button
                          type="button"
                          onClick={handlePortal}
                          disabled={portalLoading}
                          className="org-plan-pro-card__cta org-plan-pro-card__cta--green"
                        >
                          {portalLoading ? "処理中..." : "カード情報を確認する"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                          <p className="text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
                            お申し込み前に、
                            <Link href="/terms" target="_blank" className="hover:underline" style={{ color: MG_ACCENT }}>
                              利用規約
                            </Link>
                            、
                            <Link href="/commerce" target="_blank" className="hover:underline" style={{ color: MG_ACCENT }}>
                              特定商取引法に基づく表記
                            </Link>
                            、
                            <Link href="/terms#cancellation" target="_blank" className="hover:underline" style={{ color: MG_ACCENT }}>
                              キャンセル条件
                            </Link>
                            をご確認ください。
                          </p>
                          <label className="flex cursor-pointer items-start gap-2">
                            <input
                              type="checkbox"
                              checked={billingAgreed}
                              onChange={(e) => setBillingAgreed(e.target.checked)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
                            />
                            <span className="text-[10px] leading-snug text-slate-700 sm:text-[11px]">
                              上記に同意します
                            </span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={handleCheckout}
                          disabled={checkoutLoading || !billingAgreed}
                          className="org-plan-pro-card__cta org-plan-pro-card__cta--green"
                        >
                          {checkoutLoading ? "処理中..." : "Pro にアップグレード"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <button
              type="button"
              onClick={() => setShowCompare((v) => !v)}
              className="org-plan-compare-toggle"
              aria-expanded={showCompare}
            >
              {showCompare ? "▲ プラン比較を閉じる" : "▼ プラン比較を見る"}
            </button>

            {showCompare && (
              <div className={`${cardBase} ${cardBorderSoft} overflow-hidden overflow-x-auto`}>
                <table className="w-full min-w-[280px] border-collapse">
                  <thead>
                    <tr>
                      <th className="w-[40%] border-b border-[#e8e6e0] bg-[#fafaf8] p-2 text-left text-[11px] font-medium text-[var(--mg-muted)] sm:p-3 sm:text-[12px]" />
                      <th
                        className="border-b p-2 text-center text-[11px] font-semibold sm:p-3 sm:text-[12px]"
                        style={{ background: usageTone.infoBg, color: usageTone.btnText, borderColor: usageTone.border }}
                      >
                        Starter
                      </th>
                      <th
                        className="border-b p-2 text-center text-[11px] font-bold sm:p-3 sm:text-[12px]"
                        style={{
                          background: proTone.infoBg,
                          color: proTone.btnText,
                          borderColor: proTone.infoBorder,
                        }}
                      >
                        Pro プラン
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map(([label, free, pro], i) => (
                      <tr
                        key={label}
                        className={i < COMPARE_ROWS.length - 1 ? "border-b border-[#f5f3ef]" : ""}
                      >
                        <td className="bg-[#fafaf8] p-2 text-[11px] font-medium text-[var(--mg-ink)] sm:p-3 sm:text-[12px]">
                          {label}
                        </td>
                        <td
                          className="p-2 text-center text-[11px] sm:p-3 sm:text-[12px]"
                          style={{ background: usageTone.bodyBg, color: usageTone.desc }}
                        >
                          {free}
                        </td>
                        <td
                          className="p-2 text-center text-[11px] font-semibold sm:p-3 sm:text-[12px]"
                          style={{ background: proTone.bodyBg, color: proTone.btnText }}
                        >
                          {pro}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {founder && (
              <section className="org-plan-founder-card" aria-label="先着特典">
                <div className="org-plan-founder-card__row">
                  <PlanIcon src="/organizer/plan/gift.png" size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: "var(--mg-accent-soft)", color: MG_ACCENT_DARK }}
                      >
                        先着特典
                      </span>
                      <span className="text-[11px] font-semibold" style={{ color: MG_ACCENT }}>
                        ご利用中
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-[#7a6a58]">
                      特典の公開枠：{getFounderBonusSlotsUsed(data.monthlyPublished)} / {FOUNDER_BONUS_SLOTS_UI} 件
                      <br />
                      特典終了日：
                      {new Date(data.organizer.founder30_end_at!).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <PlanIcon
                  src="/organizer/plan/starter-leaf.png"
                  size={44}
                  className="org-plan-founder-card__deco"
                />
              </section>
            )}

            <div
              className="max-[899px]:block min-[900px]:hidden h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] shrink-0"
              aria-hidden
            />
          </>
        ) : null}
      </div>
    </OrganizerPageShell>
  );
}
