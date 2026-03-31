"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type OrganizerRow = {
  id: string;
  organizationName: string | null;
  contactEmail: string | null;
  currentPlan: string;
  billingSource: string;
  manualGrantActive: boolean;
  manualGrantExpiresAt: string | null;
  manualGrantReason: string | null;
  eventCount: number;
  updatedAt?: string | null;
};

type FilterTab = "all" | "free" | "paid" | "manual" | "expiring";

function Badge({
  tone,
  children,
}: {
  tone: "neutral" | "primary" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
  const toneClasses =
    tone === "primary"
      ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
      : tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
      : tone === "warning"
      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
      : tone === "danger"
      ? "bg-red-50 text-red-700 ring-1 ring-red-100"
      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  return <span className={`${base} ${toneClasses}`}>{children}</span>;
}

export function OrganizersTable({ organizers }: { organizers: OrganizerRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();

    return organizers.filter((o) => {
      if (q) {
        const name = (o.organizationName ?? "").toLowerCase();
        const email = (o.contactEmail ?? "").toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }

      if (filter === "all") return true;

      const isFree = o.currentPlan === "free";
      const isPaid = o.currentPlan !== "free";
      const manualActive = o.manualGrantActive;
      const expiresAt = o.manualGrantExpiresAt
        ? new Date(o.manualGrantExpiresAt)
        : null;
      const diffDays =
        expiresAt != null
          ? (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          : null;
      const expiringSoon =
        manualActive && diffDays != null && diffDays >= 0 && diffDays <= 7;

      if (filter === "free") return isFree;
      if (filter === "paid") return isPaid;
      if (filter === "manual") return manualActive;
      if (filter === "expiring") return expiringSoon;

      return true;
    });
  }, [organizers, query, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">主催者一覧</h2>
          <p className="mt-1 text-sm text-slate-500">
            現在のプラン・課金状態・手動付与の状態を一覧で確認できます。
          </p>
        </div>
        <div className="text-xs text-slate-500">
          件数:{" "}
          <span className="font-semibold text-slate-700">
            {filtered.length.toLocaleString("ja-JP")} /{" "}
            {organizers.length.toLocaleString("ja-JP")}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {[
            { id: "all", label: "全件" },
            { id: "free", label: "無料" },
            { id: "paid", label: "有料" },
            { id: "manual", label: "手動付与中" },
            { id: "expiring", label: "期限切れ間近" },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as FilterTab)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-56 rounded-full border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            placeholder="主催者名・メールで検索"
          />
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/90">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-500">
            条件に合致する主催者が見つかりませんでした。
          </div>
        ) : (
          <table className="min-w-full border-separate border-spacing-y-0.5">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2 text-left">主催者名</th>
                <th className="px-3 py-2 text-left">メール</th>
                <th className="px-3 py-2 text-left">現在プラン</th>
                <th className="px-3 py-2 text-left">課金状態</th>
                <th className="px-3 py-2 text-left">手動付与</th>
                <th className="px-3 py-2 text-left">期限</th>
                <th className="px-3 py-2 text-right">イベント数</th>
                <th className="px-3 py-2 text-left">最終更新日</th>
                <th className="px-3 py-2 text-right">詳細</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const canOpenDetail =
                  typeof o.id === "string" && o.id.length > 0 && isUuid(o.id);
                const planTone =
                  o.currentPlan === "free" ? "neutral" : "primary";
                const now = new Date();
                const expiresAt = o.manualGrantExpiresAt
                  ? new Date(o.manualGrantExpiresAt)
                  : null;
                const diffDays =
                  expiresAt != null
                    ? (expiresAt.getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24)
                    : null;
                const isExpired =
                  expiresAt != null && expiresAt.getTime() < now.getTime();
                const expiringSoon =
                  o.manualGrantActive &&
                  diffDays != null &&
                  diffDays >= 0 &&
                  diffDays <= 7;

                return (
                  <tr
                    key={o.id}
                    className="border-b border-slate-100 text-sm last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="max-w-[200px] px-3 py-2 align-top">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {o.organizationName ?? "主催者"}
                      </div>
                    </td>
                    <td className="max-w-[220px] px-3 py-2 align-top">
                      <div
                        className="truncate text-xs text-slate-600"
                        title={o.contactEmail ?? undefined}
                      >
                        {o.contactEmail ?? "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Badge tone={planTone}>
                        {o.currentPlan === "free"
                          ? "無料プラン"
                          : `有料: ${o.currentPlan}`}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-slate-700">
                      {o.billingSource === "manual"
                        ? "手動付与"
                        : o.billingSource === "stripe"
                        ? "Stripe 課金"
                        : "無料扱い"}
                    </td>
                    <td className="px-3 py-2 align-top space-y-1 text-xs">
                      {o.manualGrantActive ? (
                        <Badge tone="success">手動付与中</Badge>
                      ) : (
                        <span className="text-slate-400">なし</span>
                      )}
                      {o.manualGrantReason && (
                        <div className="line-clamp-2 text-[11px] text-slate-500">
                          {o.manualGrantReason}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-xs">
                      {o.manualGrantExpiresAt ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-700">
                            {new Date(
                              o.manualGrantExpiresAt
                            ).toLocaleDateString("ja-JP")}
                          </span>
                          {isExpired && (
                            <Badge tone="danger">期限切れ</Badge>
                          )}
                          {!isExpired && expiringSoon && (
                            <Badge tone="warning">7日以内に期限切れ</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-right text-xs text-slate-700">
                      {o.eventCount}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-slate-500">
                      {o.updatedAt
                        ? new Date(o.updatedAt).toLocaleDateString("ja-JP")
                        : "-"}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      {canOpenDetail ? (
                        <Link
                          href={`/admin/organizers/${o.id}`}
                          className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          詳細
                        </Link>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

