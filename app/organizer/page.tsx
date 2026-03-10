"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  FileText,
  Users,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import type {
  DashboardKpis,
  DashboardTodo,
  DashboardEvent,
  BillingSummary,
} from "@/app/api/organizer/dashboard/route";

const STATUS_LABELS: Record<string, string> = {
  public: "公開中",
  draft: "下書き",
  ended: "終了",
};

const RECENT_LIMIT = 5;

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const className =
    status === "public"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
      : status === "draft"
        ? "bg-amber-50 text-amber-700 border-amber-200/80"
        : "bg-slate-100 text-slate-600 border-slate-200/80";
  return (
    <span
      className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function OrganizerDashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis>({
    hosting: 0,
    needsAction: 0,
    pendingApplications: 0,
    unreadMessages: 0,
  });
  const [todos, setTodos] = useState<DashboardTodo[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/organizer/dashboard");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setKpis(data.kpis ?? kpis);
        setTodos(data.todos ?? []);
        setEvents(data.events ?? []);
        setBillingSummary(data.billingSummary ?? null);
      } catch {
        if (!cancelled) {
          setKpis({ hosting: 0, needsAction: 0, pendingApplications: 0, unreadMessages: 0 });
          setTodos([]);
          setEvents([]);
          setBillingSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const draftCount = events.filter((e) => e.status === "draft").length;
    const endedCount = events.filter((e) => e.status === "ended").length;
    return {
      total: events.length,
      public: kpis.hosting,
      draft: draftCount,
      ended: endedCount,
      needsAction: kpis.needsAction,
    };
  }, [events, kpis.hosting, kpis.needsAction]);

  const recentEvents = useMemo(
    () => [...events].slice(0, RECENT_LIMIT),
    [events]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200/80" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-slate-200/80"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/80" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            ダッシュボード
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            おかえりなさい。イベントや募集の状況をまとめて確認できます
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href="/organizer/events/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            新しいイベントを作成
          </Link>
          <Link
            href="/organizer/recruitments/new"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Users className="h-4 w-4" aria-hidden />
            募集を作成
          </Link>
          <Link
            href="/organizer/articles/new"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" aria-hidden />
            記事を作成
          </Link>
        </div>
      </div>

      {/* サマリーカード */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm sm:px-5">
          <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {summary.total}
          </p>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">全イベント</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm sm:px-5">
          <p className="text-2xl font-bold text-emerald-700 sm:text-3xl">
            {summary.public}
          </p>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">公開中</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm sm:px-5">
          <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {summary.draft}
          </p>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">下書き</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm sm:px-5">
          <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {summary.needsAction}
          </p>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">要対応</p>
        </div>
      </section>

      {/* 要対応パネル */}
      {todos.length > 0 && (
        <section className="rounded-2xl border border-amber-200/80 bg-amber-50/50 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold text-amber-900">今やること</h2>
          <ul className="mt-3 space-y-2">
            {todos.slice(0, 5).map((todo) => (
              <li key={todo.id}>
                <Link
                  href={todo.href}
                  className="flex items-center justify-between gap-2 rounded-xl py-2 text-sm text-amber-900 transition hover:bg-amber-100/80"
                >
                  <span className="min-w-0 flex-1 truncate">{todo.title}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-amber-600" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 最近のイベント */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
            <h2 className="text-base font-semibold text-slate-800">
              最近のイベント
            </h2>
            <Link
              href="/organizer/events"
              className="text-sm font-medium text-amber-600 hover:underline"
            >
              すべて見る
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <CalendarDays className="h-10 w-10 text-slate-300" aria-hidden />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  まだイベントがありません
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  最初のイベントを作成してみましょう
                </p>
                <Link
                  href="/organizer/events/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden />
                  イベントを作成する
                </Link>
              </div>
            ) : (
              recentEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/organizer/events/${event.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition hover:bg-slate-50/80 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(event.date)}
                      {event.location ? ` ・ ${event.location}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={event.status} />
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* クイックアクション + 次の行動 */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-slate-800">
              すぐ使う
            </h2>
            <nav className="mt-3 space-y-1" aria-label="クイックアクション">
              <Link
                href="/organizer/events"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
                イベント管理
              </Link>
              <Link
                href="/organizer/recruitments"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Users className="h-4 w-4 shrink-0 text-slate-500" />
                募集管理
              </Link>
              <Link
                href="/organizer/articles"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                記事管理
              </Link>
              <Link
                href="/organizer/stories"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-slate-500" />
                ストーリー
              </Link>
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-500" />
                サイトを見る
              </Link>
            </nav>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-800">
              最初にやること
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>・イベントを作成して内容を入力する</li>
              <li>・公開前にプレビューで確認する</li>
              <li>
                ・参加申込が必要な場合は募集を作り、締切を設定する
              </li>
            </ul>
          </section>

          {billingSummary && billingSummary.paymentSetupStatus !== "ok" && (
            <Link
              href="/organizer/settings/billing"
              className="block rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-sm transition hover:bg-amber-100/50 sm:p-5"
            >
              <p className="font-medium text-amber-900">
                決済設定がまだです
              </p>
              <p className="mt-1 text-xs text-amber-700">
                参加費を集めるには設定が必要です
              </p>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
