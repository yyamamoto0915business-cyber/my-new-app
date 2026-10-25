"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  canUseOrganizerFeature,
  ORGANIZER_FEATURE_REQUIRED_TIER,
  type OrganizerPlanFeature,
} from "@/lib/billing";
import { getOrganizerCatalogPlan } from "@/lib/organizer-plans";
import { useOrganizerNavPlan } from "@/lib/organizer-pro-store";

const COPY: Record<OrganizerPlanFeature, { block: string; notice: string }> = {
  games: {
    block: "スタンプラリーやクイズなどのゲームは、GAMEプランで作れます。",
    notice:
      "ゲームの作成・編集はGAMEプランで使えます。作成済みのゲームは、このまま参加者が遊べます。",
  },
  pos: {
    block: "レジはSTANDARDプランから使えます。",
    notice:
      "レジでの会計と商品の登録はSTANDARDプランから使えます。これまでの売上の確認と返金は、このままできます。",
  },
};

type Props = {
  feature: OrganizerPlanFeature;
  /** block: プラン外なら中身の代わりに案内を出す / notice: 中身の上に案内を出す */
  mode?: "block" | "notice";
  children?: ReactNode;
};

/**
 * プランで使える機能を画面側で案内する。実際の制限は API（requireOrganizerFeature）で行う。
 */
export function OrganizerPlanFeatureGate({ feature, mode = "notice", children }: Props) {
  const plan = useOrganizerNavPlan();

  if (!plan) {
    return mode === "block" ? (
      <div className="h-40 animate-pulse rounded-2xl bg-[#e4ede0]" aria-hidden />
    ) : (
      <>{children}</>
    );
  }

  if (canUseOrganizerFeature(plan === "team" ? "game" : plan, feature)) {
    return <>{children}</>;
  }

  const required = getOrganizerCatalogPlan(ORGANIZER_FEATURE_REQUIRED_TIER[feature]);
  const notice = (
    <aside
      className="rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-amber-950 sm:px-5"
      aria-label={`${required.name}プランの案内`}
    >
      <p className="text-sm leading-relaxed">
        {mode === "block" ? COPY[feature].block : COPY[feature].notice}
        <span className="ml-1 text-amber-800">
          （{required.name}・{required.monthlyPriceLabel}）
        </span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/organizer/settings/plan"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          プランを変更する
        </Link>
      </div>
    </aside>
  );

  if (mode === "block") return notice;
  return (
    <>
      <div className="mb-3">{notice}</div>
      {children}
    </>
  );
}
