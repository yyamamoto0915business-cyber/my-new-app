import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import {
  getMonthlyPublishedCount,
  FREE_PLAN_NORMAL_SLOTS,
  FOUNDER_BONUS_SLOTS,
  isPaidOrganizer,
} from "@/lib/billing";
import { isStripeServerConfigured } from "@/lib/stripe";

/**
 * GET: 主催者の課金・特典・公開枠情報
 */
export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
    }

    const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
    if (!organizerId) {
      return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
    }

    const { data: organizer } = await supabase
      .from("organizers")
      .select("*")
      .eq("id", organizerId)
      .single();

    if (!organizer) {
      return NextResponse.json({ error: "主催者情報を取得できません" }, { status: 500 });
    }

    const { data: planState } = await supabase
      .from("organizer_plan_state")
      .select("stripe_status, manual_grant_active, manual_grant_expires_at")
      .eq("organizer_id", organizerId)
      .maybeSingle();

    const monthlyPublished = await getMonthlyPublishedCount(supabase, organizerId);
    const founderActive = !!(
      organizer.founder30_end_at && new Date(organizer.founder30_end_at) >= new Date()
    );
    const publishLimit =
      isPaidOrganizer({
        subscription_status: organizer.subscription_status ?? null,
        stripe_status: planState?.stripe_status ?? null,
        manual_grant_active:
          planState?.manual_grant_active ?? organizer.manual_grant_active ?? false,
        manual_grant_expires_at:
          planState?.manual_grant_expires_at ?? organizer.manual_grant_expires_at ?? null,
      })
        ? null
        : founderActive
          ? FREE_PLAN_NORMAL_SLOTS + FOUNDER_BONUS_SLOTS // 4
          : FREE_PLAN_NORMAL_SLOTS; // 1

    return NextResponse.json({
      stripeConnectConfigured: isStripeServerConfigured(),
      organizer: {
        id: organizer.id,
        plan: organizer.plan,
        earlybird_eligible: organizer.earlybird_eligible,
        full_feature_trial_end_at: organizer.full_feature_trial_end_at,
        founder30_granted_at: organizer.founder30_granted_at,
        founder30_end_at: organizer.founder30_end_at,
        subscription_status: organizer.subscription_status,
        stripe_status: planState?.stripe_status ?? null,
        current_period_end: organizer.current_period_end,
        manual_grant_active:
          planState?.manual_grant_active ?? organizer.manual_grant_active ?? false,
        manual_grant_expires_at:
          planState?.manual_grant_expires_at ?? organizer.manual_grant_expires_at,
        stripe_account_charges_enabled: organizer.stripe_account_charges_enabled,
        stripe_account_details_submitted: organizer.stripe_account_details_submitted ?? false,
      },
      monthlyPublished,
      publishLimit,
    });
  } catch (error) {
    console.error("[api/organizer/billing] unexpected error", error);
    return NextResponse.json(
      { error: "課金情報の取得中に予期しないエラーが発生しました" },
      { status: 500 }
    );
  }
}
