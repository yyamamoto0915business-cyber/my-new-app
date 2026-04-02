"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import type { PlanSummary } from "@/lib/organizer-plan-summary";

type Props = {
  planSummary: PlanSummary;
};

export function OrganizerPlanHighlightCard({ planSummary }: Props) {
  const isFree = planSummary.isFreePlan;
  const accent =
    isFree
      ? "border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-[var(--mg-paper)] shadow-[0_2px_12px_rgba(245,158,11,0.12)]"
      : "border-[var(--mg-accent)]/20 bg-gradient-to-br from-[var(--accent-soft)]/40 via-white to-[var(--mg-paper)]";

  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${accent}`}
      aria-labelledby="organizer-plan-highlight-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/90 text-[var(--mg-accent)] shadow-sm dark:bg-zinc-800/90">
            <Layers className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p id="organizer-plan-highlight-heading" className="text-sm font-semibold text-slate-900">
              プラン・公開枠
            </p>
            {isFree && (
              <span className="mt-1 inline-flex rounded-full bg-amber-100/90 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                現在は無料プランです
              </span>
            )}
          </div>
        </div>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <dt className="text-slate-500">現在のプラン</dt>
          <dd className="font-semibold text-slate-900">{planSummary.planLabel}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <dt className="text-slate-500">今月の公開枠</dt>
          <dd className="font-semibold text-slate-900">{planSummary.slotsDisplay}</dd>
        </div>
      </dl>
      {isFree && (
        <p className="mt-3 text-xs leading-relaxed text-slate-600">
          もっと公開したい場合は、プラン変更で公開枠を増やせます。
        </p>
      )}
      <div className="mt-4">
        <Link
          href="/organizer/settings/plan"
          className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
        >
          プランを変更する
        </Link>
      </div>
    </section>
  );
}
