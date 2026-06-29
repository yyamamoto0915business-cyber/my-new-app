"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerRecruitmentsMobileView } from "@/components/organizer/recruitments/OrganizerRecruitmentsMobileView";
import { OrganizerRecruitmentsPcView } from "@/components/organizer/recruitments/OrganizerRecruitmentsPcView";
import type { RecruitmentsSortOption } from "@/components/organizer/recruitments/OrganizerRecruitmentsPcView";
import type {
  RecruitmentDashboardKpis,
  RecruitmentDashboardTodo,
  RecruitmentDashboardItem,
} from "@/app/api/organizer/recruitments-dashboard/route";

type StatusFilter = "all" | "public" | "draft" | "closed";

type KpiFilter = "" | "pending_approval" | "has_applications" | "today" | "public";

const KPI_FILTER_PARAM = "filter";

function OrganizerRecruitmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [kpis, setKpis] = useState<RecruitmentDashboardKpis>({
    active: 0,
    totalApplications: 0,
    pendingApproval: 0,
    todayCount: 0,
  });
  const [todos, setTodos] = useState<RecruitmentDashboardTodo[]>([]);
  const [recruitments, setRecruitments] = useState<RecruitmentDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>("");
  const [sortBy, setSortBy] = useState<RecruitmentsSortOption>("created_desc");
  const needsActionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const v = searchParams?.get(KPI_FILTER_PARAM);
    if (v === "pending_approval" || v === "has_applications" || v === "today" || v === "public") {
      setKpiFilter(v);
      if (v === "public") setStatusFilter("public");
    }
  }, [searchParams]);

  const handleKpiClick = useCallback(
    (filter: KpiFilter) => {
      const next = kpiFilter === filter ? "" : filter;
      setKpiFilter(next);
      if (next === "public") {
        setStatusFilter("public");
      } else {
        setStatusFilter("all");
      }
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (next) {
        params.set(KPI_FILTER_PARAM, next);
      } else {
        params.delete(KPI_FILTER_PARAM);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
      if (next === "pending_approval" && kpis.pendingApproval > 0) {
        setTimeout(() => needsActionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    },
    [searchParams, router, kpis.pendingApproval, kpiFilter]
  );

  const fetchDashboard = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading !== false;
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/organizer/recruitments-dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setKpis(data.kpis ?? kpis);
      setTodos(data.todos ?? []);
      setRecruitments(data.recruitments ?? []);
    } catch {
      setKpis({ active: 0, totalApplications: 0, pendingApproval: 0, todayCount: 0 });
      setTodos([]);
      setRecruitments([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setEventFilter("");
    setKpiFilter("");
    setSortBy("created_desc");
    router.replace(window.location.pathname, { scroll: false });
  }, [router]);

  const handleStatusFilterChange = useCallback(
    (v: StatusFilter) => {
      setStatusFilter(v);
      setKpiFilter("");
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete(KPI_FILTER_PARAM);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
    },
    [searchParams, router]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchQuery("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredRecruitments = useMemo(() => {
    let list = recruitments;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.eventTitle ?? "").toLowerCase().includes(q)
      );
    }
    if (kpiFilter) {
      if (kpiFilter === "pending_approval") list = list.filter((r) => (r.pendingCount ?? 0) > 0);
      else if (kpiFilter === "has_applications") list = list.filter((r) => (r.applicationCount ?? 0) > 0);
      else if (kpiFilter === "today") {
        list = list.filter((r) => {
          const d = r.start_at ? (typeof r.start_at === "string" ? r.start_at.slice(0, 10) : "") : "";
          return d === todayStr;
        });
      } else if (kpiFilter === "public") list = list.filter((r) => r.status === "public");
    }
    if (statusFilter === "public") list = list.filter((r) => r.status === "public");
    if (statusFilter === "draft") list = list.filter((r) => r.status === "draft");
    if (statusFilter === "closed") list = list.filter((r) => r.status === "closed");
    if (eventFilter) list = list.filter((r) => r.event_id === eventFilter);
    return list;
  }, [recruitments, searchQuery, statusFilter, eventFilter, kpiFilter, todayStr]);

  const todayRecruitments = useMemo(() => {
    return filteredRecruitments.filter((r) => {
      const d = r.start_at ? (typeof r.start_at === "string" ? r.start_at.slice(0, 10) : "") : "";
      return d === todayStr;
    });
  }, [filteredRecruitments, todayStr]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    sortBy !== "created_desc" ||
    Boolean(kpiFilter);

  const nextAction = useMemo(() => {
    if (todos.length > 0) {
      const first = todos[0];
      return {
        label: "承認待ちを確認する",
        description: `${todos.length}件の対応が必要です`,
        href: first?.href ?? "/organizer/recruitments",
      };
    }
    if (todayRecruitments.length > 0) {
      const firstToday = todayRecruitments[0];
      return {
        label: "当日管理を開く",
        description: "本日の募集を先に確認しましょう",
        href: `/organizer/recruitments/${firstToday.id}/day-of`,
      };
    }
    if (kpis.active > 0) {
      return {
        label: "募集中の一覧を見る",
        description: "公開中の募集を見直せます",
        href: "#recruitments-list",
      };
    }
    return {
      label: "スタッフ募集を作成する",
      description: "受付や割り当て役割ごとにスタッフ募集を作成できます",
      href: "/organizer/recruitments/new",
    };
  }, [todos, todayRecruitments, kpis.active]);

  return (
    <OrganizerPageShell contentClassName="space-y-0 pb-14 min-[900px]:space-y-0 min-[900px]:pb-8">
      {/* PC */}
      <div className="mx-auto hidden w-full max-w-6xl min-[900px]:block">
        {loading ? (
          <div className="space-y-4 animate-pulse py-4">
            <div className="h-8 w-64 rounded bg-[#e8e6e0]" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-[#e8e6e0]" />
              ))}
            </div>
            <div className="h-28 rounded-xl bg-[#e8e6e0]" />
            <div className="h-64 rounded-xl bg-[#e8e6e0]" />
          </div>
        ) : (
          <OrganizerRecruitmentsPcView
            kpis={kpis}
            filteredRecruitments={filteredRecruitments}
            allRecruitments={recruitments}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            kpiFilter={kpiFilter}
            onKpiClick={handleKpiClick}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            nextAction={nextAction}
            onRecruitmentUpdated={() => fetchDashboard({ showLoading: false })}
          />
        )}
      </div>

      {/* モバイル */}
      <div className="mx-auto max-w-2xl min-[900px]:hidden">
        {loading ? (
          <div className="space-y-3 animate-pulse pb-24">
            <div className="h-28 rounded-xl bg-[#e8e6e0]" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-[#e8e6e0]" />
              ))}
            </div>
            <div className="h-20 rounded-xl bg-[#e8e6e0]" />
            <div className="h-10 rounded-xl bg-[#e8e6e0]" />
            <div className="h-32 rounded-xl bg-[#e8e6e0]" />
            <div className="h-14 rounded-xl bg-[#e8e6e0]" />
          </div>
        ) : (
          <OrganizerRecruitmentsMobileView
            kpis={kpis}
            filteredRecruitments={filteredRecruitments}
            allRecruitments={recruitments}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            kpiFilter={kpiFilter}
            onKpiClick={handleKpiClick}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            nextAction={nextAction}
            onRecruitmentUpdated={() => fetchDashboard({ showLoading: false })}
          />
        )}
      </div>
    </OrganizerPageShell>
  );
}

export default function OrganizerRecruitmentsPage() {
  return (
    <OrganizerRegistrationGate>
      <Suspense
        fallback={
          <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
            読み込み中…
          </div>
        }
      >
        <OrganizerRecruitmentsContent />
      </Suspense>
    </OrganizerRegistrationGate>
  );
}
