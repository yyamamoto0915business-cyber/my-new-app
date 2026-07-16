"use client";

import Image from "next/image";
import Link from "next/link";
import { CreditCard, Crown, Users } from "lucide-react";
import type { BillingSummary } from "@/app/api/organizer/dashboard/route";
import type { PlanSummary } from "@/lib/organizer-plan-summary";

const PLAN_HREF = "/organizer/settings/plan";
const PAYOUTS_HREF = "/organizer/settings/payouts";

type Props = {
  planSummary: PlanSummary | null;
  billingSummary: BillingSummary | null;
};

const SLOT_SPARKLES = [
  { className: "org-unlimited-spark org-unlimited-spark--a", style: { top: "6%", left: "8%" } },
  { className: "org-unlimited-spark org-unlimited-spark--b", style: { top: "14%", right: "4%" } },
  { className: "org-unlimited-spark org-unlimited-spark--c", style: { top: "42%", left: "0%" } },
  { className: "org-unlimited-spark org-unlimited-spark--d", style: { bottom: "18%", right: "2%" } },
  { className: "org-unlimited-spark org-unlimited-spark--e", style: { bottom: "8%", left: "18%" } },
  { className: "org-unlimited-spark org-unlimited-spark--f", style: { top: "28%", left: "48%" } },
] as const;

function ProPlanCard() {
  return (
    <div className="org-events-status-card org-events-status-card--pro">
      <div className="org-pro-plan-card">
        <div className="org-pro-plan-card__badge" aria-hidden>
          <Image
            src="/organizer/plan/pro-crown-badge.png"
            alt=""
            width={195}
            height={200}
            className="org-pro-plan-card__badge-img"
            unoptimized
          />
          <span className="org-pro-plan-spark org-pro-plan-spark--badge" />
          <span className="org-pro-plan-spark org-pro-plan-spark--badge-2" />
        </div>
        <div className="org-pro-plan-card__body">
          <p className="org-events-status-card__label">
            <span className="org-events-status-card__label-full">現在のプラン</span>
            <span className="org-events-status-card__label-short">プラン</span>
          </p>
          <p className="org-pro-plan-card__title">
            <span className="org-pro-plan-card__pro">Pro</span>
            <span className="org-pro-plan-card__plan">プラン</span>
            <span className="org-pro-plan-spark org-pro-plan-spark--title" aria-hidden />
          </p>
          <Link href={PLAN_HREF} className="org-pro-plan-card__link">
            プランを確認
            <span className="org-pro-plan-card__chevron" aria-hidden>
              ›
            </span>
          </Link>
        </div>
        <svg
          className="org-pro-plan-card__flourish"
          viewBox="0 0 64 40"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 28c12-2 22-14 30-18 6-3 14-4 22-2"
            stroke="url(#org-pro-flourish)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M10 34c10-1 20-10 28-14 5-2.5 12-3.5 20-1.5"
            stroke="url(#org-pro-flourish)"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.65"
          />
          <defs>
            <linearGradient id="org-pro-flourish" x1="4" y1="28" x2="56" y2="10" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E8C96A" stopOpacity="0.15" />
              <stop offset="0.5" stopColor="#C9A227" />
              <stop offset="1" stopColor="#E8C96A" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </svg>
        <span className="org-pro-plan-spark org-pro-plan-spark--1" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--2" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--3" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--4" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--5" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--6" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--silver-1" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--silver-2" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--silver-3" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--silver-4" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--silver-5" aria-hidden />
        <span className="org-pro-plan-spark org-pro-plan-spark--silver-6" aria-hidden />
      </div>
    </div>
  );
}

function UnlimitedSlotsCard() {
  return (
    <div className="org-events-status-card org-events-status-card--unlimited">
      <div className="org-unlimited-card">
        <div className="org-unlimited-card__art" aria-hidden>
          <Image
            src="/organizer/plan/unlimited-slots-emblem-v2.png"
            alt=""
            width={935}
            height={759}
            className="org-unlimited-card__art-img"
            unoptimized
          />
          {SLOT_SPARKLES.map((s) => (
            <span key={s.className} className={s.className} style={s.style} />
          ))}
        </div>
        <div className="org-unlimited-card__body">
          <p className="org-events-status-card__label">
            <span className="org-events-status-card__label-full">公開枠の残り</span>
            <span className="org-events-status-card__label-short">公開枠</span>
          </p>
          <p className="org-unlimited-card__value">
            上限なし
            <span className="org-unlimited-spark org-unlimited-spark--text-1" aria-hidden />
            <span className="org-unlimited-spark org-unlimited-spark--text-2" aria-hidden />
          </p>
          <p className="org-events-status-card__hint">今月公開できる件数</p>
        </div>
      </div>
    </div>
  );
}

export function EventAccountStatusCards({ planSummary, billingSummary }: Props) {
  const stripeOk = billingSummary?.paymentSetupStatus === "ok";
  const stripeLabel = stripeOk ? "設定済み" : "未設定";
  const stripeTone = stripeOk
    ? "text-[#2D7A4F] bg-[#EAF4ED] border-[#C5DFC5]"
    : "text-[#9a7b20] bg-[#FFF8E8] border-[#E8D9A8]";
  const isUnlimited = planSummary?.publishLimit === null;
  const isPro = planSummary ? !planSummary.isFreePlan : false;

  return (
    <section
      className="org-events-account-status grid grid-cols-3 gap-1.5 sm:gap-2 min-[900px]:gap-3"
      aria-label="アカウント状況"
    >
      {isPro ? (
        <ProPlanCard />
      ) : (
        <div className="org-events-status-card">
          <div className="flex items-start gap-3">
            <span className="org-events-status-card__icon org-events-status-card__icon--plan" aria-hidden>
              <Crown className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="org-events-status-card__label">
                <span className="org-events-status-card__label-full">現在のプラン</span>
                <span className="org-events-status-card__label-short">プラン</span>
              </p>
              <p className="org-events-status-card__value">
                {planSummary?.planLabel ?? "—"}
              </p>
              <Link href={PLAN_HREF} className="org-events-status-card__link">
                プランを変更
              </Link>
            </div>
          </div>
        </div>
      )}

      {isUnlimited ? (
        <UnlimitedSlotsCard />
      ) : (
        <div className="org-events-status-card">
          <div className="flex items-start gap-3">
            <span className="org-events-status-card__icon org-events-status-card__icon--slots" aria-hidden>
              <Users className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="org-events-status-card__label">
                <span className="org-events-status-card__label-full">公開枠の残り</span>
                <span className="org-events-status-card__label-short">公開枠</span>
              </p>
              <p className="org-events-status-card__value">
                {planSummary?.slotsDisplay ?? "—"}
              </p>
              <p className="org-events-status-card__hint">今月公開できる件数</p>
            </div>
          </div>
        </div>
      )}

      <div className="org-events-status-card">
        <div className="flex items-start gap-3">
          <span className="org-events-status-card__icon org-events-status-card__icon--stripe" aria-hidden>
            <CreditCard className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="org-events-status-card__label">
              <span className="org-events-status-card__label-full">Stripe設定状況</span>
              <span className="org-events-status-card__label-short">Stripe</span>
            </p>
            <span className={`org-events-status-card__badge border ${stripeTone}`}>
              {stripeLabel}
            </span>
            <Link href={PAYOUTS_HREF} className="org-events-status-card__link">
              設定を確認
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
