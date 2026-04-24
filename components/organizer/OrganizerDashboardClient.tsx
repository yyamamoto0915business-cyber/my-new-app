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
  Settings,
} from "lucide-react";
import type {
  DashboardKpis,
  DashboardTodo,
  DashboardEvent,
  BillingSummary,
} from "@/app/api/organizer/dashboard/route";
import type { PlanSummary } from "@/lib/organizer-plan-summary";

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
    <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${className}`}>
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

// ── Hero Banner ──────────────────────────────────────────────────────────────
function OrganizerHeroBanner() {
  return (
    <div
      className="relative -mx-5 -mt-5 h-[190px] overflow-hidden sm:mx-0 sm:mt-0 sm:h-[140px] sm:rounded-2xl"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #dde8db 0%, #e4ede0 100%)" }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 190"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="org-seigaiha" x="0" y="0" width="24" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 16 A12 12 0 0 1 24 16" fill="none" stroke="#9ab49a" strokeWidth="1" />
            <path d="M-12 16 A12 12 0 0 1 12 16" fill="none" stroke="#9ab49a" strokeWidth="1" />
          </pattern>
        </defs>
        {/* 青海波 */}
        <rect width="400" height="190" fill="url(#org-seigaiha)" opacity="0.5" />
        {/* 山のシルエット layer 1 */}
        <path
          d="M0 190 L50 140 L100 155 L150 108 L200 145 L250 116 L300 148 L350 124 L400 155 L400 190 Z"
          fill="#a8c8a4"
          opacity="0.55"
        />
        {/* 山のシルエット layer 2 */}
        <path
          d="M0 190 L40 162 L85 170 L128 150 L168 163 L212 150 L258 164 L296 153 L342 165 L400 158 L400 190 Z"
          fill="#98b894"
          opacity="0.65"
        />
        {/* 日輪 top-right */}
        <g opacity="0.22">
          <circle cx="380" cy="22" r="28" fill="none" stroke="white" strokeWidth="0.7" />
          <circle cx="380" cy="22" r="42" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="380" cy="22" r="56" fill="none" stroke="white" strokeWidth="0.4" />
        </g>
        {/* 家紋風円紋 top-left */}
        <g transform="translate(30,30)" stroke="#607860" fill="none" opacity="0.3">
          <circle cx="0" cy="0" r="18" strokeWidth="1" />
          <line x1="-18" y1="0" x2="18" y2="0" strokeWidth="0.5" />
          <line x1="0" y1="-18" x2="0" y2="18" strokeWidth="0.5" />
          <line x1="-12.7" y1="-12.7" x2="12.7" y2="12.7" strokeWidth="0.5" />
          <line x1="12.7" y1="-12.7" x2="-12.7" y2="12.7" strokeWidth="0.5" />
        </g>
      </svg>
      <div className="absolute bottom-5 left-5">
        <p className="text-[10px] font-medium tracking-[0.22em] text-[#607860]">ORGANIZER</p>
        <h1 className="mt-0.5 font-serif text-[22px] font-bold leading-tight text-[#1e3020]">
          MachiGlyph 主催者管理
        </h1>
      </div>
    </div>
  );
}

// ── Organization avatar row ───────────────────────────────────────────────────
function OrgAvatar({ name }: { name?: string }) {
  const initial = name?.[0] ?? "M";
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#a8c8a4] bg-[#1e3020]">
          <svg className="absolute inset-0 h-full w-full opacity-[0.18]" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="none" stroke="white" strokeWidth="0.8" />
            <circle cx="24" cy="24" r="14" fill="none" stroke="white" strokeWidth="0.5" />
            <line x1="2" y1="24" x2="46" y2="24" stroke="white" strokeWidth="0.5" />
            <line x1="24" y1="2" x2="24" y2="46" stroke="white" strokeWidth="0.5" />
          </svg>
          <span className="relative z-10 font-serif text-lg font-bold text-white">{initial}</span>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[#0e1610]">{name ?? "MachiGlyph"}</p>
          <p className="text-[11px] text-[#6a6258]">主催者アカウント</p>
        </div>
      </div>
      <Link
        href="/organizer/settings"
        className="flex min-h-[34px] items-center gap-1 rounded-full border border-[#ccc4b4] bg-[#faf8f2] px-3 py-1.5 text-[12px] font-medium text-[#2c7a88] transition hover:bg-[#eef6f2]"
      >
        <Settings className="h-3 w-3" aria-hidden />
        設定
      </Link>
    </div>
  );
}

// ── Eyebrow section divider ───────────────────────────────────────────────────
function Eyebrow({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3" role="separator" aria-label={label}>
      <div className="h-[0.5px] flex-1 bg-[#c0b8a8] opacity-60" />
      <span className="font-serif text-[10px] tracking-[0.18em] text-[#5a5448]">{label}</span>
      <div className="h-[0.5px] flex-1 bg-[#c0b8a8] opacity-60" />
    </div>
  );
}

// ── Plan card with Japanese design ───────────────────────────────────────────
function PlanCard({ planSummary }: { planSummary: PlanSummary }) {
  const founderActive = planSummary.publishLimit !== null && planSummary.publishLimit > 1;
  const normalSlotsUsed = Math.min(planSummary.monthlyPublished, 1);
  const founderSlotsUsed = founderActive ? Math.max(0, planSummary.monthlyPublished - 1) : 0;
  const normalPct = Math.round(normalSlotsUsed * 100);
  const founderPct = founderActive ? Math.round((founderSlotsUsed / 3) * 100) : 0;

  return (
    <section
      className="overflow-hidden rounded-[14px] border border-[#c8c0b0]"
      aria-labelledby="plan-card-heading"
    >
      {/* Dark header with 七宝つなぎ pattern */}
      <div className="relative overflow-hidden px-4 py-4" style={{ background: "#1e3020" }}>
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="org-shippou"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="10" cy="10" r="10" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="20" cy="0" r="10" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="0" cy="20" r="10" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="20" cy="20" r="10" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#org-shippou)" opacity="0.08" />
        </svg>
        {/* 家紋風円紋 right */}
        <svg
          className="absolute right-3 top-1/2 h-14 w-14 -translate-y-1/2 opacity-[0.18]"
          viewBox="0 0 56 56"
          aria-hidden="true"
        >
          <circle cx="28" cy="28" r="26" fill="none" stroke="white" strokeWidth="1.2" />
          <circle cx="28" cy="28" r="17" fill="none" stroke="white" strokeWidth="0.8" />
          <line x1="2" y1="28" x2="54" y2="28" stroke="white" strokeWidth="0.8" />
          <line x1="28" y1="2" x2="28" y2="54" stroke="white" strokeWidth="0.8" />
        </svg>
        {/* Badges */}
        <div className="relative flex flex-wrap gap-2">
          <span
            id="plan-card-heading"
            className="inline-flex items-center rounded-full border border-[#a8ccbc] bg-[#d8ece4] px-3 py-[5px] text-[11px] font-medium text-[#1a3428]"
          >
            プラン・公開枠
          </span>
          {planSummary.isFreePlan ? (
            <span className="inline-flex items-center rounded-full border border-[#88b8c8] bg-[#c8e4ec] px-3 py-[5px] text-[11px] font-medium text-[#0e2c38]">
              無料プラン利用中
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-[#a8ccbc] bg-[#d8ece4] px-3 py-[5px] text-[11px] font-medium text-[#1a3428]">
              Starterプラン
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="bg-[#faf8f2] p-4">
        {planSummary.publishLimit !== null ? (
          <>
            <div className={`grid gap-3 ${founderActive ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
              {/* 毎月の公開枠 */}
              <div className="rounded-xl border border-[#b8d0c8] bg-[#eef6f2] p-3">
                <p className="text-[11px] text-[#6a6258]">毎月の公開枠</p>
                <p className="mt-1 font-serif text-[22px] font-bold leading-none text-[#1e3020]">
                  {normalSlotsUsed}
                  <span className="text-[13px] font-normal text-[#6a6258]">/1</span>
                </p>
                <div className="mt-2">
                  <p className="mb-1 text-[9px] text-[#7a9890]">使用率 {normalPct}%</p>
                  <div
                    className="h-[5px] overflow-hidden rounded-full bg-[#c0dcd6]"
                    role="progressbar"
                    aria-valuenow={normalSlotsUsed}
                    aria-valuemin={0}
                    aria-valuemax={1}
                    aria-label="毎月の公開枠使用率"
                  >
                    <div
                      className="h-full rounded-full bg-[#2c7a88] transition-all"
                      style={{ width: `${normalPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 特典の公開枠 */}
              {founderActive && (
                <div className="rounded-xl border border-[#b8d0c8] bg-[#eef6f2] p-3">
                  <p className="text-[11px] text-[#6a6258]">特典の公開枠</p>
                  <p className="mt-1 font-serif text-[22px] font-bold leading-none text-[#1e3020]">
                    {founderSlotsUsed}
                    <span className="text-[13px] font-normal text-[#6a6258]">/3</span>
                  </p>
                  <div className="mt-2">
                    <p className="mb-1 text-[9px] text-[#7a9890]">使用率 {founderPct}%</p>
                    <div
                      className="h-[5px] overflow-hidden rounded-full bg-[#c0dcd6]"
                      role="progressbar"
                      aria-valuenow={founderSlotsUsed}
                      aria-valuemin={0}
                      aria-valuemax={3}
                      aria-label="特典の公開枠使用率"
                    >
                      <div
                        className="h-full rounded-full bg-[#2c7a88] transition-all"
                        style={{ width: `${founderPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 今月公開できる件数 */}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-[#f4f0e8] px-3 py-2.5">
              <span className="text-[12px] text-[#3a3428]">今月公開できる件数</span>
              <span className="text-[12px] font-semibold text-[#1e3020]">
                最大{planSummary.publishLimit}件
              </span>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-[#b8d0c8] bg-[#eef6f2] p-3">
            <p className="text-[11px] text-[#6a6258]">公開枠</p>
            <p className="mt-1 font-serif text-[22px] font-bold text-[#1e3020]">無制限</p>
          </div>
        )}

        {/* 売上受取設定インフォ帯 */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#ccc4b4] bg-[#f4f0e8] px-3 py-2.5">
          <span className="text-[12px] text-[#3a3428]">売上受取設定（Stripe）</span>
          <Link
            href="/organizer/settings/payouts"
            className="text-[12px] font-medium text-[#2c7a88] underline-offset-2 hover:underline"
          >
            設定へ →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── CTA button ────────────────────────────────────────────────────────────────
function PlanCtaButton({ isFreePlan }: { isFreePlan: boolean }) {
  return (
    <div className="mt-4">
      <Link
        href="/organizer/settings/plan"
        className="relative flex min-h-[56px] w-full items-center justify-between overflow-hidden rounded-[12px] px-5 transition hover:opacity-90"
        style={{ background: "#1e3848" }}
        aria-label={isFreePlan ? "プランをアップグレードする" : "プランを管理する"}
      >
        {/* 波紋装飾 */}
        <svg
          className="absolute right-14 top-0 h-full w-24 opacity-[0.07]"
          viewBox="0 0 96 56"
          aria-hidden="true"
        >
          <circle cx="48" cy="28" r="20" fill="none" stroke="white" strokeWidth="1.2" />
          <circle cx="48" cy="28" r="34" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="48" cy="28" r="48" fill="none" stroke="white" strokeWidth="0.8" />
        </svg>
        <span className="relative font-serif text-[16px] text-[#e8f4f8]">
          {isFreePlan ? "プランを変更する" : "プランを管理する"}
        </span>
        <span
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.18)" }}
          aria-hidden
        >
          <ChevronRight className="h-4 w-4 text-white" />
        </span>
      </Link>
      {isFreePlan && (
        <p className="mt-2 px-1 text-[11px] text-[#6a6258]">
          Starterプランにアップグレードすると公開枠が無制限になります
        </p>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function OrganizerDashboardClient() {
  const [kpis, setKpis] = useState<DashboardKpis>({
    hosting: 0,
    needsAction: 0,
    pendingApplications: 0,
    unreadMessages: 0,
  });
  const [todos, setTodos] = useState<DashboardTodo[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null);
  const [organizationName, setOrganizationName] = useState<string | undefined>();
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
        setPlanSummary(data.planSummary ?? null);
        setOrganizationName(data.organizationName);
      } catch {
        if (!cancelled) {
          setKpis({ hosting: 0, needsAction: 0, pendingApplications: 0, unreadMessages: 0 });
          setTodos([]);
          setEvents([]);
          setBillingSummary(null);
          setPlanSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const recentEvents = useMemo(() => [...events].slice(0, RECENT_LIMIT), [events]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="-mx-5 -mt-5 h-[190px] animate-pulse bg-[#dde8db] sm:mx-0 sm:mt-0 sm:rounded-2xl" />
        <div className="h-16 animate-pulse rounded-2xl bg-[#eef6f2]" />
        <div className="h-[220px] animate-pulse rounded-[14px] bg-[#eef6f2]" />
        <div className="h-14 animate-pulse rounded-[12px] bg-[#d8ece4]" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-8">
      {/* Hero banner */}
      <OrganizerHeroBanner />

      {/* Organization info */}
      <OrgAvatar name={organizationName} />

      {/* Plan card */}
      {planSummary && <PlanCard planSummary={planSummary} />}

      {/* CTA */}
      {planSummary && <PlanCtaButton isFreePlan={planSummary.isFreePlan} />}

      {/* ── イベント管理セクション ─────────────────────────── */}
      <Eyebrow label="イベント管理" />

      {/* Quick action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/organizer/events/new"
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:opacity-90 sm:min-h-0 sm:w-auto sm:py-2.5 sm:text-sm sm:font-medium"
        >
          <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
          新しいイベントを作成
        </Link>
        <Link
          href="/organizer/recruitments/new"
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:min-h-0 sm:w-auto"
        >
          <Users className="h-4 w-4 shrink-0" aria-hidden />
          スタッフ募集を作成
        </Link>
        <Link
          href="/organizer/articles/new"
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:min-h-0 sm:w-auto"
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden />
          記事を作成
        </Link>
      </div>

      {/* KPI stats grid */}
      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="イベント統計">
        <div className="rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] px-4 py-4 shadow-sm">
          <p className="font-serif text-2xl font-bold text-[#1e3020]">{summary.total}</p>
          <p className="mt-1 text-xs text-[#6a6258]">全イベント</p>
        </div>
        <div className="rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] px-4 py-4 shadow-sm">
          <p className="font-serif text-2xl font-bold text-emerald-700">{summary.public}</p>
          <p className="mt-1 text-xs text-[#6a6258]">公開中</p>
        </div>
        <div className="rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] px-4 py-4 shadow-sm">
          <p className="font-serif text-2xl font-bold text-[#1e3020]">{summary.draft}</p>
          <p className="mt-1 text-xs text-[#6a6258]">下書き</p>
        </div>
        <div className="rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] px-4 py-4 shadow-sm">
          <p className="font-serif text-2xl font-bold text-[#1e3020]">{summary.needsAction}</p>
          <p className="mt-1 text-xs text-[#6a6258]">要対応</p>
        </div>
      </section>

      {/* Todos */}
      {todos.length > 0 && (
        <section className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 px-4 py-4 sm:px-5">
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

      {/* ── 最近のイベント ─────────────────────────────────── */}
      <Eyebrow label="最近のイベント" />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#e8e4dc] px-4 py-3 sm:px-5">
            <h2 className="text-base font-semibold text-[#1e3020]">最近のイベント</h2>
            <Link
              href="/organizer/events"
              className="text-sm font-medium text-[#2c7a88] hover:underline"
            >
              すべて見る
            </Link>
          </div>
          <div className="divide-y divide-[#e8e4dc]">
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <CalendarDays className="h-10 w-10 text-[#a8a090]" aria-hidden />
                <p className="mt-3 text-sm font-medium text-[#3a3428]">
                  まだイベントがありません
                </p>
                <p className="mt-1 text-xs text-[#6a6258]">
                  最初のイベントを作成してみましょう
                </p>
                <Link
                  href="/organizer/events/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
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
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition hover:bg-[#f4f0e8]/60 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1e3020]">{event.title}</p>
                    <p className="mt-0.5 text-xs text-[#6a6258]">
                      {formatDate(event.date)}
                      {event.location ? ` ・ ${event.location}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={event.status} />
                    <ChevronRight className="h-4 w-4 text-[#a8a090]" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-[#1e3020]">すぐ使う</h2>
            <nav className="mt-3 space-y-1" aria-label="クイックアクション">
              {[
                { href: "/organizer/events", icon: CalendarDays, label: "イベント管理" },
                { href: "/organizer/recruitments", icon: Users, label: "スタッフ募集管理" },
                { href: "/organizer/articles", icon: FileText, label: "記事管理" },
                { href: "/organizer/stories", icon: BookOpen, label: "ストーリー" },
                { href: "/", icon: ExternalLink, label: "サイトを見る" },
              ].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#3a3428] transition hover:bg-[#f4f0e8]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#6a6258]" aria-hidden />
                  {label}
                </Link>
              ))}
            </nav>
          </section>

          <section className="rounded-2xl border border-[#ccc4b4] bg-[#f4f0e8]/60 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-[#1e3020]">最初にやること</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#6a6258]">
              <li>・イベントを作成して内容を入力する</li>
              <li>・公開前にプレビューで確認する</li>
              <li>・必要に応じてスタッフ募集を作り、締切を設定する</li>
            </ul>
          </section>

          {billingSummary && billingSummary.paymentSetupStatus !== "ok" && (
            <Link
              href="/organizer/settings/payouts"
              className="block rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-sm transition hover:bg-amber-100/50 sm:p-5"
            >
              <p className="font-medium text-amber-900">売上受取設定がまだです</p>
              <p className="mt-1 text-xs text-amber-700">
                参加費を集めるには Stripe での受取設定が必要です
              </p>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
