/**
 * 主催者向け「料金プラン・公開枠」表示用の共通型・ヘルパー
 */
import { FREE_PLAN_NORMAL_SLOTS, FOUNDER_BONUS_SLOTS } from "@/lib/billing";
import { isPaidOrganizer } from "@/lib/billing";

export type PlanSummary = {
  /** 表示用プラン名（例: Starterプラン / Proプラン） */
  planLabel: string;
  /** 無料プラン（Pro 未契約）かどうか */
  isFreePlan: boolean;
  /** JST 当月に公開した件数 */
  monthlyPublished: number;
  /** 今月の公開上限。null は無制限（Pro 等） */
  publishLimit: number | null;
  /** 例: 0/1 ・ 無制限 */
  slotsDisplay: string;
};

type OrganizerLike = {
  subscription_status?: string | null;
  stripe_status?: string | null;
  founder30_end_at?: string | null;
  manual_grant_active?: boolean | null;
  manual_grant_expires_at?: string | null;
};

/** API / サーバー双方で使う: 公開枠上限を算出 */
export function computePublishLimit(organizer: OrganizerLike): number | null {
  if (isPaidOrganizer(organizer)) return null;
  const founderEnd = organizer.founder30_end_at;
  if (founderEnd && new Date(founderEnd) >= new Date()) {
    return FREE_PLAN_NORMAL_SLOTS + FOUNDER_BONUS_SLOTS;
  }
  return 1;
}

export function buildPlanSummary(
  organizer: OrganizerLike,
  monthlyPublished: number
): PlanSummary {
  const isPaid = isPaidOrganizer(organizer);
  const planLabel = isPaid ? "Proプラン" : "Starterプラン";
  const publishLimit = computePublishLimit(organizer);
  const slotsDisplay =
    publishLimit === null ? "無制限" : `${monthlyPublished}/${publishLimit}`;

  return {
    planLabel,
    isFreePlan: !isPaid,
    monthlyPublished,
    publishLimit,
    slotsDisplay,
  };
}
