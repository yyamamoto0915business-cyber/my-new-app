"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { OrganizerHeader } from "@/components/organizer/organizer-header";
import type { DashboardKpis, DashboardTodo, DashboardEvent } from "@/app/api/organizer/dashboard/route";

const STATUS_LABELS: Record<string, string> = {
  public: "公開中",
  draft: "下書き",
  ended: "終了",
};

type EventFilter = "all" | "public" | "draft" | "ended";

export default function OrganizerEventsPage() {
  const [kpis, setKpis] = useState<DashboardKpis>({
    hosting: 0,
    needsAction: 0,
    pendingApplications: 0,
    unreadMessages: 0,
  });
  const [todos, setTodos] = useState<DashboardTodo[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventFilter>("all");
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
    } catch {
      setKpis({ hosting: 0, needsAction: 0, pendingApplications: 0, unreadMessages: 0 });
      setTodos([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const filteredEvents = useMemo(() => {
    let list = events;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }
    if (statusFilter === "public") list = list.filter((e) => e.status === "public");
    if (statusFilter === "draft") list = list.filter((e) => e.status === "draft");
    if (statusFilter === "ended") list = list.filter((e) => e.status === "ended");
    return list;
  }, [events, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <OrganizerHeader
        title="主催ダッシュボード"
        description="今日の対応事項・イベント・募集の管理"
        backHref="/"
        backLabel="← 探すへ"
        primaryCtaLabel="イベント作成"
        primaryCtaHref="/organizer/events/new"
        secondaryCtaLabel="募集作成"
        secondaryCtaHref="/organizer/recruitments/new"
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
            {/* KPIカード（カード全体クリック・hoverで押せることが分かる） */}
            <section className="mb-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setStatusFilter("public")}
                  className="cursor-pointer rounded-xl border border-[var(--border)] bg-white p-4 text-center shadow-sm transition-[box-shadow,border-color,background-color] hover:border-zinc-300 hover:bg-zinc-50/80 hover:shadow-md active:border-zinc-400 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/90 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/80 dark:hover:shadow-md dark:active:bg-zinc-800"
                  aria-label="主催中：公開中イベントで絞り込む"
                >
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {kpis.hosting}
                  </p>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">主催中</p>
                </button>
                {todos.length > 0 ? (
                  <button
                    type="button"
                    onClick={scrollToNeedsAction}
                    className="cursor-pointer rounded-xl border border-[var(--border)] bg-white p-4 text-center shadow-sm transition-[box-shadow,border-color,background-color] hover:border-zinc-300 hover:bg-zinc-50/80 hover:shadow-md active:border-zinc-400 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/90 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/80 dark:hover:shadow-md dark:active:bg-zinc-800"
                    aria-label={`要対応 ${kpis.needsAction}件：要対応セクションへ`}
                  >
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {kpis.needsAction}
                    </p>
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">要対応</p>
                  </button>
                ) : (
                  <div
                    className="cursor-default rounded-xl border border-[var(--border)] bg-white p-4 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90"
                    aria-label="要対応なし"
                  >
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {kpis.needsAction}
                    </p>
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">要対応</p>
                  </div>
                )}
                <Link
                  href="/organizer/recruitments"
                  className="cursor-pointer rounded-xl border border-[var(--border)] bg-white p-4 text-center shadow-sm transition-[box-shadow,border-color,background-color] hover:border-zinc-300 hover:bg-zinc-50/80 hover:shadow-md active:border-zinc-400 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/90 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/80 dark:hover:shadow-md dark:active:bg-zinc-800"
                  aria-label="申請待ち：募集管理へ"
                >
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {kpis.pendingApplications}
                  </p>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">申請待ち</p>
                </Link>
                <Link
                  href="/messages"
                  className="cursor-pointer rounded-xl border border-[var(--border)] bg-white p-4 text-center shadow-sm transition-[box-shadow,border-color,background-color] hover:border-zinc-300 hover:bg-zinc-50/80 hover:shadow-md active:border-zinc-400 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/90 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/80 dark:hover:shadow-md dark:active:bg-zinc-800"
                  aria-label="未読メッセージへ"
                >
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {kpis.unreadMessages}
                  </p>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">未読メッセージ</p>
                </Link>
              </div>
            </section>

            {/* 要対応パネル：0件のときは非表示、>0のときのみリスト表示 */}
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
                          対応する
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 要対応=0のときの次の一手案内（空白を作らない） */}
            {todos.length === 0 && (
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

            {/* 検索（主役）・フィルタ（控えめ） */}
            <section className="mb-4 flex flex-wrap items-center gap-3">
              <input
                type="search"
                placeholder="イベント名で検索（例：フリマ）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-900/50"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as EventFilter)}
                className="w-auto min-w-0 shrink-0 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs text-[var(--foreground-muted)] dark:border-zinc-600 dark:bg-zinc-900/50"
              >
                <option value="all">すべて</option>
                <option value="public">公開中</option>
                <option value="draft">下書き</option>
                <option value="ended">終了</option>
              </select>
            </section>

            {/* (5) イベント一覧 */}
            <section>
              {filteredEvents.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/90">
                  <p className="text-zinc-500">
                    {events.length === 0
                      ? "登録イベントがありません。新規作成してください。"
                      : "該当するイベントがありません"}
                  </p>
                  {events.length === 0 && (
                    <Link
                      href="/organizer/events/new"
                      className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      新規イベントを作成する
                    </Link>
                  )}
                </div>
              ) : (
                <ul className="space-y-4">
                  {filteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} onRefresh={fetchDashboard} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function EventCard({ event, onRefresh }: { event: DashboardEvent; onRefresh?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const mainRecruitmentId = event.recruitmentIds?.[0];

  const handlePublish = async () => {
    setPublishError(null);
    setPublishLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/publish`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setShowBillingModal(true);
        } else {
          setPublishError(json.error ?? "公開に失敗しました");
        }
        return;
      }
      onRefresh?.();
    } catch {
      setPublishError("公開に失敗しました");
    } finally {
      setPublishLoading(false);
    }
  };
  const recruitmentHref = mainRecruitmentId
    ? `/organizer/recruitments/${mainRecruitmentId}`
    : `/organizer/recruitments/new?eventId=${event.id}`;

  return (
    <li className="rounded-xl border border-[var(--border)] bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/events/${event.id}`}
                className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {event.title}
              </Link>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                  event.status === "public"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : event.status === "draft"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                }`}
              >
                {STATUS_LABELS[event.status] ?? event.status}
              </span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                {event.price === 0 ? "無料" : `¥${event.price}`}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {event.date} {event.startTime}
              {event.endTime ? `-${event.endTime}` : ""} ・ {event.location}
            </p>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              {event.capacity != null && (
                <>
                  <span>参加 {event.participantCount ?? 0}/{event.capacity ?? "—"}</span>
                  <span className="mx-1.5 opacity-60">・</span>
                </>
              )}
              {((event.plannedCount ?? 0) > 0 || (event.interestedCount ?? 0) > 0) && (
                <>
                  <span>参加予定{event.plannedCount ?? 0}・関心あり{event.interestedCount ?? 0}</span>
                  <span className="mx-1.5 opacity-60">・</span>
                </>
              )}
              <span>応募 {event.applicationCount ?? 0}</span>
              <span className="mx-1.5 opacity-60">・</span>
              <span>未読 {event.unreadCount ?? 0}</span>
            </p>
          </div>

          {/* アクション: 募集管理 + チャット + … */}
          <div className="flex flex-wrap items-center gap-2">
            {event.status === "draft" && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishLoading}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {publishLoading ? "公開中..." : "公開する"}
              </button>
            )}
            {publishError && <span className="text-xs text-red-600">{publishError}</span>}
            <Link
              href={recruitmentHref}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              募集管理
            </Link>
            <Link
              href={`/events/${event.id}/chat`}
              className="relative inline-flex items-center rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              チャット
              {(event.unreadCount ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                  {event.unreadCount > 99 ? "99+" : event.unreadCount}
                </span>
              )}
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded-lg border border-[var(--border)] p-2 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                aria-label="その他メニュー"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-900">
                    <Link
                      href={`/organizer/events/${event.id}/sponsors`}
                      className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      スポンサー管理
                    </Link>
                    <Link
                      href={`/organizer/stories/new?eventId=${event.id}`}
                      className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      ストーリーを書く
                    </Link>
                    <Link
                      href={`/organizer/events/new?edit=${event.id}`}
                      className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      編集
                    </Link>
                    <Link
                      href={`/organizer/events/new?edit=${event.id}&section=status`}
                      className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      公開/非公開切替
                    </Link>
                    <Link
                      href={`/organizer/events/new?copyFrom=${event.id}`}
                      className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      複製
                    </Link>
                    <Link
                      href={`/organizer/events/new?edit=${event.id}&section=archive`}
                      className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      アーカイブ
                    </Link>
                    <Link
                      href={`/events/${event.id}`}
                      className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      詳細を見る
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
          {showBillingModal && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => setShowBillingModal(false)}
                aria-hidden
              />
              <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  今月の公開枠を超えています
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  月980円のStarterプランで無制限に公開できます。
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href="/organizer/settings/billing"
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    onClick={() => setShowBillingModal(false)}
                  >
                    課金設定へ
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowBillingModal(false)}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
