import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canUseOrganizerFeature,
  getOrganizerPlanTierWithPlanState,
  ORGANIZER_FEATURE_REQUIRED_TIER,
  type OrganizerPlanFeature,
  type OrganizerPlanTier,
} from "@/lib/billing";

const FEATURE_LABEL: Record<OrganizerPlanFeature, string> = {
  pos: "レジ",
  games: "ゲームの作成・編集",
};

const TIER_LABEL: Record<OrganizerPlanTier, string> = {
  free: "FREE",
  standard: "STANDARD",
  game: "GAME",
};

export async function getOrganizerPlanTierById(
  supabase: SupabaseClient,
  organizerId: string
): Promise<OrganizerPlanTier> {
  const [{ data: organizer }, { data: planState }] = await Promise.all([
    supabase
      .from("organizers")
      .select(
        "plan, subscription_status, manual_grant_active, manual_grant_plan, manual_grant_expires_at"
      )
      .eq("id", organizerId)
      .maybeSingle(),
    supabase
      .from("organizer_plan_state")
      .select("stripe_status, manual_grant_active, manual_grant_plan, manual_grant_expires_at")
      .eq("organizer_id", organizerId)
      .maybeSingle(),
  ]);
  return getOrganizerPlanTierWithPlanState(organizer ?? {}, planState);
}

/** プランで使えない機能なら 403 を返す。使えるなら null */
export async function requireOrganizerFeature(
  supabase: SupabaseClient,
  organizerId: string,
  feature: OrganizerPlanFeature
): Promise<NextResponse | null> {
  const tier = await getOrganizerPlanTierById(supabase, organizerId);
  if (canUseOrganizerFeature(tier, feature)) return null;
  const required = ORGANIZER_FEATURE_REQUIRED_TIER[feature];
  return NextResponse.json(
    {
      error: `${FEATURE_LABEL[feature]}は${TIER_LABEL[required]}プランから使えます。プランを変更してください。`,
      code: "PLAN_REQUIRED",
      requiredPlan: required,
    },
    { status: 403 }
  );
}
