"use client";

import Link from "next/link";
import { Users } from "lucide-react";

type Props = {
  hasFilter: boolean;
  recruitmentId: string;
};

export function ApplicationsEmptyState({ hasFilter, recruitmentId }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-sm">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
        aria-hidden
      >
        <Users className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800">
        {hasFilter ? "該当する応募がありません" : "まだ申込はありません"}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {hasFilter
          ? "検索条件や絞り込みを変えて、もう一度お試しください"
          : "公開後に参加者が集まると、ここに表示されます"}
      </p>
      <Link
        href={`/organizer/recruitments/${recruitmentId}`}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
      >
        募集詳細を見る
      </Link>
    </div>
  );
}
