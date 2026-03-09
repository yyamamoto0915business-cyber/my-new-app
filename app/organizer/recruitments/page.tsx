"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { OrganizerHeader } from "@/components/organizer/organizer-header";
import type {
  RecruitmentDashboardKpis,
  RecruitmentDashboardTodo,
  RecruitmentDashboardItem,
} from "@/app/api/organizer/recruitments-dashboard/route";

const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  public: "募集中",
  closed: "終了",
};

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
  const needsActionRef = useRef<HTMLElement>(null);

  /** URL query から初期化 */
  useEffect(() => {
    const v = searchParams?.get(KPI_FILTER_PARAM);
    if (v === "pending_approval" || v === "has_applications" || v === "today" || v === "public") {
      setKpiFilter(v);
      if (v === "public") setStatusFilter("public");
    }
  }, [searchParams]);

  /** KPIクリックでフィルタ切替＋URL更新（同じKPIを再クリックで解除） */
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

  const scrollToNeedsAction = useCallback(() => {
    needsActionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const eventOptions = useMemo(() => {
    const titles = new Map<string, string>();
    for (const r of recruitments) {
      if (r.eventTitle && r.event_id) titles.set(r.event_id, r.eventTitle);
    }
    return Array.from(titles.entries()).map(([id, title]) => ({ id, title }));
  }, [recruitments]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  /** フィルタをすべてリセット */
  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setEventFilter("");
    setKpiFilter("");
    router.replace(window.location.pathname, { scroll: false });
  }, [router]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchQuery("");
      }
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

  const { todayRecruitments, restRecruitments } = useMemo(() => {
    const today = filteredRecruitments.filter((r) => {
      const d = r.start_at ? (typeof r.start_at === "string" ? r.start_at.slice(0, 10) : "") : "";
      return d === todayStr;
    });
    const rest = filteredRecruitments.filter((r) => {
      const d = r.start_at ? (typeof r.start_at === "string" ? r.start_at.slice(0, 10) : "") : "";
      return d !== todayStr;
    });
    return { todayRecruitments: today, restRecruitments: rest };
  }, [filteredRecruitments, todayStr]);

  const kpiCardBase =
    "relative rounded-xl border p-4 text-center shadow-sm transition-all duration-150 ";
  const kpiCardSelected =
    "cursor-pointer border-2 border-zinc-700 bg-zinc-800 ring-2 ring-[var(--accent)] ring-offset-2 dark:border-zinc-600 dark:bg-zinc-700 dark:ring-offset-zinc-900 [&>p:first-child]:text-white [&>p:last-child]:text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 dark:hover:bg-zinc-600 dark:hover:border-zinc-500 ";
  const kpiCardUnselected =
    "cursor-pointer border-[var(--border)] bg-white hover:border-zinc-300 hover:bg-zinc-50/80 hover:shadow-md active:border-zinc-400 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/90 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/80 dark:hover:shadow-md dark:active:bg-zinc-800 ";

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <OrganizerHeader
        title="募集管理"
        description="応募の確認・承認・当日管理を行います"
        backHref="/organizer/events"
        backLabel="← イベント一覧へ"
        primaryCtaLabel="募集を作成"
        primaryCtaHref="/organizer/recruitments/new"
        tertiaryCtaHref="/organizer/settings/billing"
      />

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              ))}
            </div>
            <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-64 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ) : (
          <>
            {/* KPIカード（応募対応中心・クリックでフィルタ・選択中は濃いスタイル） */}
            <section className="mb-6 overflow-x-auto">
              <div className="grid min-w-[280px] grid-cols-2 gap-3 sm:grid-cols-4 sm:min-w-0">
                <button
                  type="button"
                  onClick={() => handleKpiClick(kpiFilter === "pending_approval" ? "" : "pending_approval")}
                  className={`${kpiCardBase}${kpiFilter === "pending_approval" ? kpiCardSelected : kpiCardUnselected}`}
                  aria-label="承認待ちで絞り込む"
                >
                  {kpiFilter === "pending_approval" && (
                    <span className="absolute left-2 top-2 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-medium text-white">
                      選択中
                    </span>
                  )}
                  <p className="text-2xl font-bold">{kpis.pendingApproval}</p>
                  <p className="mt-1 text-xs">承認待ち</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleKpiClick(kpiFilter === "has_applications" ? "" : "has_applications")}
                  className={`${kpiCardBase}${kpiFilter === "has_applications" ? kpiCardSelected : kpiCardUnselected}`}
                  aria-label="応募ありで絞り込む"
                >
                  {kpiFilter === "has_applications" && (
                    <span className="absolute left-2 top-2 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-medium text-white">
                      選択中
                    </span>
                  )}
                  <p className="text-2xl font-bold">{kpis.totalApplications}</p>
                  <p className="mt-1 text-xs">新着応募</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleKpiClick(kpiFilter === "today" ? "" : "today")}
                  className={`${kpiCardBase}${kpiFilter === "today" ? kpiCardSelected : kpiCardUnselected}`}
                  aria-label="当日で絞り込む"
                >
                  {kpiFilter === "today" && (
                    <span className="absolute left-2 top-2 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-medium text-white">
                      選択中
                    </span>
                  )}
                  <p className="text-2xl font-bold">{kpis.todayCount}</p>
                  <p className="mt-1 text-xs">当日</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleKpiClick(kpiFilter === "public" ? "" : "public")}
                  className={`${kpiCardBase}${kpiFilter === "public" ? kpiCardSelected : kpiCardUnselected}`}
                  aria-label="募集中で絞り込む"
                >
                  {kpiFilter === "public" && (
                    <span className="absolute left-2 top-2 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-medium text-white">
                      選択中
                    </span>
                  )}
                  <p className="text-2xl font-bold">{kpis.active}</p>
                  <p className="mt-1 text-xs">募集中</p>
                </button>
              </div>
            </section>

            {/* 要対応パネル（要対応=0のときは非表示） */}
            {todos.length > 0 && (
              <section ref={needsActionRef} className="mb-6" id="needs-action-section">
                <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
                  <div className="border-b border-[var(--border)] px-4 py-3 dark:border-zinc-700">
                    <h2 className="font-medium text-zinc-900 dark:text-zinc-100">要対応</h2>
                  </div>
                  <div className="divide-y divide-[var(--border)] dark:divide-zinc-700">
                    {todos.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <p className="min-w-0 flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                          {todo.title}
                        </p>
                        <Link
                          href={todo.href}
                          className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          {todo.type === "day_of" ? "当日管理" : "確認"}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 要対応=0のときの次の一手 */}
            {todos.length === 0 && recruitments.length > 0 && (
              <p className="mb-4 text-center text-xs text-[var(--foreground-muted)]">
                次にやること：
                <Link href="/organizer/stories/new" className="mx-1 text-[var(--accent)] hover:underline">
                  ストーリーを書く
                </Link>
                <span className="mx-1">/</span>
                <Link href="/organizer/recruitments/new" className="text-[var(--accent)] hover:underline">
                  募集を作る
                </Link>
              </p>
            )}

            {/* 検索・フィルタ・リセット（検索を主役に、高さを揃える） */}
            <section className="mb-4 flex flex-wrap items-stretch gap-2">
              <input
                type="search"
                placeholder="募集名で検索（例：受付）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-900/50"
              />
              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setKpiFilter("");
                    const params = new URLSearchParams(searchParams?.toString() ?? "");
                    params.delete(KPI_FILTER_PARAM);
                    const qs = params.toString();
                    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
                  }}
                  className="h-[42px] w-[5.5rem] shrink-0 rounded-lg border border-[var(--border)] bg-white px-2.5 text-xs text-[var(--foreground-muted)] dark:border-zinc-600 dark:bg-zinc-900/50"
                >
                  <option value="all">すべて</option>
                  <option value="public">募集中</option>
                  <option value="draft">下書き</option>
                  <option value="closed">終了</option>
                </select>
                {eventOptions.length > 0 && (
                  <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    className="h-[42px] max-w-[8rem] shrink-0 rounded-lg border border-[var(--border)] bg-white px-2.5 text-xs text-[var(--foreground-muted)] dark:border-zinc-600 dark:bg-zinc-900/50"
                  >
                    <option value="">すべて</option>
                    {eventOptions.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                )}
                {(searchQuery || statusFilter !== "all" || eventFilter || kpiFilter) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="h-[42px] shrink-0 rounded-lg border border-[var(--border)] px-2.5 text-xs font-medium text-[var(--foreground-muted)] outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    リセット
                  </button>
                )}
              </div>
            </section>

            {/* 今日の募集（固定表示・0件なら非表示） */}
            {todayRecruitments.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">
                  今日の募集
                </h2>
                <ul className="space-y-2">
                  {todayRecruitments.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{r.title}</p>
                        {r.eventTitle && (
                          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                            {r.eventTitle}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/organizer/recruitments/${r.id}/day-of`}
                        className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                      >
                        当日管理へ
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 募集一覧（空状態 or 今日以外） */}
            {(filteredRecruitments.length === 0 || restRecruitments.length > 0) && (
              <section>
                {filteredRecruitments.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/90">
                    {recruitments.length === 0 ? (
                      <>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          募集がまだありません
                        </h2>
                        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                          『受付』『誘導』『設営』など役割ごとに募集を作れます
                        </p>
                        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                          <Link
                            href="/organizer/recruitments/new"
                            className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                          >
                            募集を作成する
                          </Link>
                          <Link
                            href="/organizer/events"
                            className="text-sm text-[var(--foreground-muted)] underline-offset-2 hover:underline"
                          >
                            イベント一覧へ
                          </Link>
                        </div>
                      </>
                    ) : (
                      <p className="text-zinc-500">該当する募集がありません</p>
                    )}
                  </div>
                ) : (
                  <>
                    {todayRecruitments.length > 0 && (
                      <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">
                        その他の募集
                      </h2>
                    )}
                    <ul className="space-y-4">
                      {restRecruitments.map((r) => (
                        <RecruitmentCard key={r.id} recruitment={r} />
                      ))}
                    </ul>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function OrganizerRecruitmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          読み込み中…
        </div>
      }
    >
      <OrganizerRecruitmentsContent />
    </Suspense>
  );
}

function RecruitmentCard({ recruitment }: { recruitment: RecruitmentDashboardItem }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const startDate = recruitment.start_at
    ? (typeof recruitment.start_at === "string"
        ? recruitment.start_at.slice(0, 10)
        : "")
    : "";
  const startTime = recruitment.start_at
    ? (typeof recruitment.start_at === "string" && recruitment.start_at.length > 10
        ? recruitment.start_at.slice(11, 16)
        : "")
    : "";

  return (
    <li className="rounded-xl border border-[var(--border)] bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/organizer/recruitments/${recruitment.id}`}
                className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {recruitment.title}
              </Link>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                  recruitment.status === "public"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : recruitment.status === "closed"
                      ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                }`}
              >
                {STATUS_LABELS[recruitment.status] ?? recruitment.status}
              </span>
            </div>
            {recruitment.eventTitle && (
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">{recruitment.eventTitle}</p>
            )}
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {startDate}
              {startTime ? ` ${startTime}` : ""}
              {recruitment.meeting_place ? ` ・ ${recruitment.meeting_place}` : ""}
            </p>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              <span>応募 {recruitment.applicationCount}</span>
              <span className="mx-1.5 opacity-60">・</span>
              <span>承認済 {recruitment.approvedCount}</span>
              {recruitment.capacity != null && (
                <>
                  <span className="mx-1.5 opacity-60">・</span>
                  <span>定員 {recruitment.capacity}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/organizer/recruitments/${recruitment.id}`}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              確認
            </Link>
            <Link
              href={`/organizer/recruitments/${recruitment.id}/day-of`}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              当日管理
            </Link>
            <Link
              href="/messages"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              チャット
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded-lg border border-[var(--border)] p-2 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                aria-label="その他メニュー"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-900">
                    <Link
                      href={`/organizer/recruitments/${recruitment.id}`}
                      className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      編集
                    </Link>
                    <Link
                      href={`/organizer/recruitments/new?copyFrom=${recruitment.id}`}
                      className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      複製
                    </Link>
                    <Link
                      href={`/organizer/recruitments/${recruitment.id}`}
                      className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      終了する
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
