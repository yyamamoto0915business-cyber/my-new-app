"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Landmark, Sparkles, ChevronRight } from "lucide-react";
import type { OrganizerBillingData } from "@/lib/organizer-billing-types";
import {
  getPlanLabel,
  getSlotsLabel,
  getReceivingStatus,
} from "@/lib/organizer-billing-display";

export function OrganizerSettingsPlanPayoutCards() {
  const [data, setData] = useState<OrganizerBillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/organizer/billing");
        const json = await res.json();
        if (res.ok && !cancelled) setData(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200/80" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200/80" />
      </div>
    );
  }

  if (!data) return null;

  const planLabel = getPlanLabel(data);
  const slots = getSlotsLabel(data);
  const receiving = getReceivingStatus(data);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/organizer/settings/plan"
        className="group relative flex flex-col rounded-2xl border-2 border-[var(--mg-accent)]/35 bg-gradient-to-br from-amber-50/80 via-white to-white p-5 shadow-md transition hover:border-[var(--mg-accent)]/55 hover:shadow-lg"
      >
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[var(--mg-accent)]/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          主催者プラン（公開枠）
        </span>
        <h2 className="mt-3 text-lg font-bold text-slate-900">プラン・公開枠</h2>
        <p className="mt-1 text-sm text-slate-600">
          現在のプランと今月の公開枠を確認し、プラン変更やお支払いに進めます。
        </p>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">現在のプラン</dt>
            <dd className="font-semibold text-slate-900">{planLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">今月の公開枠</dt>
            <dd className="font-semibold text-slate-900">{slots}</dd>
          </div>
        </dl>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--mg-accent,theme(colors.amber.600))]">
          プランを確認する
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>

      <Link
        href="/organizer/settings/payouts"
        className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
      >
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          <Landmark className="h-3.5 w-3.5" aria-hidden />
          売上受取
        </span>
        <h2 className="mt-3 text-base font-semibold text-slate-900">売上受取設定</h2>
        <p className="mt-1 text-sm text-slate-500">
          Stripeで売上を受け取るための連携です。料金プランとは別の設定です。
        </p>
        <p className="mt-4 text-sm text-slate-700">
          状態：
          <span
            className={`ml-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              receiving === "設定済み"
                ? "bg-emerald-100 text-emerald-800"
                : receiving === "決済未対応"
                  ? "bg-slate-200 text-slate-800"
                  : "bg-amber-100 text-amber-900"
            }`}
          >
            {receiving}
          </span>
        </p>
        <span className="mt-auto pt-4 text-sm font-medium text-slate-600 group-hover:text-slate-900">
          開く
          <ChevronRight className="ml-0.5 inline h-4 w-4 align-text-bottom" aria-hidden />
        </span>
      </Link>
    </div>
  );
}
