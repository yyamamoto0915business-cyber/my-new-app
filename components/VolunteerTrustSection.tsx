"use client";

import type { ReactNode } from "react";

type VolunteerTrustSectionProps = {
  beginnerFriendlyCount?: number;
  isLoading?: boolean;
};

function TrustItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/70 p-3 dark:bg-zinc-800/30">
      <div className="mb-1 text-[18px]">{icon}</div>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </p>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}

export function VolunteerTrustSection({
  beginnerFriendlyCount,
  isLoading = false,
}: VolunteerTrustSectionProps) {
  return (
    <section className="mb-6 rounded-2xl border border-zinc-200/60 bg-white/70 p-4 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/60">
      <div className="grid gap-3 sm:grid-cols-3">
        <TrustItem
          icon="🌿"
          title="初心者でも参加しやすい募集あり"
          description={
            isLoading
              ? "募集中の内容を読み込んでいます…"
              : `初心者歓迎 ${beginnerFriendlyCount ?? 0}件`
          }
        />
        <TrustItem
          icon="🧾"
          title="条件が見やすく、比較しやすい"
          description="交通費・食事・宿泊などをバッジで確認できます。"
        />
        <TrustItem
          icon="💬"
          title="主催者に問い合わせしやすい"
          description="不安な点は先に相談してから応募できます。"
        />
      </div>
    </section>
  );
}

