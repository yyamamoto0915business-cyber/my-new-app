"use client";

import {
  canUseOrganizerFeature,
  ORGANIZER_FEATURE_REQUIRED_TIER,
  type OrganizerPlanFeature,
} from "@/lib/billing";
import { getOrganizerCatalogPlan } from "@/lib/organizer-plans";
import { useOrganizerNavPlan } from "@/lib/organizer-pro-store";

/** その機能をいまのプランで使えるか（プランを読みこむ前は null） */
export function useFeatureAllowed(feature: OrganizerPlanFeature): boolean | null {
  const plan = useOrganizerNavPlan();
  if (!plan) return null;
  return canUseOrganizerFeature(plan === "team" ? "game" : plan, feature);
}

/**
 * 課金で使える機能のボタンに付ける小さな金色の札（いまのプランで使えないときだけ出す）。
 * 押す前に「どのプランで使えるか」が分かるようにする。押した先の画面では、くわしい案内とプランへの入口が出る。
 */
export function PlanBadge({ feature, className = "" }: { feature: OrganizerPlanFeature; className?: string }) {
  const allowed = useFeatureAllowed(feature);
  if (allowed !== false) return null;
  const plan = getOrganizerCatalogPlan(ORGANIZER_FEATURE_REQUIRED_TIER[feature]);
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#e6d29b] bg-[#fbf3e1] px-1.5 py-px text-[9.5px] font-bold tracking-[0.04em] text-[#a3812f] ${className}`}
    >
      {plan.name}
    </span>
  );
}
