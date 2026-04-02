"use client";

import Link from "next/link";
import type { PlanSummary } from "@/lib/organizer-plan-summary";

type Props = {
  planSummary: PlanSummary | null | undefined;
  /** 公開枠不足など、別導線に集約したいときにCTAを隠す */
  hideUpgradeCta?: boolean;
  /** 枠の数字を別ボックスに集約したいときに隠す */
  hideSlots?: boolean;
};

/**
 * イベント一覧・作成などで「今のプランと公開枠」を一行で示す
 */
export function OrganizerPlanInlineHint({
  planSummary,
  hideUpgradeCta = false,
  hideSlots = false,
}: Props) {
  if (!planSummary) return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span>
          <span className="text-slate-500">現在のプラン：</span>
          <span className="font-medium text-slate-900">{planSummary.planLabel}</span>
        </span>
        {!hideSlots && (
          <span>
            <span className="text-slate-500">今月の公開枠：</span>
            <span className="font-medium text-slate-900">{planSummary.slotsDisplay}</span>
          </span>
        )}
      </div>
      {planSummary.isFreePlan && !hideUpgradeCta && (
        <Link
          href="/organizer/settings/plan"
          className="shrink-0 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100/80"
        >
          公開枠を増やす → プラン変更
        </Link>
      )}
    </div>
  );
}
