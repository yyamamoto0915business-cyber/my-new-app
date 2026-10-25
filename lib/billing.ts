/**
 * MachiGlyph: 課金・特典・公開枠のガードロジック
 */
import type { SupabaseClient } from "@supabase/supabase-js";
const TIMEZONE = "Asia/Tokyo";

/** JSTで当月の月初・月末のUTC境界を取得 */
function getJstMonthBounds(): { start: string; end: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const start = new Date(`${y}-${m}-01T00:00:00+09:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setSeconds(end.getSeconds() - 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/** 対象イベントがJST当月内に「公開済み（published_atが当月内）」か */
export async function isEventPublishedThisMonthJst(
  supabase: SupabaseClient,
  eventId: string
): Promise<boolean> {
  const { start, end } = getJstMonthBounds();
  const { data, error } = await supabase
    .from("events")
    .select("published_at")
    .eq("id", eventId)
    .single();

  if (error) return false;
  const publishedAt = data?.published_at;
  if (!publishedAt || typeof publishedAt !== "string") return false;

  return publishedAt >= start && publishedAt <= end;
}

/** 指定主催者のJST当月の公開イベント本数を取得 */
export async function getMonthlyPublishedCount(
  supabase: SupabaseClient,
  organizerId: string
): Promise<number> {
  const { start, end } = getJstMonthBounds();
  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("organizer_id", organizerId)
    .not("published_at", "is", null)
    .gte("published_at", start)
    .lte("published_at", end);

  if (error) return 0;
  return count ?? 0;
}

/** 全機能利用可否（運営機能ロック用） */
export function canUseFullFeatures(organizer: {
  full_feature_trial_end_at?: string | null;
  subscription_status?: string | null;
  manual_grant_active?: boolean | null;
  manual_grant_expires_at?: string | null;
}): boolean {
  const trialEnd = organizer.full_feature_trial_end_at;
  if (trialEnd) {
    if (new Date(trialEnd) >= new Date()) return true;
  }
  return isPaidOrganizer(organizer);
}

/** 無料プランの通常公開枠（毎月） */
export const FREE_PLAN_NORMAL_SLOTS = 1;

/** 先着特典の追加公開枠（毎月） */
export const FOUNDER_BONUS_SLOTS = 3;

/** イベント公開の月間上限 */
export function getPublishLimit(organizer: {
  subscription_status?: string | null;
  founder30_end_at?: string | null;
  manual_grant_active?: boolean | null;
  manual_grant_expires_at?: string | null;
}): number {
  if (isPaidOrganizer(organizer)) return Infinity;
  const founder30End = organizer.founder30_end_at;
  if (founder30End && new Date(founder30End) >= new Date()) {
    return FREE_PLAN_NORMAL_SLOTS + FOUNDER_BONUS_SLOTS; // 1 + 3 = 4
  }
  return FREE_PLAN_NORMAL_SLOTS; // 1
}

/** 公開可否チェック（上限含む） */
export async function canPublishEvent(
  supabase: SupabaseClient,
  organizerId: string,
  organizer: {
    subscription_status?: string | null;
    founder30_end_at?: string | null;
    manual_grant_active?: boolean | null;
    manual_grant_expires_at?: string | null;
  }
): Promise<{ ok: boolean; limit: number; current: number; message?: string }> {
  const limit = getPublishLimit(organizer);
  if (limit === Infinity) {
    return { ok: true, limit: Infinity, current: 0 };
  }
  const current = await getMonthlyPublishedCount(supabase, organizerId);
  return {
    ok: current < limit,
    limit,
    current,
    message:
      current >= limit
        ? `今月の無料公開枠（${limit}本）を超えています。月980円のProプランで無制限に公開できます。`
        : undefined,
  };
}

type PaidSource = {
  subscription_status?: string | null;
  stripe_status?: string | null;
  manual_grant_active?: boolean | null;
  manual_grant_expires_at?: string | null;
};

const PAID_STRIPE_STATUSES = ["active", "trialing", "past_due"];

function hasPaidStripeStatus(organizer: PaidSource): boolean {
  return (
    PAID_STRIPE_STATUSES.includes(organizer.subscription_status ?? "") ||
    PAID_STRIPE_STATUSES.includes(organizer.stripe_status ?? "")
  );
}

function isManualGrantActive(organizer: PaidSource): boolean {
  if (!organizer.manual_grant_active) return false;
  const exp = organizer.manual_grant_expires_at;
  if (!exp) return true; // 無期限付与
  return new Date(exp) > new Date();
}

export function isPaidOrganizer(organizer: PaidSource): boolean {
  return hasPaidStripeStatus(organizer) || isManualGrantActive(organizer);
}

/** 主催者プランの段階。DB 上は organizers.plan / manual_grant_plan が "game" のとき GAME */
export type OrganizerPlanTier = "free" | "standard" | "game";

type PlanTierSource = PaidSource & {
  plan?: string | null;
  manual_grant_plan?: string | null;
};

export function getOrganizerPlanTier(organizer: PlanTierSource): OrganizerPlanTier {
  if (isManualGrantActive(organizer) && organizer.manual_grant_plan === "game") return "game";
  if (hasPaidStripeStatus(organizer) && organizer.plan === "game") return "game";
  return isPaidOrganizer(organizer) ? "standard" : "free";
}

/** プランで使える範囲を分ける機能 */
export type OrganizerPlanFeature = "pos" | "games";

const PLAN_TIER_RANK: Record<OrganizerPlanTier, number> = { free: 0, standard: 1, game: 2 };

export const ORGANIZER_FEATURE_REQUIRED_TIER: Record<OrganizerPlanFeature, OrganizerPlanTier> = {
  pos: "standard",
  games: "game",
};

export function canUseOrganizerFeature(
  tier: OrganizerPlanTier,
  feature: OrganizerPlanFeature
): boolean {
  return PLAN_TIER_RANK[tier] >= PLAN_TIER_RANK[ORGANIZER_FEATURE_REQUIRED_TIER[feature]];
}

type PlanStateRow = {
  stripe_status?: string | null;
  manual_grant_active?: boolean | null;
  manual_grant_plan?: string | null;
  manual_grant_expires_at?: string | null;
};

/** organizers 行と organizer_plan_state を billing API と同じ優先度でマージ */
function mergePlanState(organizer: PlanTierSource, planState?: PlanStateRow | null): PlanTierSource {
  return {
    subscription_status: organizer.subscription_status ?? null,
    stripe_status: planState?.stripe_status ?? organizer.stripe_status ?? null,
    plan: organizer.plan ?? null,
    manual_grant_active:
      planState?.manual_grant_active ?? organizer.manual_grant_active ?? false,
    manual_grant_plan: planState?.manual_grant_plan ?? organizer.manual_grant_plan ?? null,
    manual_grant_expires_at:
      planState?.manual_grant_expires_at ?? organizer.manual_grant_expires_at ?? null,
  };
}

/** organizers 行と organizer_plan_state を billing API と同じ優先度でマージして有料判定 */
export function isPaidOrganizerWithPlanState(
  organizer: PlanTierSource,
  planState?: PlanStateRow | null
): boolean {
  return isPaidOrganizer(mergePlanState(organizer, planState));
}

export function getOrganizerPlanTierWithPlanState(
  organizer: PlanTierSource,
  planState?: PlanStateRow | null
): OrganizerPlanTier {
  return getOrganizerPlanTier(mergePlanState(organizer, planState));
}
