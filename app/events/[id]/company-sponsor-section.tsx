"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { SponsorTier } from "@/lib/db/types";

type SponsorData = {
  tiers: { individual: SponsorTier[]; company: SponsorTier[] };
  applications: unknown[];
};

type Props = { eventId: string };

export function CompanySponsorSection({ eventId }: Props) {
  const [data, setData] = useState<SponsorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventId}/sponsor-tiers`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading || !data) {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          企業スポンサー
        </h2>
        <p className="mt-2 text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  const tiers = data.tiers.company;

  return (
    <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        企業スポンサー（協賛）
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        協賛金の使い道：会場費・備品・保険・広報・交通費など
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
        掲載に必要な情報：企業名・URL・ロゴ・担当者・メール
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
        提出期限：開催7日前目安
      </p>

      <div className="mt-6 space-y-4">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-start sm:justify-between dark:border-zinc-700"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                ¥{tier.price.toLocaleString()} / {tier.name}
              </p>
              {tier.description && (
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {tier.description}
                </p>
              )}
              {tier.benefits?.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {tier.benefits.map((b) => (
                    <li key={b}>・{b}</li>
                  ))}
                </ul>
              )}
            </div>
            <Link
              href={`/events/${eventId}/sponsor/apply?tier=${tier.id}`}
              className="shrink-0 rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/5"
            >
              スポンサー申込
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
