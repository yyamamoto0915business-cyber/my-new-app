"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { EventAccountStatusCards } from "@/components/organizer/events/EventAccountStatusCards";
import { EventSummaryCards } from "@/components/organizer/events/EventSummaryCards";
import {
  EventListFilterTabs,
  type EventListTab,
} from "@/components/organizer/events/EventListFilterTabs";
import { EventsOrganizerPagination } from "@/components/organizer/events/EventsOrganizerPagination";
import {
  EventListToolbar,
  type SortOption,
  type StatusFilter,
} from "@/components/organizer/events/EventListToolbar";
import { OrganizerEventCard } from "@/components/organizer/events/OrganizerEventCard";
import type {
  DashboardKpis,
  DashboardTodo,
  DashboardEvent,
  BillingSummary,
} from "@/app/api/organizer/dashboard/route";
import type { PlanSummary } from "@/lib/organizer-plan-summary";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { EventsManagementHero } from "@/components/organizer/events/EventsManagementHero";

const PAYOUTS_HREF = "/organizer/settings/payouts";
const DEFAULT_PAGE_SIZE = 5;

function isArchivedEvent(event: DashboardEvent): boolean {
  return event.visibilityStatus === "archived";
}

function sortEvents(list: DashboardEvent[], sortBy: SortOption): DashboardEvent[] {
  const sorted = [...list];
  if (sortBy === "date_asc") {
    sorted.sort((a, b) => a.date.localeCompare(b.date));
  } else if (sortBy === "date_desc") {
    sorted.sort((a, b) => b.date.localeCompare(a.date));
  } else if (sortBy === "created_desc") {
    const getCreated = (e: DashboardEvent) =>
      (e as { createdAt?: string }).createdAt ?? e.date;
    sorted.sort((a, b) => getCreated(b).localeCompare(getCreated(a)));
  }
  return sorted;
}

export default function OrganizerEventsPage() {
  const [kpis, setKpis] = useState<DashboardKpis>({
    hosting: 0,
    needsAction: 0,
    pendingApplications: 0,
    unreadMessages: 0,
    recruitingPublic: 0,
  });
  const [todos, setTodos] = useState<DashboardTodo[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_asc");
  const [listTab, setListTab] = useState<EventListTab>("all");
  const [showEndedInAll, setShowEndedInAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const needsActionRef = useRef<HTMLElement>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organizer/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setKpis(data.kpis ?? kpis);
      setTodos(data.todos ?? []);
      setEvents(data.events ?? []);
      setBillingSummary(data.billingSummary ?? null);
      setPlanSummary(data.planSummary ?? null);
    } catch {
      setKpis({ hosting: 0, needsAction: 0, pendingApplications: 0, unreadMessages: 0, recruitingPublic: 0 });
      setTodos([]);
      setEvents([]);
      setBillingSummary(null);
      setPlanSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const nonArchivedEvents = useMemo(
    () => events.filter((e) => !isArchivedEvent(e)),
    [events]
  );

  const archivedCount = useMemo(
    () => events.filter((e) => isArchivedEvent(e)).length,
    [events]
  );

  const summaryCounts = useMemo(() => {
    const publicCount = nonArchivedEvents.filter((e) => e.status === "public").length;
    const draftCount = nonArchivedEvents.filter((e) => e.status === "draft").length;
    const endedCount = nonArchivedEvents.filter((e) => e.status === "ended").length;
    const activeCount = publicCount + draftCount;
    return {
      total: nonArchivedEvents.length,
      activeCount,
      publicCount,
      draftCount,
      endedCount,
    };
  }, [nonArchivedEvents]);

  const listTabCounts = useMemo(
    () => ({
      all: showEndedInAll ? summaryCounts.total : summaryCounts.activeCount,
      public: summaryCounts.publicCount,
      draft: summaryCounts.draftCount,
      ended: summaryCounts.endedCount,
      archived: archivedCount,
    }),
    [summaryCounts, showEndedInAll, archivedCount]
  );

  const filteredAndSortedEvents = useMemo(() => {
    let list = [...events];

    if (listTab === "archived") {
      list = list.filter((e) => isArchivedEvent(e));
    } else {
      list = list.filter((e) => !isArchivedEvent(e));

      if (listTab === "all") {
        if (!showEndedInAll) {
          list = list.filter((e) => e.status !== "ended");
        }
      } else if (listTab === "public") {
        list = list.filter((e) => e.status === "public");
      } else if (listTab === "draft") {
        list = list.filter((e) => e.status === "draft");
      } else if (listTab === "ended") {
        list = list.filter((e) => e.status === "ended");
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }

    if (listTab === "all" && statusFilter !== "all") {
      if (statusFilter === "public") list = list.filter((e) => e.status === "public");
      if (statusFilter === "draft") list = list.filter((e) => e.status === "draft");
      if (statusFilter === "ended" && showEndedInAll) {
        list = list.filter((e) => e.status === "ended");
      }
    }

    return sortEvents(list, sortBy);
  }, [events, listTab, showEndedInAll, searchQuery, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedEvents.length / pageSize));

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedEvents.slice(start, start + pageSize);
  }, [filteredAndSortedEvents, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy, pageSize, listTab, showEndedInAll]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (listTab !== "all" && statusFilter !== "all") {
      setStatusFilter("all");
    }
  }, [listTab, statusFilter]);

  const handleListTabChange = useCallback((tab: EventListTab) => {
    setListTab(tab);
    if (tab !== "all") {
      setShowEndedInAll(false);
    }
  }, []);

  const handleEventArchived = useCallback(() => {
    handleListTabChange("archived");
  }, [handleListTabChange]);

  const handleSummaryClick = useCallback((filter: StatusFilter) => {
    if (filter === "all") handleListTabChange("all");
    else if (filter === "public") handleListTabChange("public");
    else if (filter === "draft") handleListTabChange("draft");
    else if (filter === "ended") handleListTabChange("ended");
  }, [handleListTabChange]);

  const stripeNotOk = billingSummary && billingSummary.paymentSetupStatus !== "ok";

  const nextAction = useMemo(() => {
    if (stripeNotOk) {
      return {
        label: "売上受取を設定",
        description: "参加費イベントの受取にStripe連携が必要です",
        href: PAYOUTS_HREF,
      };
    }
    if (summaryCounts.draftCount > 0 && summaryCounts.publicCount === 0) {
      const firstDraft = events.find((e) => e.status === "draft");
      return {
        label: "最初のイベントを公開する",
        description: "下書きのままでは参加者に表示されません",
        href: firstDraft ? `/organizer/events/${firstDraft.id}` : "/organizer/events",
      };
    }
    if (events.length === 0) {
      return {
        label: "イベントを作成する",
        description: "最初のイベントを登録しましょう",
        href: "/organizer/events/new",
      };
    }
    return {
      label: "スタッフ募集を作成",
      description: "受付・誘導など役割ごとに募集できます",
      href: "/organizer/recruitments/new",
    };
  }, [stripeNotOk, summaryCounts, events]);

  const summaryActiveFilter: StatusFilter | null =
    listTab === "archived" ? null : listTab === "ended" ? "ended" : listTab;

  const createEventButton = (
    <Link
      href="/organizer/events/new"
      className="inline-flex items-center gap-1 rounded-lg bg-[#2D7A4F] px-2.5 py-1.5 text-[11px] font-semibold leading-none text-white shadow-[0_2px_8px_rgba(45,122,79,0.24)] transition-opacity hover:opacity-90 min-[900px]:gap-1.5 min-[900px]:rounded-xl min-[900px]:px-3.5 min-[900px]:py-2 min-[900px]:text-[12px]"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="min-[900px]:h-3.5 min-[900px]:w-3.5" aria-hidden>
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      イベントを作成
    </Link>
  );

  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        className="flex min-h-0 flex-1 flex-col"
        contentClassName="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col pb-16 min-[900px]:pb-0"
      >
        <div className="org-events-mgmt org-events-mgmt--compact flex min-h-0 flex-1 flex-col space-y-2 min-[900px]:space-y-0">
        <OrganizerWorkspacePageHeader
          className="min-[900px]:hidden"
          compact
          title="イベント管理"
          subtitle="公開・編集・募集・売上受取の設定をまとめて管理できます。"
          actions={createEventButton}
        />

        <EventsManagementHero actions={createEventButton} />

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid gap-3 min-[900px]:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-[#e4ede0]" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-[#e4ede0]" />
              ))}
            </div>
            <div className="h-48 rounded-2xl bg-[#e4ede0]" />
          </div>
        ) : (
          <>
            <EventAccountStatusCards
              planSummary={planSummary}
              billingSummary={billingSummary}
            />

            <div className="org-events-next-action space-y-1.5 min-[900px]:hidden">
              {!stripeNotOk && nextAction.href !== PAYOUTS_HREF && (
                <Link
                  href={nextAction.href}
                  className="flex items-center gap-2 rounded-lg border border-[#e8e6e0] bg-white px-2.5 py-1.5"
                >
                  <span className="block font-semibold text-[#1a1a1a]">{nextAction.label}</span>
                </Link>
              )}
            </div>

            <EventSummaryCards
              total={summaryCounts.activeCount}
              publicCount={summaryCounts.publicCount}
              draftCount={summaryCounts.draftCount}
              endedCount={summaryCounts.endedCount}
              onStatusClick={handleSummaryClick}
              activeFilter={summaryActiveFilter}
            />

            {todos.length > 0 && (
              <section ref={needsActionRef} id="needs-action-section" className="min-[900px]:hidden">
                <div className="overflow-hidden rounded-xl border border-[#ccc4b4]">
                  <div className="border-b border-[#ccc4b4] bg-[#1e3020] px-4 py-2 sm:px-5">
                    <h2 className="text-sm font-bold text-[#f4f0e8]">要対応</h2>
                  </div>
                  <div className="divide-y divide-[#e8e0d4] bg-[#faf8f2]">
                    {todos.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center justify-between gap-3 px-4 py-2 sm:px-5"
                      >
                        <p className="min-w-0 flex-1 text-xs leading-snug text-[#3a3428]">{todo.title}</p>
                        <Link
                          href={todo.href}
                          className="shrink-0 inline-flex items-center rounded-full bg-[#1e3848] px-3 py-1.5 text-xs font-medium text-[#f4f0e8] hover:opacity-90"
                        >
                          対応する
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section id="events-list" className="org-events-list-shell scroll-mt-2 min-[900px]:min-h-0 min-[900px]:flex-1">
              <EventListFilterTabs
                activeTab={listTab}
                onTabChange={handleListTabChange}
                counts={listTabCounts}
                showEndedInAll={showEndedInAll}
                onShowEndedInAllChange={setShowEndedInAll}
              />

              <EventListToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                statusFilterDisabled={listTab !== "all"}
              />

              {listTab === "archived" ? (
                <p className="org-events-list-shell__archive-hint">
                  アーカイブしたイベントはここに保管されます。復元すると下書きに戻り、不要なものは削除できます。
                </p>
              ) : null}

              {filteredAndSortedEvents.length === 0 ? (
                <div className="org-events-list-shell__body">
                  <div className="org-events-list-shell__empty">
                    <p className="text-[13px] font-medium text-[#1a2214] min-[900px]:text-[15px]">
                      {listTab === "archived"
                        ? "アーカイブボックスは空です"
                        : events.length > 0
                          ? "該当するイベントがありません"
                          : "まだイベントがありません"}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-[#566358] min-[900px]:text-[13px]">
                      {listTab === "archived"
                        ? "メニューの「アーカイブ」から、不要になったイベントを保管できます"
                        : events.length > 0
                          ? "検索条件や絞り込みを変えて、もう一度お試しください"
                          : "最初のイベントを作成してみましょう"}
                    </p>
                    {events.length === 0 && listTab !== "archived" && (
                      <Link
                        href="/organizer/events/new"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2D7A4F] px-5 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
                      >
                        イベントを作成
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="org-events-list-shell__body">
                    <p className="org-events-list-shell__hint">
                      {listTab === "archived"
                        ? `${pageSize}件ずつ表示 · アーカイブ済み`
                        : `${pageSize}件ずつ表示 · 開催日が近い順`}
                    </p>
                    <ul className="org-events-list flex flex-col gap-1.5 min-[900px]:gap-1">
                      {paginatedEvents.map((event) => (
                        <li key={event.id}>
                          <OrganizerEventCard
                            event={event}
                            billingSummary={billingSummary}
                            onRefresh={fetchDashboard}
                            archiveBoxMode={listTab === "archived"}
                            onArchived={handleEventArchived}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="org-events-list-shell__footer">
                    <EventsOrganizerPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={filteredAndSortedEvents.length}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                    />
                  </div>
                </>
              )}
            </section>
          </>
        )}
        </div>
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
