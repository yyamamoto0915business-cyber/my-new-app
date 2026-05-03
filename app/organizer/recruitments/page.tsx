"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { OrganizerHeader } from "@/components/organizer/organizer-header";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
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

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (searchQuery.trim()) labels.push(`検索: ${searchQuery.trim()}`);
    if (statusFilter !== "all") labels.push(`状態: ${STATUS_LABELS[statusFilter] ?? statusFilter}`);
    if (eventFilter) {
      const eventLabel = eventOptions.find((e) => e.id === eventFilter)?.title ?? "イベント指定";
      labels.push(`イベント: ${eventLabel}`);
    }
    if (kpiFilter === "pending_approval") labels.push("KPI: 承認待ち");
    if (kpiFilter === "has_applications") labels.push("KPI: 応募あり");
    if (kpiFilter === "today") labels.push("KPI: 今日の募集");
    if (kpiFilter === "public") labels.push("KPI: 公開中");
    return labels;
  }, [searchQuery, statusFilter, eventFilter, eventOptions, kpiFilter]);

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
      description: "受付や誘導など役割ごとに作成できます",
      href: "/organizer/recruitments/new",
    };
  }, [todos, todayRecruitments, kpis.active]);

  const kpiCardBase =
    "relative rounded-xl border p-4 text-center transition-all duration-150 ";
  const kpiCardSelected =
    "cursor-pointer border-[#1e3848] bg-[#1e3020] text-[#f4f0e8] ring-2 ring-[#1e3848]/20 ring-offset-1 ";
  const kpiCardUnselected =
    "cursor-pointer border-[#ccc4b4] bg-[#faf8f2] text-[#0e1610] hover:border-[#b8d0c8] hover:bg-[#eef6f2] active:bg-[#e4ede0] ";

  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <OrganizerHeader
        title="スタッフ募集管理"
        eyebrow="STAFF RECRUITMENT"
        subtitle="— 募集・応募管理 —"
        backHref="/organizer"
        backLabel="← ダッシュボードへ"
        primaryCtaLabel="スタッフ募集を作成"
        primaryCtaHref="/organizer/recruitments/new"
        tertiaryCtaHref="/organizer/settings/payouts"
      />

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-[#e4ede0]" />
              ))}
            </div>
            <div className="h-48 rounded-xl bg-[#e4ede0]" />
            <div className="h-64 rounded-xl bg-[#e4ede0]" />
          </div>
        ) : (
          <>
            <section className="mb-4 flex items-start gap-2 rounded-2xl border border-[#b8d0c8] bg-[#e0eeea] px-4 py-3 text-[13px] leading-relaxed text-[#1e4840] sm:px-5">
              <span>ℹ</span>
              <span>このページではイベントごとの運営スタッフ募集を管理します。受付・誘導・設営など役割ごとに募集を作成し、応募確認・承認・当日管理まで行えます。</span>
            </section>

            <section className="mb-4 overflow-hidden rounded-2xl border border-[#ccc4b4]">
              <div className="border-b border-[#ccc4b4] bg-[#1e3020] px-4 py-2.5 sm:px-5">
                <p className="text-[10px] font-medium tracking-[0.18em] text-[#a8c8a4]">NEXT ACTION</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#faf8f2] px-4 py-3">
                <p className="text-[13px] text-[#3a3428]">{nextAction.description}</p>
                <Link
                  href={nextAction.href}
                  className="inline-flex min-h-[36px] items-center rounded-full bg-[#1e3848] px-4 text-[12px] font-medium text-[#f4f0e8] hover:opacity-90"
                >
                  {nextAction.label}
                </Link>
              </div>
            </section>

            {/* KPIカード（応募対応中心・クリックでフィルタ・選択中は濃いスタイル） */}
            <section className="mb-6 overflow-x-auto">
              <div className="flex min-w-max gap-3 sm:grid sm:min-w-0 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => handleKpiClick(kpiFilter === "pending_approval" ? "" : "pending_approval")}
                  className={`w-[130px] sm:w-auto ${kpiCardBase}${kpiFilter === "pending_approval" ? kpiCardSelected : kpiCardUnselected}`}
                  aria-label="承認待ちで絞り込む"
                >
                  {kpiFilter === "pending_approval" && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#a8c8a4]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#a8c8a4]">
                      選択中
                    </span>
                  )}
                  <p className="text-2xl font-bold">{kpis.pendingApproval}</p>
                  <p className="mt-1 text-xs">承認待ち</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleKpiClick(kpiFilter === "has_applications" ? "" : "has_applications")}
                  className={`w-[130px] sm:w-auto ${kpiCardBase}${kpiFilter === "has_applications" ? kpiCardSelected : kpiCardUnselected}`}
                  aria-label="応募ありで絞り込む"
                >
                  {kpiFilter === "has_applications" && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#a8c8a4]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#a8c8a4]">
                      選択中
                    </span>
                  )}
                  <p className="text-2xl font-bold">{kpis.totalApplications}</p>
                  <p className="mt-1 text-xs">応募あり</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleKpiClick(kpiFilter === "today" ? "" : "today")}
                  className={`w-[130px] sm:w-auto ${kpiCardBase}${kpiFilter === "today" ? kpiCardSelected : kpiCardUnselected}`}
                  aria-label="当日で絞り込む"
                >
                  {kpiFilter === "today" && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#a8c8a4]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#a8c8a4]">
                      選択中
                    </span>
                  )}
                  <p className="text-2xl font-bold">{kpis.todayCount}</p>
                  <p className="mt-1 text-xs">今日の募集</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleKpiClick(kpiFilter === "public" ? "" : "public")}
                  className={`w-[130px] sm:w-auto ${kpiCardBase}${kpiFilter === "public" ? kpiCardSelected : kpiCardUnselected}`}
                  aria-label="募集中で絞り込む"
                >
                  {kpiFilter === "public" && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#a8c8a4]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#a8c8a4]">
                      選択中
                    </span>
                  )}
                  <p className="text-2xl font-bold">{kpis.active}</p>
                  <p className="mt-1 text-xs">公開中</p>
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[var(--foreground-muted)] sm:hidden">
                横にスワイプして指標を確認できます
              </p>
            </section>

            {/* 要対応パネル（要対応=0のときは非表示） */}
            {todos.length > 0 && (
              <section ref={needsActionRef} className="mb-4" id="needs-action-section">
                <div className="overflow-hidden rounded-2xl border border-[#ccc4b4]">
                  <div className="border-b border-[#ccc4b4] bg-[#1e3020] px-4 py-2.5">
                    <h2
                      className="text-[13px] font-bold text-[#f4f0e8]"
                      style={{ fontFamily: "'Shippori Mincho', serif" }}
                    >
                      要対応 <span className="text-[11px] font-normal text-[#a8c8a4]">({todos.length})</span>
                    </h2>
                  </div>
                  <div className="divide-y divide-[#e8e0d4] bg-[#faf8f2]">
                    {todos.map((todo) => (
                      <div key={todo.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <p className="min-w-0 flex-1 text-[13px] text-[#3a3428]">{todo.title}</p>
                        <Link
                          href={todo.href}
                          className="shrink-0 inline-flex min-h-[32px] items-center rounded-full bg-[#1e3848] px-3 text-[12px] font-medium text-[#f4f0e8] hover:opacity-90"
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
              <p className="mb-4 text-center text-[12px] text-[#6a6258]">
                次にやること：
                <Link href="/organizer/stories/new" className="mx-1 text-[#2c7a88] hover:underline">
                  ストーリーを書く
                </Link>
                <span className="mx-1 text-[#ccc4b4]">／</span>
                <Link href="/organizer/recruitments/new" className="text-[#2c7a88] hover:underline">
                  スタッフ募集を作る
                </Link>
              </p>
            )}

            {/* 検索・フィルタ・リセット */}
            <section className="mb-4 space-y-2 rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] p-3">
              <input
                type="search"
                placeholder="募集名で検索（例：受付）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 rounded-full border border-[#ccc4b4] bg-white px-4 py-2.5 text-[13px] text-[#3a3428] placeholder:text-[#a8a090] outline-none focus:border-[#2c7a88]"
              />
              <div className="flex flex-wrap items-center gap-2">
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
                  className="h-10 min-w-[6.5rem] shrink-0 rounded-full border border-[#ccc4b4] bg-white px-3 text-[12px] text-[#3a3428]"
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
                    className="h-10 max-w-[10rem] shrink-0 rounded-full border border-[#ccc4b4] bg-white px-3 text-[12px] text-[#3a3428]"
                  >
                    <option value="">すべて</option>
                    {eventOptions.map((e) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                )}
                {(searchQuery || statusFilter !== "all" || eventFilter || kpiFilter) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="h-10 shrink-0 rounded-full border border-[#ccc4b4] bg-white px-3 text-[12px] font-medium text-[#6a6258] transition-colors hover:bg-[#f0ece4]"
                  >
                    リセット
                  </button>
                )}
              </div>
            </section>

            {activeFilterLabels.length > 0 && (
              <section className="mb-3 flex flex-wrap items-center gap-1.5">
                {activeFilterLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[#ccc4b4] bg-[#faf8f2] px-2.5 py-0.5 text-[11px] text-[#6a6258]"
                  >
                    {label}
                  </span>
                ))}
              </section>
            )}

            {/* 今日の募集（固定表示・0件なら非表示） */}
            {todayRecruitments.length > 0 && (
              <section className="mb-4">
                <h2
                  className="mb-2 text-[11px] font-medium tracking-[0.18em] text-[#6a6258]"
                  style={{ fontFamily: "'Shippori Mincho', serif" }}
                >
                  今日の募集
                </h2>
                <ul className="space-y-2">
                  {todayRecruitments.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#b8d0c8] bg-[#eef6f2] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[14px] font-bold text-[#0e1610]"
                          style={{ fontFamily: "'Shippori Mincho', serif" }}
                        >
                          {r.title}
                        </p>
                        {r.eventTitle && (
                          <p className="mt-0.5 text-[11px] text-[#6a6258]">{r.eventTitle}</p>
                        )}
                      </div>
                      <Link
                        href={`/organizer/recruitments/${r.id}/day-of`}
                        className="shrink-0 inline-flex min-h-[34px] items-center rounded-full bg-[#1e3848] px-3 text-[12px] font-medium text-[#f4f0e8] hover:opacity-90"
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
              <section id="recruitments-list">
                {filteredRecruitments.length === 0 ? (
                  <div className="rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] p-8 text-center">
                    {recruitments.length === 0 ? (
                      <>
                        <h2
                          className="text-[16px] font-bold text-[#0e1610]"
                          style={{ fontFamily: "'Shippori Mincho', serif" }}
                        >
                          募集がまだありません
                        </h2>
                        <p className="mt-2 text-[13px] text-[#6a6258]">
                          『受付』『誘導』『設営』など役割ごとにスタッフ募集を作れます
                        </p>
                        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                          <Link
                            href="/organizer/recruitments/new"
                            className="inline-flex min-h-[40px] items-center rounded-full bg-[#1e3848] px-5 text-[13px] font-medium text-[#f4f0e8] hover:opacity-90"
                          >
                            スタッフ募集を作成する
                          </Link>
                          <Link
                            href="/organizer/events"
                            className="text-[13px] text-[#6a6258] underline-offset-2 hover:underline"
                          >
                            イベント一覧へ
                          </Link>
                        </div>
                      </>
                    ) : (
                      <p className="text-[13px] text-[#6a6258]">該当する募集がありません</p>
                    )}
                  </div>
                ) : (
                  <>
                    {todayRecruitments.length > 0 && (
                      <h2
                        className="mb-2 text-[11px] font-medium tracking-[0.18em] text-[#6a6258]"
                        style={{ fontFamily: "'Shippori Mincho', serif" }}
                      >
                        その他の募集
                      </h2>
                    )}
                    <ul className="space-y-3">
                      {restRecruitments.map((r) => (
                        <RecruitmentCard
                          key={r.id}
                          recruitment={r}
                          onRecruitmentUpdated={() => fetchDashboard({ showLoading: false })}
                        />
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

function RecruitmentCard({
  recruitment,
  onRecruitmentUpdated,
}: {
  recruitment: RecruitmentDashboardItem;
  onRecruitmentUpdated?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);
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
  const isToday = startDate === new Date().toISOString().slice(0, 10);
  const primaryHref =
    (recruitment.pendingCount ?? 0) > 0
      ? `/organizer/recruitments/${recruitment.id}`
      : isToday
        ? `/organizer/recruitments/${recruitment.id}/day-of`
        : `/organizer/recruitments/${recruitment.id}`;
  const primaryLabel =
    (recruitment.pendingCount ?? 0) > 0 ? "応募を確認" : isToday ? "当日管理へ" : "募集を確認";

  const handleCloseRecruitment = async () => {
    if (recruitment.status !== "public" || closing) return;
    if (
      !window.confirm(
        "この募集を終了しますか？ボランティア募集の一覧から非表示になります。"
      )
    ) {
      return;
    }
    setClosing(true);
    try {
      const res = await fetch(`/api/recruitments/${recruitment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? "終了に失敗しました");
        return;
      }
      setMenuOpen(false);
      onRecruitmentUpdated?.();
    } finally {
      setClosing(false);
    }
  };

  return (
    <li className="overflow-hidden rounded-2xl border border-[#ccc4b4] bg-[#faf8f2]">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/organizer/recruitments/${recruitment.id}`}
                className="text-[14px] font-bold text-[#0e1610] hover:underline"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                {recruitment.title}
              </Link>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  recruitment.status === "public"
                    ? "border border-[#a8ccbc] bg-[#d8ece4] text-[#1a3428]"
                    : recruitment.status === "closed"
                      ? "border border-[#d8d0b8] bg-[#f0ede4] text-[#5a5040]"
                      : "border border-[#d8c090] bg-[#f0e8d4] text-[#5a3a10]"
                }`}
              >
                {STATUS_LABELS[recruitment.status] ?? recruitment.status}
              </span>
            </div>
            {recruitment.eventTitle && (
              <p className="mt-1 text-[11px] text-[#6a6258]">{recruitment.eventTitle}</p>
            )}
            <p className="mt-1.5 text-[13px] text-[#3a3428]">
              {startDate}{startTime ? ` ${startTime}` : ""}
              {recruitment.meeting_place ? ` ・ ${recruitment.meeting_place}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-[#ccc4b4] bg-white px-2.5 py-0.5 text-[11px] text-[#6a6258]">
                応募 {recruitment.applicationCount}
              </span>
              <span className="rounded-full border border-[#ccc4b4] bg-white px-2.5 py-0.5 text-[11px] text-[#6a6258]">
                承認済 {recruitment.approvedCount}
              </span>
              {recruitment.capacity != null && (
                <span className="rounded-full border border-[#ccc4b4] bg-white px-2.5 py-0.5 text-[11px] text-[#6a6258]">
                  定員 {recruitment.capacity}
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <Link
              href={primaryHref}
              className="inline-flex min-h-[34px] items-center rounded-full bg-[#1e3848] px-3 text-[12px] font-medium text-[#f4f0e8] hover:opacity-90"
            >
              {primaryLabel}
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ccc4b4] bg-white hover:bg-[#f0ece4]"
                aria-label="その他メニュー"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#6a6258]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-[#ccc4b4] bg-white shadow-lg">
                    <Link href={`/organizer/recruitments/${recruitment.id}`} className="block px-4 py-2.5 text-[13px] text-[#3a3428] hover:bg-[#f0ece4]" onClick={() => setMenuOpen(false)}>募集を確認</Link>
                    <Link href={`/organizer/recruitments/${recruitment.id}/day-of`} className="block px-4 py-2.5 text-[13px] text-[#3a3428] hover:bg-[#f0ece4]" onClick={() => setMenuOpen(false)}>当日管理</Link>
                    <Link href="/messages" className="block px-4 py-2.5 text-[13px] text-[#3a3428] hover:bg-[#f0ece4]" onClick={() => setMenuOpen(false)}>チャット</Link>
                    <Link href={`/organizer/recruitments/new?copyFrom=${recruitment.id}`} className="block px-4 py-2.5 text-[13px] text-[#3a3428] hover:bg-[#f0ece4]" onClick={() => setMenuOpen(false)}>複製</Link>
                    {recruitment.status === "public" && (
                      <button type="button" disabled={closing} className="block w-full px-4 py-2.5 text-left text-[13px] text-[#8a2c20] hover:bg-[#fef0ee] disabled:opacity-50" onClick={() => void handleCloseRecruitment()}>
                        {closing ? "処理中…" : "募集を終了"}
                      </button>
                    )}
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
