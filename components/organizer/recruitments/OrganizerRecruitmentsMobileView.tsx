"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  Globe,
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
  SlidersHorizontal,
  UserCheck,
  Users,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  RecruitmentDashboardItem,
  RecruitmentDashboardKpis,
} from "@/app/api/organizer/recruitments-dashboard/route";
import type {
  RecruitmentsKpiFilter,
  RecruitmentsSortOption,
  RecruitmentsStatusFilter,
} from "@/components/organizer/recruitments/OrganizerRecruitmentsPcView";

const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  public: "募集中",
  closed: "終了",
};

const STATUS_OPTIONS: { value: RecruitmentsStatusFilter; label: string }[] = [
  { value: "all", label: "すべてのステータス" },
  { value: "public", label: "募集中" },
  { value: "draft", label: "下書き" },
  { value: "closed", label: "終了" },
];

const SORT_OPTIONS: { value: RecruitmentsSortOption; label: string }[] = [
  { value: "created_desc", label: "新しい順" },
  { value: "created_asc", label: "古い順" },
  { value: "start_asc", label: "開催日が近い順" },
];

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

function formatRolesLabel(roles: { name: string; count: number }[]): string {
  if (!roles?.length) return "—";
  const names = roles.map((r) => r.name).filter(Boolean);
  return names.length ? names.join("・") : "—";
}

function formatScheduleShort(
  startAt: string | null | undefined,
  endAt: string | null | undefined
): string {
  if (!startAt) return "—";
  const start = new Date(startAt);
  const date = start.toLocaleDateString("ja-JP", {
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

function KpiCardMobile({
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
      className={cn(
        "mg-recruitments-m__kpi flex w-full items-center gap-2 rounded-[10px] border border-[#e8e6e0] bg-white p-2 text-left shadow-[0_1px_4px_rgba(26,40,24,0.04)]",
        `mg-recruitments-m__kpi--${tone}`,
        active && "is-active"
      )}
      aria-pressed={active}
    >
      <div className="mg-recruitments-m__kpi-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="mg-recruitments-m__kpi-value leading-none">{value}</p>
        <p className="mg-recruitments-m__kpi-label mt-0.5">{label}</p>
      </div>
    </button>
  );
}

function RecruitmentListCard({
  recruitment,
  onUpdated,
}: {
  recruitment: RecruitmentDashboardItem;
  onUpdated: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const capacity = recruitment.capacity;
  const applicantText =
    capacity != null && capacity > 0
      ? `${recruitment.applicationCount}/${capacity}人`
      : `${recruitment.applicationCount}人`;

  const badge = getStatusBadge(recruitment);
  const rolesLabel = formatRolesLabel(recruitment.roles);
  const primaryHref = `/organizer/recruitments/${recruitment.id}`;

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
    <li className="mg-recruitments-m__card rounded-[10px] border border-[#e8e6e0] bg-white p-2 shadow-[0_1px_5px_rgba(43,58,107,0.05)]">
      <div className="flex items-start gap-1.5">
        <span
          className="mg-recruitments-m__card-icon flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#e8ede4] bg-[#f0f4ee]"
          aria-hidden
        >
          <Users className="h-3 w-3 text-[#7a9488]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="mg-recruitments-m__card-title truncate leading-tight">{recruitment.title}</p>
          <div className="mg-recruitments-m__card-meta mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0">
            <span className="truncate">役割：{rolesLabel}</span>
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
              <Calendar className="h-2.5 w-2.5 shrink-0" aria-hidden />
              {formatScheduleShort(recruitment.start_at, recruitment.end_at)}
            </span>
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
              <Users className="h-2.5 w-2.5 shrink-0" aria-hidden />
              {applicantText}
            </span>
            <span className={cn("mg-recruitments-m__badge inline-flex border px-1 py-px", badge.className)}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>
      <div className="mg-recruitments-m__card-actions mt-1 flex flex-wrap items-center justify-end gap-0.5">
        <Link
          href={primaryHref}
          className="mg-recruitments-pc__btn-action mg-recruitments-pc__btn-action--primary no-underline"
        >
          応募者確認
        </Link>
        <Link
          href={`/organizer/recruitments/new?editId=${recruitment.id}`}
          className="mg-recruitments-pc__btn-action no-underline"
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
                  className="block px-3 py-2 text-[12px] text-[#3a3428] no-underline hover:bg-[#f5f4f0]"
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
    </li>
  );
}

export function OrganizerRecruitmentsMobileView({
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

  const statusLabel =
    statusFilter === "all"
      ? "ステータス"
      : (STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "ステータス");
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "新しい順";

  const nextButtonLabel =
    nextAction.href === "/organizer/recruitments/new"
      ? "スタッフ募集を作成する"
      : nextAction.label;

  const showNextActionBanner =
    nextAction.href !== "/organizer/recruitments/new" &&
    nextAction.href !== "#recruitments-list";

  return (
    <div className="mg-recruitments-m flex flex-col gap-2 pb-20">
      <header className="mg-recruitments-m__hero relative overflow-hidden rounded-[10px] px-2.5 pb-2.5 pt-2">
        <nav className="mg-recruitments-m__crumb text-[10px] text-[#8a9e80]" aria-label="パンくず">
          <Link href="/organizer/listings" className="hover:text-[#2B3A6B] hover:underline">
            主催者管理
          </Link>
          <span className="mx-1 text-[#d4e0d0]">›</span>
          <span className="text-[#526448]">ボランティア募集管理</span>
        </nav>
        <h1 className="mg-recruitments-m__title mt-1">ボランティア募集管理</h1>
        <p className="mg-recruitments-m__desc mt-0.5 line-clamp-2">
          イベントごとのボランティア募集を管理し、応募確認まで行えます。
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Link
            href="/messages"
            className="mg-recruitments-m__btn-outline inline-flex items-center justify-center gap-1 rounded-lg border border-[#c5dbe8] bg-white px-2 py-2 text-[11px] font-medium text-[#2b3a6b] no-underline shadow-sm"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            メッセージ
          </Link>
          <Link
            href="/organizer/recruitments/new"
            className="mg-recruitments-m__btn-primary touch-manipulation inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold text-white no-underline shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
            募集を作成
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-1.5">
        <KpiCardMobile
          icon={<UserCheck className="h-3.5 w-3.5 text-[#D45A72]" />}
          value={kpis.pendingApproval}
          label="承認待ち"
          tone="danger"
          active={kpiFilter === "pending_approval"}
          onClick={() => onKpiClick("pending_approval")}
        />
        <KpiCardMobile
          icon={<Users className="h-3.5 w-3.5 text-[#2B3A6B]" />}
          value={kpis.totalApplications}
          label="応募あり"
          tone="primary"
          active={kpiFilter === "has_applications"}
          onClick={() => onKpiClick("has_applications")}
        />
        <KpiCardMobile
          icon={<Calendar className="h-3.5 w-3.5 text-[#4A9A2E]" />}
          value={kpis.todayCount}
          label="今日の募集"
          tone="success"
          active={kpiFilter === "today"}
          onClick={() => onKpiClick("today")}
        />
        <KpiCardMobile
          icon={<Globe className="h-3.5 w-3.5 text-[#8a9e80]" />}
          value={kpis.active}
          label="公開中"
          tone="neutral"
          active={kpiFilter === "public"}
          onClick={() => onKpiClick("public")}
        />
      </div>

      {showNextActionBanner && (
        <section className="mg-recruitments-m__next flex items-center gap-2 rounded-[10px] border border-[#c5dbe8] px-2.5 py-2">
          <div className="min-w-0 flex-1">
            <p className="mg-recruitments-m__next-label">次のアクション</p>
            <p className="mg-recruitments-m__next-desc mt-0.5 line-clamp-2">{nextAction.description}</p>
          </div>
          <Link
            href={nextAction.href}
            className="mg-recruitments-m__btn-primary touch-manipulation inline-flex max-w-[7.5rem] shrink-0 items-center justify-center rounded-lg px-2.5 py-1.5 text-center text-[10px] font-semibold leading-tight text-white no-underline"
          >
            {nextButtonLabel}
          </Link>
        </section>
      )}

      <section className="flex flex-col gap-1.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#bbb]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="募集名で検索"
            className="mg-recruitments-m__input w-full rounded-lg border border-[#e8e6e0] bg-white py-2 pl-8 pr-2 text-[11px] outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <label className="relative flex items-center gap-1 rounded-lg border border-[#e8e6e0] bg-white px-2 py-2 text-[10px] font-medium text-[#526448]">
            <SlidersHorizontal className="h-3 w-3 shrink-0 text-[#8a9e80]" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{statusLabel}</span>
            <ChevronDown className="h-3 w-3 shrink-0 text-[#bbb]" aria-hidden />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as RecruitmentsStatusFilter)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="ステータス"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="relative flex items-center gap-1 rounded-lg border border-[#e8e6e0] bg-white px-2 py-2 text-[10px] font-medium text-[#526448]">
            <ArrowUpDown className="h-3 w-3 shrink-0 text-[#8a9e80]" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{sortLabel}</span>
            <ChevronDown className="h-3 w-3 shrink-0 text-[#bbb]" aria-hidden />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as RecruitmentsSortOption)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="並び替え"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="self-start text-[10px] text-[#8a9e80] underline-offset-2 hover:underline"
          >
            フィルタをリセット
          </button>
        )}
      </section>

      <section>
        {sortedList.length === 0 ? (
          <div className="mg-recruitments-m__empty rounded-[10px] border border-dashed border-[#e8e6e0] bg-white px-3 py-5 text-center">
            <p className="text-[12px] font-medium text-[#526448]">
              {allRecruitments.length === 0 ? "募集がまだありません" : "該当する募集がありません"}
            </p>
            {allRecruitments.length === 0 && (
              <Link
                href="/organizer/recruitments/new"
                className="mg-recruitments-m__btn-primary touch-manipulation mt-2 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-semibold text-white no-underline"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                スタッフ募集を作成
              </Link>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {sortedList.map((r) => (
              <RecruitmentListCard key={r.id} recruitment={r} onUpdated={onRecruitmentUpdated} />
            ))}
          </ul>
        )}
      </section>

      <footer className="mg-recruitments-m__footer flex items-center justify-between gap-2 rounded-lg border border-[#d4e8c8] px-2.5 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 shrink-0 text-[#6BBF3E]" aria-hidden />
          <p className="min-w-0 text-[10px] leading-snug text-[#526448]">
            <span className="font-medium text-[#2e3d2c]">今月の応募状況</span>
            <span className="tabular-nums">
              {" "}
              応募{monthStats.applications} · 承認{monthStats.approved} · 予定
              {monthStats.scheduled}
            </span>
          </p>
        </div>
        <Link
          href="/organizer"
          className="mg-recruitments-m__footer-link inline-flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-[#2b3a6b] no-underline"
        >
          レポートを見る
          <ChevronRight className="h-3 w-3" aria-hidden />
        </Link>
      </footer>
    </div>
  );
}
