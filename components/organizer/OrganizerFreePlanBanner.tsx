"use client";

import Link from "next/link";
import type { PlanSummary } from "@/lib/organizer-plan-summary";

type Props = {
  planSummary: PlanSummary | null | undefined;
  /** 主催ダッシュボードではやや強調、イベント一覧では控えめにするなど */
  variant?: "default" | "soft";
};

export function OrganizerFreePlanBanner({ planSummary, variant = "default" }: Props) {
  if (!planSummary?.isFreePlan) return null;

  const box =
    variant === "soft"
      ? "border-slate-200/80 bg-slate-50/90 text-slate-700"
      : "border-amber-200/70 bg-amber-50/70 text-amber-950";

  return (
    <aside
      className={`rounded-2xl border px-4 py-3 sm:px-5 ${box}`}
      aria-label="無料プランの案内"
    >
      <p className="text-sm leading-relaxed">
        現在は無料プランです。公開枠を増やしたり、継続して主催しやすくするには
        <span className="whitespace-nowrap font-medium">プラン変更（アップグレード）</span>
        をご利用ください。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/organizer/settings/plan"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          プランを変更する
        </Link>
        <Link
          href="/organizer/settings/plan"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          プランを見る
        </Link>
      </div>
    </aside>
  );
}
