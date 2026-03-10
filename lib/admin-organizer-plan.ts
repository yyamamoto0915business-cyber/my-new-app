import type { Organizer } from "@/lib/db/types";

export type EffectivePlanInfo = {
  currentPlan: string;
  billingSource: "manual" | "stripe" | "free";
  manualGrantActive: boolean;
  manualGrantExpiresAt: string | null;
};

export function resolveEffectivePlan(organizer: Organizer): EffectivePlanInfo {
  const now = new Date();

  const manualActiveRaw = organizer.manual_grant_active ?? false;
  const manualExpiresAt = organizer.manual_grant_expires_at ?? null;

  let manualActive = false;
  if (manualActiveRaw) {
    if (!manualExpiresAt) {
      manualActive = true;
    } else {
      const expires = new Date(manualExpiresAt);
      manualActive = expires.getTime() > now.getTime();
    }
  }

  if (manualActive) {
    return {
      currentPlan: organizer.manual_grant_plan ?? organizer.plan ?? "free",
      billingSource: "manual",
      manualGrantActive: true,
      manualGrantExpiresAt: manualExpiresAt,
    };
  }

  const status = organizer.subscription_status ?? null;
  const periodEnd = organizer.current_period_end ?? null;
  const hasActiveStripe =
    !!status &&
    ["active", "trialing", "past_due"].includes(status) &&
    (!!periodEnd ? new Date(periodEnd).getTime() > now.getTime() : true);

  if (hasActiveStripe) {
    return {
      currentPlan: organizer.plan ?? "free",
      billingSource: "stripe",
      manualGrantActive: false,
      manualGrantExpiresAt: null,
    };
  }

  return {
    currentPlan: "free",
    billingSource: "free",
    manualGrantActive: false,
    manualGrantExpiresAt: null,
  };
}

