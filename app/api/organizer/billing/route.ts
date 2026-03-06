import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getMonthlyPublishedCount } from "@/lib/billing";

/**
 * GET: 主催者の課金・特典・公開枠情報
 */
export async function GET(request: NextRequest) {
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

  const monthlyPublished = await getMonthlyPublishedCount(supabase, organizerId);
  const limit = organizer.subscription_status === "active"
    ? null
    : organizer.founder30_end_at && new Date(organizer.founder30_end_at) >= new Date()
      ? 3
      : 1;

  return NextResponse.json({
    organizer: {
      id: organizer.id,
      plan: organizer.plan,
      earlybird_eligible: organizer.earlybird_eligible,
      full_feature_trial_end_at: organizer.full_feature_trial_end_at,
      founder30_granted_at: organizer.founder30_granted_at,
      founder30_end_at: organizer.founder30_end_at,
      subscription_status: organizer.subscription_status,
      current_period_end: organizer.current_period_end,
      stripe_account_charges_enabled: organizer.stripe_account_charges_enabled,
    },
    monthlyPublished,
    publishLimit: limit,
  });
}
