/**
 * Organizer作成時のEarlybird/Founder30付与
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organizer } from "./types";

const EARLYBIRD_SIGNUP_END = process.env.EARLYBIRD_SIGNUP_END;

/** Earlybird判定：3ヶ月以内登録 */
function isEarlybirdEligible(createdAt: Date): boolean {
  if (!EARLYBIRD_SIGNUP_END) return false;
  const end = new Date(EARLYBIRD_SIGNUP_END);
  return createdAt <= end;
}

/** 6ヶ月後の日時 */
function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

/** 1年後の日時 */
function addYears(d: Date, years: number): Date {
  const result = new Date(d);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export type CreateOrganizerWithGrantsInput = {
  profileId: string;
  organizationName: string;
  contactEmail?: string;
  contactPhone?: string;
};

/**
 * Organizer作成＋Earlybird/Founder30付与
 * Founder30はDB関数で原子化（競合対策）
 */
export async function createOrganizerWithGrants(
  supabase: SupabaseClient,
  input: CreateOrganizerWithGrantsInput
): Promise<Organizer> {
  const now = new Date();
  let earlybirdEligible = false;
  let fullFeatureTrialEndAt: string | null = null;
  let plan: "free" | "trial" | "starter" = "free";

  if (isEarlybirdEligible(now)) {
    earlybirdEligible = true;
    fullFeatureTrialEndAt = addMonths(now, 6).toISOString();
    plan = "trial";
  }

  const { data: inserted, error } = await supabase
    .from("organizers")
    .insert({
      profile_id: input.profileId,
      organization_name: input.organizationName,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      earlybird_eligible: earlybirdEligible,
      full_feature_trial_end_at: fullFeatureTrialEndAt,
      plan,
    })
    .select()
    .single();

  if (error) throw error;

  // Founder30: RPCで原子付与
  try {
    await supabase.rpc("maybe_grant_founder30", {
      p_organizer_id: inserted.id,
    });
  } catch {
    console.error("maybe_grant_founder30 failed:", inserted.id);
  }

  const { data: updated } = await supabase
    .from("organizers")
    .select("*")
    .eq("id", inserted.id)
    .single();

  return (updated ?? inserted) as Organizer;
}
