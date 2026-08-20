"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  RecruitmentDashboardItem,
  RecruitmentDashboardKpis,
} from "@/app/api/organizer/recruitments-dashboard/route";

const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  public: "募集中",
  closed: "募集終了",
};

export type RecruitmentsStatusFilter = "all" | "public" | "draft" | "closed";
export type RecruitmentsKpiFilter = "" | "pending_approval" | "has_applications" | "today" | "public";
export type RecruitmentsSortOption = "created_desc" | "created_asc" | "start_asc";

type NextAction = {
  label: string;
  description: string;
  href: string;
};

type Props = {
  kpis: RecruitmentDashboardKpis;
  filteredRecruitments: RecruitmentDashboardItem[];
  allRecruitments: RecruitmentDashboardItem[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: RecruitmentsStatusFilter;
  onStatusFilterChange: (v: RecruitmentsStatusFilter) => void;
  eventFilter: string;
  onEventFilterChange: (v: string) => void;
  sortBy: RecruitmentsSortOption;
  onSortChange: (v: RecruitmentsSortOption) => void;
  kpiFilter: RecruitmentsKpiFilter;
  onKpiClick: (filter: RecruitmentsKpiFilter) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  nextAction: NextAction;
  onRecruitmentUpdated: () => void;
};

function formatRoles(roles: { name: string; count: number }[]): string {
  if (!roles?.length) return "—";
  return roles.map((r) => r.name).filter(Boolean).join("、") || "—";
}

function formatDateParts(
  startAt: string | null | undefined,
  endAt: string | null | undefined
): { date: string; time: string } {
  if (!startAt) return { date: "—", time: "" };
  const start = new Date(startAt);
  const date = start.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  const startTime =
    typeof startAt === "string" && startAt.length > 10 ? startAt.slice(11, 16) : "";
  const endTime =
    endAt && typeof endAt === "string" && endAt.length > 10 ? endAt.slice(11, 16) : "";
  if (startTime && endTime) return { date, time: `${startTime} - ${endTime}` };
  if (startTime) return { date, time: startTime };
  return { date, time: "" };
}

function getStatusBadge(r: RecruitmentDashboardItem): {
  label: string;
  className: string;
} {
  if (r.status === "public") {
    return {
      label: "募集中",
      className: "bg-[#EAF6DE] text-[#3a7a10] border-[#B8DEB0]",
    };
  }
  if (r.status === "closed") {
    return { label: "募集終了", className: "bg-[#f0eeea] text-[#7a6a58] border-[#e8e6e0]" };
  }
  return {
    label: STATUS_LABELS[r.status] ?? r.status,
    className: "bg-[#FFF8E8] text-[#9a7b20] border-[#E8D9A8]",
  };
}

function RecruitmentTableRow({
  recruitment,
  onUpdated,
}: {
  recruitment: RecruitmentDashboardItem;
  onUpdated: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const primaryHref = `/organizer/recruitments/${recruitment.id}`;
  const applicantText = `${recruitment.applicationCount}名`;
  const badge = getStatusBadge(recruitment);
  const datetime = formatDateParts(recruitment.start_at, recruitment.end_at);

  const handleClose = async () => {
    if (recruitment.status !== "public" || closing) return;
    if (!window.confirm("この募集を終了しますか？")) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/recruitments/${recruitment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert((data as { error?: string }).error ?? "終了に失敗しました");
        return;
      }
      setMenuOpen(false);
      onUpdated();
    } finally {
      setClosing(false);
    }
  };

  return (
    <tr className="mg-recruitments-pc__tr">
      <td className="mg-recruitments-pc__td">
        <div className="flex items-center gap-2.5">
          <span className="mg-recruitments-pc__row-icon mg-recruitments-pc__row-icon--green" aria-hidden>
            <Users className="h-3.5 w-3.5 text-[#3a7a10]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="mg-recruitments-pc__row-title truncate">{recruitment.title}</p>
            <p className="mg-recruitments-pc__row-sub truncate">
              {recruitment.eventTitle?.trim() || "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="mg-recruitments-pc__td">
        <span className={cn("mg-recruitments-pc__badge border", badge.className)}>{badge.label}</span>
      </td>
      <td className="mg-recruitments-pc__td mg-recruitments-pc__cell tabular-nums whitespace-nowrap">
        {applicantText}
      </td>
      <td className="mg-recruitments-pc__td mg-recruitments-pc__cell tabular-nums whitespace-nowrap">
        <span
          className={cn(
            (recruitment.pendingCount ?? 0) > 0 ? "font-semibold text-[#c45a1a]" : "text-[#8a9e80]"
          )}
        >
          {recruitment.pendingCount ?? 0}件
        </span>
      </td>
      <td className="mg-recruitments-pc__td mg-recruitments-pc__cell whitespace-nowrap">
        <div className="flex items-start gap-1.5">
          <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8a9e80]" aria-hidden />
          <div>
            <p>{datetime.date}</p>
            {datetime.time ? <p className="text-[11px] text-[#8a9e80]">{datetime.time}</p> : null}
          </div>
        </div>
      </td>
      <td className="mg-recruitments-pc__td mg-recruitments-pc__cell">
        <span className="line-clamp-2">{formatRoles(recruitment.roles)}</span>
      </td>
      <td className="mg-recruitments-pc__td">
        <div className="flex items-center justify-end gap-1.5">
        <Link
          href={primaryHref}
          className="mg-recruitments-pc__btn-action mg-recruitments-pc__btn-action--primary"
        >
          応募者確認
        </Link>
        <Link
          href={`/organizer/recruitments/new?editId=${recruitment.id}`}
          className="mg-recruitments-pc__btn-action"
        >
          編集
        </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="mg-recruitments-pc__btn-menu"
              aria-label="メニュー"
            >
              <MoreVertical className="h-3.5 w-3.5" aria-hidden />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[148px] overflow-hidden rounded-lg border border-[#e8e6e0] bg-white py-1 shadow-lg">
                  <Link
                    href={`/organizer/recruitments/new?copyFrom=${recruitment.id}`}
                    className="block px-3 py-2 text-[12px] text-[#3a3428] hover:bg-[#f5f4f0]"
                    onClick={() => setMenuOpen(false)}
                  >
                    複製
                  </Link>
                  {recruitment.status === "public" && (
                    <button
                      type="button"
                      disabled={closing}
                      className="block w-full px-3 py-2 text-left text-[12px] text-[#8a2c20] hover:bg-[#fef0ee] disabled:opacity-50"
                      onClick={() => void handleClose()}
                    >
                      {closing ? "処理中…" : "募集を終了"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

function KpiCardPc({
  icon,
  value,
  label,
  tone,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "danger" | "primary" | "success" | "neutral";
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("mg-recruitments-pc__kpi", `mg-recruitments-pc__kpi--${tone}`, active && "is-active")}
      aria-pressed={active}
    >
      <div className="mg-recruitments-pc__kpi-icon">{icon}</div>
      <div className="min-w-0 flex-1 text-left">
        <p className="mg-recruitments-pc__kpi-value">{value}</p>
        <p className="mg-recruitments-pc__kpi-label">{label}</p>
      </div>
    </button>
  );
}

export function OrganizerRecruitmentsPcView({
  kpis,
  filteredRecruitments,
  allRecruitments,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  eventFilter,
  onEventFilterChange,
  sortBy,
  onSortChange,
  kpiFilter,
  onKpiClick,
  onResetFilters,
  hasActiveFilters,
  nextAction,
  onRecruitmentUpdated,
}: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const eventOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of allRecruitments) {
      if (r.event_id && r.eventTitle) map.set(r.event_id, r.eventTitle);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "ja"));
  }, [allRecruitments]);

  const sortedList = useMemo(() => {
    const list = [...filteredRecruitments];
    if (sortBy === "created_asc") {
      list.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    } else if (sortBy === "start_asc") {
      list.sort((a, b) => (a.start_at ?? "").localeCompare(b.start_at ?? ""));
    } else {
      list.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    return list;
  }, [filteredRecruitments, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, eventFilter, sortBy, kpiFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedList.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = sortedList.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, sortedList.length);
  const pageItems = sortedList.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="mg-recruitments-pc w-full">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="mg-recruitments-pc__title">ボランティア募集管理</h1>
          <p className="mg-recruitments-pc__desc mt-1.5 max-w-xl">
            イベントごとのボランティア募集を管理し、応募状況や当日運営まで行えます。
          </p>
        </div>
        <Link href="/organizer/recruitments/new" className="mg-recruitments-pc__btn-primary shrink-0">
          <Plus className="h-4 w-4" aria-hidden />
          スタッフ募集を作成
        </Link>
      </header>

      <div className="mg-recruitments-pc__kpi-grid mt-5 grid grid-cols-3 gap-4">
        <KpiCardPc
          icon={<UserCheck className="h-5 w-5 text-[#D45A72]" />}
          value={kpis.pendingApproval}
          label="承認待ち"
          tone="danger"
          active={kpiFilter === "pending_approval"}
          onClick={() => onKpiClick("pending_approval")}
        />
        <KpiCardPc
          icon={<Users className="h-5 w-5 text-[#2B3A6B]" />}
          value={kpis.totalApplications}
          label="応募あり"
          tone="primary"
          active={kpiFilter === "has_applications"}
          onClick={() => onKpiClick("has_applications")}
        />
        <KpiCardPc
          icon={<Calendar className="h-5 w-5 text-[#4A9A2E]" />}
          value={kpis.active}
          label="公開中"
          tone="success"
          active={kpiFilter === "public"}
          onClick={() => onKpiClick("public")}
        />
      </div>

      <div className="mg-recruitments-pc__sections">
        {kpis.pendingApproval > 0 && (
          <div className="mg-recruitments-pc__alert">
            <div className="flex min-w-0 items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#c45a1a]" aria-hidden />
              <p className="text-[13px] font-medium text-[#5a3a18]">
                承認待ちの応募が{kpis.pendingApproval}件あります
              </p>
            </div>
            <Link href={nextAction.href} className="mg-recruitments-pc__alert-btn">
              確認する
            </Link>
          </div>
        )}

        <section className="mg-recruitments-pc__table-wrap" id="recruitments-list">
          <div className="mg-recruitments-pc__filter-bar flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#bbb]"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="募集名・イベント名・役割で検索"
                className="mg-recruitments-pc__input w-full border-0 bg-transparent pl-8 shadow-none focus:shadow-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as RecruitmentsStatusFilter)}
              className="mg-recruitments-pc__select w-[148px] shrink-0 border-0 bg-transparent"
              aria-label="ステータス"
            >
              <option value="all">すべてのステータス</option>
              <option value="public">募集中</option>
              <option value="draft">下書き</option>
              <option value="closed">募集終了</option>
            </select>
            <select
              value={eventFilter}
              onChange={(e) => onEventFilterChange(e.target.value)}
              className="mg-recruitments-pc__select w-[160px] shrink-0 border-0 bg-transparent"
              aria-label="イベント"
            >
              <option value="">すべてのイベント</option>
              {eventOptions.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as RecruitmentsSortOption)}
              className="mg-recruitments-pc__select w-[120px] shrink-0 border-0 bg-transparent"
              aria-label="並び替え"
            >
              <option value="created_desc">新しい順</option>
              <option value="created_asc">古い順</option>
              <option value="start_asc">開催日が近い順</option>
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="shrink-0 text-[11px] text-[#8a9e80] hover:underline"
              >
                リセット
              </button>
            )}
          </div>

          {sortedList.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-[13px] font-medium text-[#526448]">
                {allRecruitments.length === 0 ? "募集がまだありません" : "該当する募集がありません"}
              </p>
              {allRecruitments.length === 0 && (
                <Link
                  href="/organizer/recruitments/new"
                  className="mg-recruitments-pc__btn-primary mt-4 inline-flex"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  スタッフ募集を作成
                </Link>
              )}
            </div>
          ) : (
            <table className="mg-recruitments-pc__table w-full">
              <thead>
                <tr>
                  <th>募集名 / イベント</th>
                  <th>ステータス</th>
                  <th>応募者数</th>
                  <th>承認待ち</th>
                  <th>イベント日時</th>
                  <th>主な役割</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <RecruitmentTableRow
                    key={r.id}
                    recruitment={r}
                    onUpdated={onRecruitmentUpdated}
                  />
                ))}
              </tbody>
            </table>
          )}

          <footer className="mg-recruitments-pc__pager">
            <p className="text-[12px] text-[#8a9e80]">
              {sortedList.length === 0
                ? "0件"
                : `${pageStart}-${pageEnd} / ${sortedList.length}件`}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="mg-recruitments-pc__pager-btn"
                aria-label="前のページ"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="mg-recruitments-pc__pager-current">{safePage}</span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="mg-recruitments-pc__pager-btn"
                aria-label="次のページ"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-[#8a9e80]">
              表示件数
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="mg-recruitments-pc__select border border-[#e8e6e0] bg-white"
                aria-label="表示件数"
              >
                <option value={10}>10件</option>
                <option value={20}>20件</option>
                <option value={50}>50件</option>
              </select>
            </label>
          </footer>
        </section>
      </div>
    </div>
  );
}
