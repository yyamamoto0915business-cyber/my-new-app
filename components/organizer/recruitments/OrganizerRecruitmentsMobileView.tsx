"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Users,
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
import { showToast } from "@/lib/toast";
import { OrgEyebrow, ORG_SERIF } from "@/components/organizer/mobile/organizer-theme";
import { EventDateTile, todayJst } from "@/components/organizer/mobile/event-date";

const STATUS_OPTIONS: { value: RecruitmentsStatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
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

/** 保存された日時（壁時計の時刻として扱う）から HH:MM を取り出す */
function timeOf(v: string | null | undefined): string {
  return typeof v === "string" && v.length > 10 ? v.slice(11, 16) : "";
}

function timeRange(startAt: string | null | undefined, endAt: string | null | undefined): string {
  const s = timeOf(startAt);
  const e = timeOf(endAt);
  if (s && e) return `${s}〜${e}`;
  return s;
}

function statusTag(r: RecruitmentDashboardItem, past: boolean): { label: string; className: string } {
  if (r.status === "draft") return { label: "下書き", className: "bg-[#fdf1d8] text-[#a26a10]" };
  if (r.status === "closed" || past) return { label: "終了", className: "bg-[#eef0ec] text-[#6b776f]" };
  return { label: "募集中", className: "bg-[#e3f2e7] text-[#1f7a4a]" };
}

/** 上の数字（押すと一覧をその条件で絞る。もう一度押すと戻す） */
function StatCell({
  value,
  label,
  active,
  alert,
  onClick,
}: {
  value: number;
  label: string;
  active: boolean;
  alert?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center rounded-[12px] px-1 py-2 transition-colors active:scale-[0.97]",
        active ? "bg-[#173f2c] text-[#f6ebc8]" : "text-[#1f2a24]"
      )}
    >
      <span
        className={cn(
          "text-[20px] font-bold leading-none tabular-nums",
          !active && alert && value > 0 && "text-[#c0572a]"
        )}
        style={{ fontFamily: ORG_SERIF }}
      >
        {value}
      </span>
      <span className={cn("mt-1 text-[10.5px] font-semibold", active ? "text-[#e6d29b]" : "text-[#6b776f]")}>
        {label}
      </span>
    </button>
  );
}

function RecruitmentRow({
  recruitment: r,
  today,
  onUpdated,
}: {
  recruitment: RecruitmentDashboardItem;
  today: string;
  onUpdated: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  /** 画面の下のほうの行は、下のメニューに隠れないよう上に開く */
  const [menuUp, setMenuUp] = useState(false);
  const [closing, setClosing] = useState(false);

  const startDay = r.start_at ? String(r.start_at).slice(0, 10) : "";
  const lastDay = r.end_at ? String(r.end_at).slice(0, 10) : startDay;
  const past = Boolean(lastDay) && lastDay < today;
  const tag = statusTag(r, past);
  const roles = (r.roles ?? []).map((x) => x.name).filter(Boolean).join("・");
  const time = timeRange(r.start_at, r.end_at);
  const sub = [time, roles].filter(Boolean).join(" · ") || r.eventTitle || "";
  const capacity = r.capacity;
  const applied =
    capacity != null && capacity > 0 ? `${r.applicationCount}/${capacity}人` : `${r.applicationCount}人`;
  const pending = r.pendingCount ?? 0;

  const handleClose = async () => {
    if (r.status !== "public" || closing) return;
    if (!window.confirm("この募集を終了しますか？")) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/recruitments/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast((data as { error?: string }).error ?? "終了に失敗しました");
        return;
      }
      setMenuOpen(false);
      onUpdated();
    } finally {
      setClosing(false);
    }
  };

  return (
    <li
      className={cn(
        "relative flex items-stretch rounded-[14px] border border-[#e6e2d6] bg-white shadow-[0_1px_4px_rgba(23,63,44,0.05)]",
        pending > 0 && "border-l-[3px] border-l-[#c0572a]"
      )}
    >
      <Link
        href={`/organizer/recruitments/${r.id}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-l-[14px] py-2.5 pl-2.5 pr-1 no-underline"
      >
        {startDay ? (
          <EventDateTile
            date={startDay}
            status={r.status === "public" ? "public" : r.status === "draft" ? "draft" : "ended"}
            past={past}
          />
        ) : (
          <span
            className="flex h-[46px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-[#f4f1e8] text-[10px] font-bold text-[#a3812f]"
            aria-hidden
          >
            未定
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span
              className={cn("shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold leading-[16px]", tag.className)}
            >
              {tag.label}
            </span>
            <span
              className="truncate text-[14px] font-semibold leading-snug text-[#1f2a24]"
              style={{ fontFeatureSettings: '"palt"' }}
            >
              {r.title}
            </span>
          </span>
          {sub && <span className="mt-0.5 block truncate text-[12px] text-[#6b776f]">{sub}</span>}
          <span className="mt-1 flex items-center gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-[#3f6250]">
              <Users className="h-3 w-3" aria-hidden />
              応募 {applied}
            </span>
            {pending > 0 && (
              <span className="rounded-full bg-[#fbe7dc] px-1.5 py-px text-[10.5px] font-bold text-[#b04c22]">
                承認待ち {pending}
              </span>
            )}
          </span>
        </span>
      </Link>
      <div className="relative flex shrink-0 items-center pr-1">
        <button
          type="button"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuUp(rect.bottom > window.innerHeight - 280);
            setMenuOpen((o) => !o);
          }}
          className="flex h-10 w-9 items-center justify-center rounded-[10px] text-[#6b776f] active:bg-[#f1f2ef]"
          aria-label={`${r.title}のメニュー`}
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="h-4.5 w-4.5" aria-hidden />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-hidden />
            <div
              className={cn(
                "absolute right-1 z-40",
                menuUp ? "bottom-[calc(50%+18px)]" : "top-[calc(50%+18px)]",
                " min-w-[160px] overflow-hidden rounded-[12px] border border-[#e6e2d6] bg-white py-1 shadow-[0_8px_24px_rgba(14,42,29,0.16)]"
              )}
            >
              <Link
                href={`/organizer/recruitments/${r.id}`}
                className="block px-3.5 py-2.5 text-[13px] font-semibold text-[#173f2c] no-underline active:bg-[#f5f4f0]"
                onClick={() => setMenuOpen(false)}
              >
                応募者を見る
              </Link>
              <Link
                href={`/organizer/recruitments/new?editId=${r.id}`}
                className="block px-3.5 py-2.5 text-[13px] text-[#1f2a24] no-underline active:bg-[#f5f4f0]"
                onClick={() => setMenuOpen(false)}
              >
                編集
              </Link>
              <Link
                href={`/organizer/recruitments/new?copyFrom=${r.id}`}
                className="block px-3.5 py-2.5 text-[13px] text-[#1f2a24] no-underline active:bg-[#f5f4f0]"
                onClick={() => setMenuOpen(false)}
              >
                複製して新しく作る
              </Link>
              {r.status === "public" && (
                <button
                  type="button"
                  disabled={closing}
                  className="block w-full border-t border-[#f0ede4] px-3.5 py-2.5 text-left text-[13px] text-[#a8481c] active:bg-[#fff7f2] disabled:opacity-50"
                  onClick={() => void handleClose()}
                >
                  {closing ? "処理中…" : "募集を終了する"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </li>
  );
}

/** 主催者：ボランティア募集の管理（スマホ・タブレット）。掲載管理の行と同じ並び・色にそろえる */
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
  const [today] = useState(todayJst);

  const sortedList = useMemo(() => {
    const list = [...filteredRecruitments];
    if (sortBy === "created_asc") {
      list.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    } else if (sortBy === "start_asc") {
      // 日程が近い順。終わったもの・日程のないものは後ろ
      const key = (r: RecruitmentDashboardItem) => {
        const d = r.start_at ? String(r.start_at) : "";
        const last = (r.end_at ? String(r.end_at) : d).slice(0, 10);
        if (!d) return "2";
        return (last < today ? "1" : "0") + d;
      };
      list.sort((a, b) => key(a).localeCompare(key(b)));
    } else {
      list.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    return list;
  }, [filteredRecruitments, sortBy, today]);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "新しい順";
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "すべて";

  /** 承認待ちがあるときだけ、上にお知らせを出す */
  const showAttention =
    kpis.pendingApproval > 0 &&
    nextAction.href !== "/organizer/recruitments/new" &&
    nextAction.href !== "#recruitments-list";

  return (
    <div className="flex flex-col gap-3 pb-20">
      <header className="pt-1">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <OrgEyebrow>VOLUNTEER</OrgEyebrow>
            <h1
              className="mt-1 text-[21px] font-bold leading-tight tracking-[0.02em] text-[#173f2c]"
              style={{ fontFamily: ORG_SERIF }}
            >
              ボランティア募集
            </h1>
          </div>
          <Link
            href="/organizer/messages"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#e1d6b4] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#173f2c] no-underline"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            メッセージ
          </Link>
        </div>
        <Link
          href="/organizer/recruitments/new"
          className="mt-3 flex h-12 items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[14px] font-bold text-[#f6ebc8] no-underline shadow-[0_2px_8px_rgba(14,42,29,0.18)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          募集を作成する
        </Link>
      </header>

      <section
        className="relative overflow-hidden rounded-[16px] border border-[#e6e2d6] bg-white p-1 shadow-[0_1px_4px_rgba(23,63,44,0.05)]"
        aria-label="数字で絞りこむ"
      >
        <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#c9a54e] via-[#e6d29b] to-[#c9a54e]" aria-hidden />
        <div className="grid grid-cols-4 gap-1">
          <StatCell
            value={kpis.pendingApproval}
            label="承認待ち"
            alert
            active={kpiFilter === "pending_approval"}
            onClick={() => onKpiClick("pending_approval")}
          />
          <StatCell
            value={kpis.totalApplications}
            label="応募"
            active={kpiFilter === "has_applications"}
            onClick={() => onKpiClick("has_applications")}
          />
          <StatCell
            value={kpis.todayCount}
            label="今日"
            active={kpiFilter === "today"}
            onClick={() => onKpiClick("today")}
          />
          <StatCell
            value={kpis.active}
            label="募集中"
            active={kpiFilter === "public"}
            onClick={() => onKpiClick("public")}
          />
        </div>
      </section>

      {showAttention && (
        <Link
          href={nextAction.href}
          className="flex items-center gap-2 rounded-[14px] border border-[#f0c2aa] bg-[#fff7f2] px-3 py-2.5 no-underline"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c0572a] text-[13px] font-bold text-white tabular-nums">
            {kpis.pendingApproval}
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#a8481c]">
            承認を待っている応募があります
          </span>
          <span className="inline-flex shrink-0 items-center text-[12px] font-bold text-[#a8481c]">
            確認する
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </Link>
      )}

      <section className="flex items-center gap-1.5" id="recruitments-list">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3aaa5]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="募集名・役割で探す"
            className="h-10 w-full rounded-[12px] border border-[#e6e2d6] bg-white pl-9 pr-2 text-[16px] text-[#1f2a24] outline-none placeholder:text-[13px] placeholder:text-[#a3aaa5] focus:border-[#c9a54e]"
          />
        </div>
        <label
          className={cn(
            "relative flex h-10 shrink-0 items-center gap-0.5 rounded-[12px] border px-2.5 text-[12px] font-semibold",
            statusFilter !== "all"
              ? "border-[#173f2c] bg-[#173f2c] text-[#f6ebc8]"
              : "border-[#e6e2d6] bg-white text-[#3f6250]"
          )}
        >
          {statusLabel}
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as RecruitmentsStatusFilter)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="状態で絞りこむ"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#e6e2d6] bg-white text-[#3f6250]">
          <ArrowUpDown className="h-4 w-4" aria-hidden />
          <span className="sr-only">{sortLabel}</span>
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
      </section>

      {(hasActiveFilters || sortBy !== "created_desc") && (
        <div className="-mt-1 flex items-center justify-between px-0.5 text-[12px] text-[#6b776f]">
          <span>
            {sortedList.length}件{sortBy !== "created_desc" && ` · ${sortLabel}`}
          </span>
          {hasActiveFilters && (
            <button type="button" onClick={onResetFilters} className="font-semibold text-[#a3812f]">
              条件を外す
            </button>
          )}
        </div>
      )}

      <section>
        {sortedList.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#e1d6b4] bg-white px-4 py-7 text-center">
            <p className="text-[14px] font-semibold text-[#3f6250]">
              {allRecruitments.length === 0 ? "募集はまだありません" : "条件に合う募集がありません"}
            </p>
            {allRecruitments.length === 0 && (
              <p className="mt-1 text-[12px] text-[#6b776f]">受付・誘導などの役割ごとに、手伝ってくれる人を募れます</p>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2 tablet:grid-cols-2">
            {sortedList.map((r) => (
              <RecruitmentRow key={r.id} recruitment={r} today={today} onUpdated={onRecruitmentUpdated} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
