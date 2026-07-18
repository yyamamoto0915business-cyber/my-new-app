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

export function OrganizersTable({
  organizers,
  compact = false,
}: {
  organizers: OrganizerRow[];
  compact?: boolean;
}) {
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
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact ? (
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
      ) : (
        <div className="text-right text-[11px] text-[#7a9888]">
          {filtered.length.toLocaleString("ja-JP")} /{" "}
          {organizers.length.toLocaleString("ja-JP")} 件
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#eaf2ec] px-2 py-1.5">
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
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-[#1e3848] text-white"
                    : "bg-white text-[#3a5848] hover:bg-white/80"
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
            className="h-7 w-48 rounded-md border border-[#c8dcd0] bg-white pl-7 pr-2 text-[11px] text-[#0e1610] placeholder:text-[#9ab0a0] focus:outline-none focus:ring-1 focus:ring-[#1e3848]"
            placeholder="主催者名・メールで検索"
          />
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#9ab0a0]">
            <svg
              className="h-3 w-3"
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

      <div className="overflow-x-auto rounded-lg border border-[#d8e8dc] bg-white">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-[#7a9888]">
            条件に合致する主催者が見つかりませんでした。
          </div>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-[#e0ece4] bg-[#f4faf6] text-[10px] uppercase tracking-wide text-[#7a9888]">
                <th className="px-2.5 py-1.5 text-left font-medium">主催者名</th>
                <th className="px-2.5 py-1.5 text-left font-medium">メール</th>
                <th className="px-2.5 py-1.5 text-left font-medium">プラン</th>
                <th className="px-2.5 py-1.5 text-left font-medium">課金</th>
                <th className="px-2.5 py-1.5 text-left font-medium">手動付与</th>
                <th className="px-2.5 py-1.5 text-left font-medium">期限</th>
                <th className="px-2.5 py-1.5 text-right font-medium">イベント</th>
                <th className="px-2.5 py-1.5 text-left font-medium">更新日</th>
                <th className="px-2.5 py-1.5 text-right font-medium">詳細</th>
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
                    className="border-b border-[#eef4f0] text-xs last:border-0 hover:bg-[#f4faf6]"
                  >
                    <td className="max-w-[180px] px-2.5 py-1.5 align-middle">
                      <div className="truncate font-medium text-[#0e1610]">
                        {o.organizationName ?? "主催者"}
                      </div>
                    </td>
                    <td className="max-w-[200px] px-2.5 py-1.5 align-middle">
                      <div
                        className="truncate text-[11px] text-[#5a7868]"
                        title={o.contactEmail ?? undefined}
                      >
                        {o.contactEmail ?? "-"}
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5 align-middle">
                      <Badge tone={planTone}>
                        {o.currentPlan === "free"
                          ? "無料"
                          : o.currentPlan}
                      </Badge>
                    </td>
                    <td className="px-2.5 py-1.5 align-middle text-[11px] text-[#5a7868]">
                      {o.billingSource === "manual"
                        ? "手動"
                        : o.billingSource === "stripe"
                        ? "Stripe"
                        : "無料"}
                    </td>
                    <td className="px-2.5 py-1.5 align-middle text-[11px]">
                      {o.manualGrantActive ? (
                        <Badge tone="success">付与中</Badge>
                      ) : (
                        <span className="text-[#9ab0a0]">なし</span>
                      )}
                    </td>
                    <td className="px-2.5 py-1.5 align-middle text-[11px]">
                      {o.manualGrantExpiresAt ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#5a7868]">
                            {new Date(
                              o.manualGrantExpiresAt
                            ).toLocaleDateString("ja-JP")}
                          </span>
                          {isExpired && (
                            <Badge tone="danger">期限切れ</Badge>
                          )}
                          {!isExpired && expiringSoon && (
                            <Badge tone="warning">間近</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#9ab0a0]">-</span>
                      )}
                    </td>
                    <td className="px-2.5 py-1.5 align-middle text-right text-[#5a7868]">
                      {o.eventCount}
                    </td>
                    <td className="px-2.5 py-1.5 align-middle text-[11px] text-[#7a9888]">
                      {o.updatedAt
                        ? new Date(o.updatedAt).toLocaleDateString("ja-JP")
                        : "-"}
                    </td>
                    <td className="px-2.5 py-1.5 align-middle text-right">
                      {canOpenDetail ? (
                        <Link
                          href={`/admin/organizers/${o.id}`}
                          className="inline-flex items-center rounded-md bg-[#1e3848] px-2 py-0.5 text-[11px] font-medium text-white hover:bg-[#152836]"
                        >
                          詳細
                        </Link>
                      ) : (
                        <span className="text-[#9ab0a0]">-</span>
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

