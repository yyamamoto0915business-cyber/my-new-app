"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { OrganizerHeader } from "@/components/organizer/organizer-header";
import { EventSummaryCards } from "@/components/organizer/events/EventSummaryCards";
import {
  EventListToolbar,
  type SortOption,
  type StatusFilter,
} from "@/components/organizer/events/EventListToolbar";
import { OrganizerEventCard } from "@/components/organizer/events/OrganizerEventCard";
import { OrganizerEventsEmptyState } from "@/components/organizer/events/OrganizerEventsEmptyState";
import type {
  DashboardKpis,
  DashboardTodo,
  DashboardEvent,
  BillingSummary,
} from "@/app/api/organizer/dashboard/route";

const BILLING_HREF = "/organizer/settings/billing";

export default function OrganizerEventsPage() {
  const [kpis, setKpis] = useState<DashboardKpis>({
    hosting: 0,
    needsAction: 0,
    pendingApplications: 0,
    unreadMessages: 0,
  });
  const [todos, setTodos] = useState<DashboardTodo[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_asc");
  const needsActionRef = useRef<HTMLElement>(null);

  const scrollToNeedsAction = useCallback(() => {
    needsActionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organizer/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setKpis(data.kpis ?? kpis);
      setTodos(data.todos ?? []);
      setEvents(data.events ?? []);
      setBillingSummary(data.billingSummary ?? null);
    } catch {
      setKpis({ hosting: 0, needsAction: 0, pendingApplications: 0, unreadMessages: 0 });
      setTodos([]);
      setEvents([]);
      setBillingSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const summaryCounts = useMemo(() => {
    const publicCount = events.filter((e) => e.status === "public").length;
    const draftCount = events.filter((e) => e.status === "draft").length;
    const endedCount = events.filter((e) => e.status === "ended").length;
    return {
      total: events.length,
      publicCount,
      draftCount,
      endedCount,
    };
  }, [events]);

  const filteredAndSortedEvents = useMemo(() => {
    let list = [...events];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }
    if (statusFilter === "public") list = list.filter((e) => e.status === "public");
    if (statusFilter === "draft") list = list.filter((e) => e.status === "draft");
    if (statusFilter === "ended") list = list.filter((e) => e.status === "ended");

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
  }, [events, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <OrganizerHeader
        title="イベント管理"
        description="作成したイベントの確認・編集・公開管理ができます"
        backHref="/"
        backLabel="← 探すへ"
        primaryCtaLabel="新しいイベントを作成"
        primaryCtaHref="/organizer/events/new"
        secondaryCtaLabel="募集を作成"
        secondaryCtaHref="/organizer/recruitments/new"
        tertiaryCtaHref={BILLING_HREF}
        tertiaryCtaHighlight={billingSummary?.paymentSetupStatus !== "ok"}
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-slate-200/80"
              />
            ))}
          </div>
          <div className="h-14 animate-pulse rounded-xl bg-slate-200/80" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl bg-slate-200/80"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 決済未設定バナー */}
          {billingSummary && billingSummary.paymentSetupStatus !== "ok" && (
            <section>
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 sm:px-5">
                <p className="text-sm text-amber-900">
                  イベントで参加費を集めるには、先に決済設定が必要です
                </p>
                <Link
                  href={BILLING_HREF}
                  className="mt-2 inline-block rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  設定する
                </Link>
              </div>
            </section>
          )}

          {/* サマリーカード */}
          <section>
            <EventSummaryCards
              total={summaryCounts.total}
              publicCount={summaryCounts.publicCount}
              draftCount={summaryCounts.draftCount}
              endedCount={summaryCounts.endedCount}
              onStatusClick={setStatusFilter}
              activeFilter={statusFilter}
            />
          </section>

          {/* 要対応パネル */}
          {todos.length > 0 && (
            <section ref={needsActionRef} id="needs-action-section">
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="border-b border-slate-200/80 px-4 py-3 sm:px-5">
                  <h2 className="font-medium text-slate-800">要対応</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                    >
                      <p className="min-w-0 flex-1 text-sm text-slate-600">
                        {todo.title}
                      </p>
                      <Link
                        href={todo.href}
                        className="shrink-0 rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                      >
                        対応する
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 次の一手案内 */}
          {(todos.length === 0 ||
            (billingSummary && billingSummary.paymentSetupStatus !== "ok")) && (
            <p className="text-center text-xs text-slate-500">
              次にやること：
              {billingSummary &&
                billingSummary.paymentSetupStatus !== "ok" && (
                  <>
                    <Link
                      href={BILLING_HREF}
                      className="mx-1 font-medium text-amber-600 hover:underline"
                    >
                      決済を設定する
                    </Link>
                    <span className="mx-1">/</span>
                  </>
                )}
              <Link
                href="/organizer/stories/new"
                className="mx-1 text-amber-600 hover:underline"
              >
                ストーリーを書く
              </Link>
              <span className="mx-1">/</span>
              <Link
                href="/organizer/recruitments/new"
                className="text-amber-600 hover:underline"
              >
                募集を作る
              </Link>
            </p>
          )}

          {/* 検索・絞り込み・並び替え */}
          <section>
            <EventListToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </section>

          {/* イベント一覧 */}
          <section>
            {filteredAndSortedEvents.length === 0 ? (
              <OrganizerEventsEmptyState hasFilter={events.length > 0} />
            ) : (
              <ul className="space-y-4">
                {filteredAndSortedEvents.map((event) => (
                  <li key={event.id}>
                    <OrganizerEventCard
                      event={event}
                      billingSummary={billingSummary}
                      onRefresh={fetchDashboard}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
