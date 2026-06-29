"use client";

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

export function EventAccountStatusCards({ planSummary, billingSummary }: Props) {
  const stripeOk = billingSummary?.paymentSetupStatus === "ok";
  const stripeLabel = stripeOk ? "設定済み" : "未設定";
  const stripeTone = stripeOk
    ? "text-[#2D7A4F] bg-[#EAF4ED] border-[#C5DFC5]"
    : "text-[#9a7b20] bg-[#FFF8E8] border-[#E8D9A8]";

  return (
    <section
      className="grid gap-2 min-[900px]:grid-cols-3 min-[900px]:gap-3"
      aria-label="アカウント状況"
    >
      <div className="org-events-status-card">
        <div className="flex items-start gap-3">
          <span className="org-events-status-card__icon org-events-status-card__icon--plan" aria-hidden>
            <Crown className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="org-events-status-card__label">現在のプラン</p>
            <p className="org-events-status-card__value">
              {planSummary?.planLabel ?? "—"}
            </p>
            {planSummary?.isFreePlan ? (
              <Link href={PLAN_HREF} className="org-events-status-card__link">
                プランを変更
              </Link>
            ) : (
              <Link href={PLAN_HREF} className="org-events-status-card__link">
                プランを確認
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="org-events-status-card">
        <div className="flex items-start gap-3">
          <span className="org-events-status-card__icon org-events-status-card__icon--slots" aria-hidden>
            <Users className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="org-events-status-card__label">公開枠の残り</p>
            <p className="org-events-status-card__value">
              {planSummary?.slotsDisplay ?? "—"}
            </p>
            <p className="org-events-status-card__hint">今月公開できる件数</p>
          </div>
        </div>
      </div>

      <div className="org-events-status-card">
        <div className="flex items-start gap-3">
          <span className="org-events-status-card__icon org-events-status-card__icon--stripe" aria-hidden>
            <CreditCard className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="org-events-status-card__label">Stripe設定状況</p>
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
