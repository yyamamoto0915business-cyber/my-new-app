"use client";

import { useState, useEffect } from "react";
import type { SponsorTier, SponsorPurchase, SponsorApplication } from "@/lib/db/types";

type SponsorData = {
  tiers: { individual: SponsorTier[]; company: SponsorTier[] };
  purchases: SponsorPurchase[];
  applications: SponsorApplication[];
  totalAmount: number;
};

type Props = {
  eventId: string;
  /** 目標金額（任意。進捗バー表示用） */
  goalAmount?: number;
  /** 親から渡されたデータ（省略時は自前で取得） */
  data?: SponsorData | null;
};

export function SponsorDisplaySection({ eventId, goalAmount, data: dataProp }: Props) {
  const [dataState, setDataState] = useState<SponsorData | null>(null);
  const data = dataProp ?? dataState;

  useEffect(() => {
    if (dataProp !== undefined) return;
    fetch(`/api/events/${eventId}/sponsor-tiers`)
      .then((r) => r.json())
      .then(setDataState)
      .catch(() => setDataState(null));
  }, [eventId, dataProp]);

  if (!data) return null;

  const { purchases, applications, totalAmount } = data;
  const hasCompanies = applications.length > 0;
  const hasIndividuals = purchases.length > 0;
  const hasGoal = goalAmount != null && goalAmount > 0;

  if (!hasCompanies && !hasIndividuals && totalAmount === 0 && !hasGoal) return null;

  const progressPercent =
    goalAmount && goalAmount > 0
      ? Math.min(100, Math.round((totalAmount / goalAmount) * 100))
      : null;

  return (
    <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        応援・協賛の状況
      </h2>

      {(totalAmount > 0 || progressPercent !== null) && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              支援総額
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              ¥{totalAmount.toLocaleString()}
            </span>
          </div>
          {progressPercent !== null && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {hasCompanies && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            企業スポンサー
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50"
              >
                {app.logoUrl ? (
                  <img
                    src={app.logoUrl}
                    alt={app.companyName}
                    className="h-8 w-8 rounded object-contain"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-zinc-200 text-xs font-medium dark:bg-zinc-700">
                    {app.companyName.slice(0, 1)}
                  </span>
                )}
                <span className="text-sm font-medium">{app.companyName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasIndividuals && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            支援者（個人）
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {purchases.map((p) => (
              <span
                key={p.id}
                className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
              >
                {p.isAnonymous
                  ? "匿名"
                  : p.displayName || "応援してくれた方"}
                <span className="ml-1 text-zinc-500">
                  ¥{(p.amount * (p.quantity || 1)).toLocaleString()}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
