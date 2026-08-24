"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerPlanHero } from "@/components/organizer/plan/OrganizerPlanHero";
import { useOrganizerBilling } from "@/hooks/use-organizer-billing";
import {
  isPaidPlan,
  isFounderActive,
  getFounderBonusSlotsUsed,
  FOUNDER_BONUS_SLOTS_UI,
} from "@/lib/organizer-billing-display";
import {
  ORGANIZER_CATALOG_PLANS,
  getCurrentOrganizerCatalogPlanId,
  getOrganizerCatalogPlan,
  type OrganizerCatalogPlan,
  type OrganizerCatalogPlanId,
} from "@/lib/organizer-plans";

const MG_GOLD = "#b8860b";
const MG_GOLD_DARK = "#8a6510";

const pageBottomPad =
  "max-[899px]:pb-[calc(2rem+env(safe-area-inset-bottom,0px))] min-[900px]:pb-8";

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

function CheckIcon() {
  return (
    <span className="org-plan-tier__check" aria-hidden>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

function CatalogPlanCard({
  plan,
  currentId,
  expanded,
  onToggle,
  pastDue,
  checkoutLoading,
  portalLoading,
  billingAgreed,
  setBillingAgreed,
  onCheckout,
  onPortal,
}: {
  plan: OrganizerCatalogPlan;
  currentId: OrganizerCatalogPlanId;
  expanded: boolean;
  onToggle: () => void;
  pastDue: boolean;
  checkoutLoading: boolean;
  portalLoading: boolean;
  billingAgreed: boolean;
  setBillingAgreed: (v: boolean) => void;
  onCheckout: () => void;
  onPortal: () => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const isCurrent = plan.id === currentId;
  const showCheckoutForm = plan.checkoutEnabled && !isCurrent;

  useEffect(() => {
    if (!expanded || !cardRef.current) return;
    const node = cardRef.current;
    const frame = requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded]);

  let cta: ReactNode;
  if (isCurrent && plan.checkoutEnabled && pastDue) {
    cta = (
      <button
        type="button"
        onClick={onPortal}
        disabled={portalLoading}
        className="org-plan-tier__cta org-plan-tier__cta--action"
      >
        {portalLoading ? "処理中..." : "カード情報を確認する"}
      </button>
    );
  } else if (isCurrent && plan.checkoutEnabled) {
    cta = (
      <>
        <button
          type="button"
          onClick={onPortal}
          disabled={portalLoading}
          className="org-plan-tier__cta org-plan-tier__cta--action org-plan-tier__cta--desktop-portal"
        >
          {portalLoading ? "処理中..." : "支払いを変更する"}
        </button>
        <span className="org-plan-tier__cta org-plan-tier__cta--current org-plan-tier__cta--mobile-status">
          利用中
        </span>
      </>
    );
  } else if (isCurrent) {
    cta = <span className="org-plan-tier__cta org-plan-tier__cta--current">{plan.ctaLabel}</span>;
  } else if (showCheckoutForm) {
    cta = (
      <>
        <div className="org-plan-tier__legal">
          <p>
            お申し込み前に、
            <Link href="/terms" target="_blank" className="org-plan-tier__legal-link">
              利用規約
            </Link>
            、
            <Link href="/commerce" target="_blank" className="org-plan-tier__legal-link">
              特定商取引法に基づく表記
            </Link>
            、
            <Link href="/terms#cancellation" target="_blank" className="org-plan-tier__legal-link">
              キャンセル条件
            </Link>
            をご確認ください。
          </p>
          <label className="org-plan-tier__agree">
            <input
              type="checkbox"
              checked={billingAgreed}
              onChange={(e) => setBillingAgreed(e.target.checked)}
            />
            <span>上記に同意します</span>
          </label>
        </div>
        <button
          type="button"
          onClick={onCheckout}
          disabled={checkoutLoading || !billingAgreed}
          className="org-plan-tier__cta org-plan-tier__cta--action"
        >
          {checkoutLoading ? "処理中..." : plan.ctaLabel}
        </button>
      </>
    );
  } else if (plan.id === "free") {
    cta = <span className="org-plan-tier__cta org-plan-tier__cta--ghost">{plan.ctaLabel}</span>;
  } else {
    cta = (
      <button type="button" disabled className="org-plan-tier__cta org-plan-tier__cta--soon">
        準備中
      </button>
    );
  }

  return (
    <article
      ref={cardRef}
      className={`org-plan-tier org-plan-tier--${plan.tone}${plan.recommended ? " org-plan-tier--featured" : ""}${expanded ? " org-plan-tier--open" : ""}`}
    >
      {plan.recommended ? (
        <>
          <span className="org-plan-tier__sparkle org-plan-tier__sparkle--1" aria-hidden />
          <span className="org-plan-tier__sparkle org-plan-tier__sparkle--2" aria-hidden />
          <span className="org-plan-tier__badge">おすすめ</span>
        </>
      ) : null}
      <button
        type="button"
        className="org-plan-tier__hit"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <div className="org-plan-tier__head">
          <h3 className="org-plan-tier__name">{plan.name}</h3>
          <p className="org-plan-tier__price">{plan.priceLabel}</p>
          <p className="org-plan-tier__tagline">{plan.tagline}</p>
          <p className="org-plan-tier__desc">{plan.description}</p>
        </div>
        {plan.includesLabel ? (
          <p className="org-plan-tier__includes org-plan-tier__includes--always">
            {plan.includesLabel}
          </p>
        ) : null}
        <ul className="org-plan-tier__highlights">
          {plan.highlights.map((text) => (
            <li key={text}>
              <CheckIcon />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <span className="org-plan-tier__toggle org-plan-tier__toggle--in-hit">
          {expanded ? "とじる" : "ほかの機能"}
        </span>
      </button>
      <div className="org-plan-tier__details">
        {plan.includesLabel ? (
          <p className="org-plan-tier__includes org-plan-tier__includes--desktop">
            <CheckIcon />
            {plan.includesLabel}
          </p>
        ) : (
          <p className="org-plan-tier__includes-spacer">含まれる機能</p>
        )}
        {plan.includesLabel ? <p className="org-plan-tier__more">さらに</p> : null}
        <ul className="org-plan-tier__features org-plan-tier__features--full">
          {plan.features.map((text) => (
            <li key={text}>
              <CheckIcon />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <p className="org-plan-tier__extra-label">ほかの機能</p>
        <ul className="org-plan-tier__features org-plan-tier__features--extra">
          {plan.extraFeatures.map((text) => (
            <li key={text}>
              <CheckIcon />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        {expanded ? (
          <button
            type="button"
            className="org-plan-tier__toggle org-plan-tier__toggle--after"
            onClick={onToggle}
          >
            とじる
          </button>
        ) : null}
      </div>
      <div
        className="org-plan-tier__footer"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {cta}
      </div>
    </article>
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
  const [openPlanId, setOpenPlanId] = useState<OrganizerCatalogPlanId | null>(null);

  if (loading) {
    return (
      <OrganizerPageShell
        className={`org-plan-page ${pageBottomPad}`}
        contentClassName="mx-auto w-full max-w-6xl space-y-3"
      >
        <div className="h-12 animate-pulse rounded-xl bg-[#e4ede0] min-[900px]:h-16" />
        <div className="h-14 animate-pulse rounded-2xl bg-[#ebe4d8] min-[900px]:h-20" />
        <div className="grid grid-cols-2 gap-2 min-[1100px]:grid-cols-4">
          <div className="h-36 animate-pulse rounded-2xl bg-[#d8e8dc] min-[900px]:h-64" />
          <div className="h-36 animate-pulse rounded-2xl bg-[#d8e8dc] min-[900px]:h-64" />
          <div className="h-36 animate-pulse rounded-2xl bg-[#d8e8dc] min-[900px]:h-64" />
          <div className="h-36 animate-pulse rounded-2xl bg-[#d8e8dc] min-[900px]:h-64" />
        </div>
      </OrganizerPageShell>
    );
  }

  const paid = data ? isPaidPlan(data) : false;
  const founder = data ? isFounderActive(data) : false;
  const currentId = getCurrentOrganizerCatalogPlanId(paid);
  const currentPlan = getOrganizerCatalogPlan(currentId);
  const pastDue = data?.organizer.subscription_status === "past_due";

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
      contentClassName="mx-auto w-full max-w-6xl space-y-3 min-[900px]:space-y-5"
    >
      <OrganizerWorkspacePageHeader
        className="min-[900px]:hidden"
        compact
        title="主催者プラン"
      />
      <div className="hidden min-[900px]:block">
        <OrganizerPlanHero />
      </div>

      <div className="w-full space-y-3 min-[900px]:space-y-5">
        {error ? (
          <p className="text-[12px] text-red-600 sm:text-sm">{error}</p>
        ) : data ? (
          <>
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
                {actionError}
              </div>
            )}

            <section
              className={`org-plan-current${paid ? " org-plan-current--paid" : ""}`}
              aria-labelledby="plan-current-heading"
            >
              <div className="org-plan-current__who">
                <span className="org-plan-current__crown">
                  <PlanIcon src="/organizer/plan/crown.png" size={22} />
                </span>
                <div className="org-plan-current__who-text">
                  <h2 id="plan-current-heading">いまのプラン</h2>
                  <p className="org-plan-current__summary">
                    <span className="org-plan-current__name">{currentPlan.name}</span>
                    <span className="org-plan-current__price">{currentPlan.monthlyPriceLabel}</span>
                  </p>
                  <span className="org-plan-current__status">現在利用中</span>
                  <p className="org-plan-current__desc">{currentPlan.description}</p>
                </div>
              </div>
              <div className="org-plan-current__actions">
                {pastDue ? (
                  <>
                    <span className="org-plan-current__warn">要対応</span>
                    <p className="org-plan-current__warn-text">
                      お支払いでエラーが発生しています。カード情報をご確認ください。
                    </p>
                    <button
                      type="button"
                      onClick={handlePortal}
                      disabled={portalLoading}
                      className="org-plan-current__cta"
                    >
                      {portalLoading ? "処理中..." : "カード情報を確認する"}
                    </button>
                  </>
                ) : paid ? (
                  <>
                    {data.organizer.current_period_end ? (
                      <p className="org-plan-current__renew">
                        次回更新：
                        {new Date(data.organizer.current_period_end).toLocaleDateString("ja-JP")}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={handlePortal}
                      disabled={portalLoading}
                      className="org-plan-current__cta"
                    >
                      {portalLoading ? "処理中..." : "支払いを変更"}
                    </button>
                  </>
                ) : (
                  <p className="org-plan-current__hint">下からプランを選べます。</p>
                )}
              </div>
            </section>

            <section className="org-plan-compare" aria-labelledby="plan-compare-heading">
              <h2 id="plan-compare-heading">プランを比較</h2>
              <p>活動が広がるほど、掲載・受付・イベント向けの機能が増えます。</p>
              <p className="org-plan-compare__flow">
                FREEから始まり、プランが上がるごとに新しい機能が追加されます。
              </p>
            </section>

            <div className="org-plan-tier-grid">
              {ORGANIZER_CATALOG_PLANS.map((plan) => (
                <CatalogPlanCard
                  key={plan.id}
                  plan={plan}
                  currentId={currentId}
                  expanded={openPlanId === plan.id}
                  onToggle={() =>
                    setOpenPlanId((id) => (id === plan.id ? null : plan.id))
                  }
                  checkoutLoading={checkoutLoading}
                  portalLoading={portalLoading}
                  pastDue={pastDue}
                  billingAgreed={billingAgreed}
                  setBillingAgreed={setBillingAgreed}
                  onCheckout={handleCheckout}
                  onPortal={handlePortal}
                />
              ))}
            </div>

            <aside className="org-plan-commons">
              <PlanIcon src="/organizer/plan/starter-leaf.png" size={32} />
              <div>
                <p className="org-plan-commons__title">投稿・いいね・アルバム・マップは、どのプランでも無料です。</p>
                <p className="org-plan-commons__desc">
                  保存やマイアルバムも、すべてのユーザーが無料で使えます。
                </p>
              </div>
            </aside>

            {founder && (
              <section className="org-plan-founder-card" aria-label="先着特典">
                <div className="org-plan-founder-card__row">
                  <PlanIcon src="/organizer/plan/gift.png" size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: "var(--mg-accent-soft)", color: MG_GOLD_DARK }}
                      >
                        先着特典
                      </span>
                      <span className="text-[11px] font-semibold" style={{ color: MG_GOLD }}>
                        ご利用中
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-[#7a6a58]">
                      特典の公開枠：{getFounderBonusSlotsUsed(data.monthlyPublished)} /{" "}
                      {FOUNDER_BONUS_SLOTS_UI} 件
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
              className="h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] shrink-0 max-[899px]:block min-[900px]:hidden"
              aria-hidden
            />
          </>
        ) : null}
      </div>
    </OrganizerPageShell>
  );
}
