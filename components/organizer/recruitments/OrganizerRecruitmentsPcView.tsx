"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  ChevronRight,
  Copy,
  FilePlus2,
  Globe,
  LayoutTemplate,
  MessageCircle,
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
  closed: "終了",
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
  return roles.map((r) => r.name).filter(Boolean).join("・") || "—";
}

function formatDateTimeRange(
  startAt: string | null | undefined,
  endAt: string | null | undefined
): string {
  if (!startAt) return "—";
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
  if (startTime && endTime) return `${date} ${startTime}〜${endTime}`;
  if (startTime) return `${date} ${startTime}`;
  return date;
}

function formatCreatedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getStatusBadge(r: RecruitmentDashboardItem): {
  label: string;
  className: string;
} {
  if ((r.pendingCount ?? 0) > 0) {
    return {
      label: "応募確認",
      className: "bg-white text-[#2B5A8B] border-[#8BB8D8]",
    };
  }
  if (r.status === "public") {
    return {
      label: "募集中",
      className: "bg-[#EAF6DE] text-[#3a7a10] border-[#B8DEB0]",
    };
  }
  if (r.status === "closed") {
    return { label: "終了", className: "bg-[#f0eeea] text-[#7a6a58] border-[#e8e6e0]" };
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
  const capacity = recruitment.capacity;
  const applicantText =
    capacity != null && capacity > 0
      ? `${recruitment.applicationCount}/${capacity}人`
      : `${recruitment.applicationCount}人`;

  const badge = getStatusBadge(recruitment);

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
        <div className="flex items-center gap-2">
          <span className="mg-recruitments-pc__row-icon" aria-hidden>
            <Users className="h-3.5 w-3.5 text-[#7a9488]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="mg-recruitments-pc__row-title truncate">{recruitment.title}</p>
            <p className="mg-recruitments-pc__row-sub truncate">{formatRoles(recruitment.roles)}</p>
          </div>
        </div>
      </td>
      <td className="mg-recruitments-pc__td">
        <span className={cn("mg-recruitments-pc__badge border", badge.className)}>{badge.label}</span>
      </td>
      <td className="mg-recruitments-pc__td mg-recruitments-pc__cell tabular-nums whitespace-nowrap">
        {applicantText}
      </td>
      <td className="mg-recruitments-pc__td mg-recruitments-pc__cell whitespace-nowrap">
        {formatDateTimeRange(recruitment.start_at, recruitment.end_at)}
      </td>
      <td className="mg-recruitments-pc__td mg-recruitments-pc__cell-meta whitespace-nowrap">
        {formatCreatedAt(recruitment.created_at)}
      </td>
      <td className="mg-recruitments-pc__td">
        <div className="flex items-center justify-end gap-1.5">
          <Link href={primaryHref} className="mg-recruitments-pc__btn-action">
            応募確認
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
                    href={`/organizer/recruitments/${recruitment.id}/day-of`}
                    className="block px-3 py-2 text-[12px] text-[#3a3428] hover:bg-[#f5f4f0]"
                    onClick={() => setMenuOpen(false)}
                  >
                    当日管理
                  </Link>
                  <Link
                    href="/messages"
                    className="block px-3 py-2 text-[12px] text-[#3a3428] hover:bg-[#f5f4f0]"
                    onClick={() => setMenuOpen(false)}
                  >
                    チャット
                  </Link>
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
        <span className="mg-recruitments-pc__kpi-link">
          詳細を見る
          <ChevronRight className="h-3 w-3" aria-hidden />
        </span>
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
  sortBy,
  onSortChange,
  kpiFilter,
  onKpiClick,
  onResetFilters,
  hasActiveFilters,
  nextAction,
  onRecruitmentUpdated,
}: Props) {
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

  const monthStats = useMemo(() => {
    const approved = allRecruitments.reduce((s, r) => s + (r.approvedCount ?? 0), 0);
    const scheduled = allRecruitments.filter((r) => {
      const d = r.start_at ? String(r.start_at).slice(0, 10) : "";
      return d && d >= new Date().toISOString().slice(0, 10);
    }).length;
    return {
      applications: kpis.totalApplications,
      approved,
      scheduled,
    };
  }, [allRecruitments, kpis.totalApplications]);

  const firstCopyId = allRecruitments[0]?.id;

  return (
    <div className="mg-recruitments-pc w-full">
      {/* ヒーロー + KPI */}
      <header className="mg-recruitments-pc__hero">
        <div className="relative z-[1] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="mg-recruitments-pc__title">スタッフ募集管理</h1>
            <p className="mg-recruitments-pc__desc mt-1.5 max-w-xl">
              イベントごとのスタッフ募集を管理。応募確認から当日管理まで行えます。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <Link href="/messages" className="mg-recruitments-pc__btn-outline">
              <MessageCircle className="h-4 w-4" aria-hidden />
              メッセージ
            </Link>
            <Link href="/organizer/recruitments/new" className="mg-recruitments-pc__btn-primary">
              <Plus className="h-4 w-4" aria-hidden />
              スタッフ募集を作成
            </Link>
          </div>
        </div>
      </header>

      <div className="mg-recruitments-pc__kpi-grid grid grid-cols-4 gap-4">
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
          value={kpis.todayCount}
          label="今日の募集"
          tone="success"
          active={kpiFilter === "today"}
          onClick={() => onKpiClick("today")}
        />
        <KpiCardPc
          icon={<Globe className="h-5 w-5 text-[#8a9e80]" />}
          value={kpis.active}
          label="公開中"
          tone="neutral"
          active={kpiFilter === "public"}
          onClick={() => onKpiClick("public")}
        />
      </div>

      <div className="mg-recruitments-pc__sections">
      {/* クイックアクション + ネクストアクション */}
      <div className="grid grid-cols-[1fr_1.35fr] gap-3">
        <section className="mg-recruitments-pc__panel p-4">
          <p className="text-[11px] font-semibold tracking-wide text-[#888]">クイックアクション</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link href="/organizer/recruitments/new" className="mg-recruitments-pc__quick">
              <span className="mg-recruitments-pc__quick-icon">
                <FilePlus2 className="h-5 w-5 text-[#6BBF3E]" aria-hidden />
              </span>
              <span>新規作成</span>
            </Link>
            <Link href="/organizer/recruitments/new" className="mg-recruitments-pc__quick">
              <span className="mg-recruitments-pc__quick-icon">
                <LayoutTemplate className="h-5 w-5 text-[#2B3A6B]" aria-hidden />
              </span>
              <span>テンプレートから作成</span>
            </Link>
            <Link
              href={
                firstCopyId
                  ? `/organizer/recruitments/new?copyFrom=${firstCopyId}`
                  : "/organizer/recruitments/new"
              }
              className="mg-recruitments-pc__quick"
            >
              <span className="mg-recruitments-pc__quick-icon">
                <Copy className="h-5 w-5 text-[#8a9e80]" aria-hidden />
              </span>
              <span>募集を複製</span>
            </Link>
          </div>
        </section>

        <section className="mg-recruitments-pc__panel mg-recruitments-pc__panel--next relative overflow-hidden p-4">
          <div className="relative z-[1] max-w-[72%]">
            <p className="text-[11px] font-semibold tracking-wide text-[#5a8ab0]">ネクストアクション</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#2A5A74]">{nextAction.description}</p>
            <Link href={nextAction.href} className="mg-recruitments-pc__btn-primary mt-3 inline-flex">
              {nextAction.label}
            </Link>
          </div>
          <div
            className="pointer-events-none absolute bottom-1 right-2 flex items-center justify-center opacity-80"
            aria-hidden
          >
            <Award className="h-[72px] w-[72px] text-[#7BADC4]/40" strokeWidth={1} />
          </div>
        </section>
      </div>

      {/* 一覧（検索・テーブル・フッター一体） */}
      <section className="mg-recruitments-pc__table-wrap">
        <div className="mg-recruitments-pc__filter-bar flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#bbb]"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="募集名で検索"
              className="mg-recruitments-pc__input w-full border-0 bg-transparent pl-8 shadow-none focus:shadow-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as RecruitmentsStatusFilter)}
            className="mg-recruitments-pc__select w-[140px] shrink-0 border-0 bg-transparent"
            aria-label="ステータス"
          >
            <option value="all">すべてのステータス</option>
            <option value="public">募集中</option>
            <option value="draft">下書き</option>
            <option value="closed">終了</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as RecruitmentsSortOption)}
            className="mg-recruitments-pc__select w-[132px] shrink-0 border-0 bg-transparent"
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
                <th>募集名</th>
                <th>ステータス</th>
                <th>応募者数</th>
                <th>日時</th>
                <th>作成日</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedList.map((r) => (
                <RecruitmentTableRow
                  key={r.id}
                  recruitment={r}
                  onUpdated={onRecruitmentUpdated}
                />
              ))}
            </tbody>
          </table>
        )}

        <footer className="mg-recruitments-pc__footer flex items-center justify-between">
          <p>
            <span className="font-medium text-[#2e3d2c]">今月の応募状況</span>
            <span className="mx-1.5 text-[#c5d4c0]">|</span>
            応募: <span className="font-semibold tabular-nums">{monthStats.applications}</span>
            <span className="mx-1.5 text-[#d4e8c8]">·</span>
            承認: <span className="font-semibold tabular-nums">{monthStats.approved}</span>
            <span className="mx-1.5 text-[#d4e8c8]">·</span>
            予定: <span className="font-semibold tabular-nums">{monthStats.scheduled}</span>
          </p>
          <Link href="/organizer" className="mg-recruitments-pc__footer-link text-[#2B3A6B] hover:underline">
            レポートを見る
            <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" aria-hidden />
          </Link>
        </footer>
      </section>
      </div>
    </div>
  );
}
