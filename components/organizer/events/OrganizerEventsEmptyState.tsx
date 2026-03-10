"use client";

import Link from "next/link";
import { CalendarPlus } from "lucide-react";

type Props = {
  hasFilter?: boolean;
};

export function OrganizerEventsEmptyState({ hasFilter = false }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-sm">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
        aria-hidden
      >
        <CalendarPlus className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800">
        {hasFilter ? "該当するイベントがありません" : "まだイベントがありません"}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {hasFilter
          ? "検索条件や絞り込みを変えて、もう一度お試しください"
          : "最初のイベントを作成してみましょう"}
      </p>
      {!hasFilter && (
        <Link
          href="/organizer/events/new"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          新しいイベントを作成
        </Link>
      )}
    </div>
  );
}
