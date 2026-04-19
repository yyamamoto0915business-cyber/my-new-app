import type { OrganizerBillingData } from "@/lib/organizer-billing-types";
import { FREE_PLAN_NORMAL_SLOTS, FOUNDER_BONUS_SLOTS } from "@/lib/billing";
import { isPaidOrganizer } from "@/lib/billing";

export const NORMAL_SLOTS = FREE_PLAN_NORMAL_SLOTS;
export const FOUNDER_BONUS_SLOTS_UI = FOUNDER_BONUS_SLOTS;

export function getPlanLabel(data: OrganizerBillingData): string {
  if (isPaidOrganizer(data.organizer)) return "Starterプラン";
  return "無料プラン";
}

export function isPaidPlan(data: OrganizerBillingData): boolean {
  return isPaidOrganizer(data.organizer);
}

export function isFounderActive(data: OrganizerBillingData): boolean {
  return !!(
    data.organizer.founder30_end_at &&
    new Date(data.organizer.founder30_end_at) >= new Date()
  );
}

export function getSlotsLabel(data: OrganizerBillingData): string {
  const limit = data.publishLimit;
  if (limit === null) return "無制限";
  return `${data.monthlyPublished}/${limit}`;
}

export function getNormalSlotsUsed(published: number): number {
  return Math.min(published, NORMAL_SLOTS);
}

export function getFounderBonusSlotsUsed(published: number): number {
  return Math.max(0, published - NORMAL_SLOTS);
}

export function getReceivingStatus(
  data: OrganizerBillingData
): "未設定" | "設定済み" | "決済未対応" {
  if (!data.stripeConnectConfigured) return "決済未対応";
  return data.organizer.stripe_account_charges_enabled ? "設定済み" : "未設定";
}
