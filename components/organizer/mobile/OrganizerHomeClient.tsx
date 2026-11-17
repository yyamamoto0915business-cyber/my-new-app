"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Info, MapPin, PenLine, QrCode, Users, Wallet } from "lucide-react";
import type { DashboardEvent, DashboardResponse } from "@/app/api/organizer/dashboard/route";
import type { PosSalesSummary } from "@/lib/pos/types";
import { formatYen } from "@/lib/pos/types";
import { cn } from "@/lib/utils";
import { useOrganizerUnreadCount } from "@/hooks/use-scoped-unread-count";
import type { DashboardTodo } from "@/app/api/organizer/dashboard/route";
import { useOrganizerRole } from "@/hooks/use-organizer-role";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";
import { EventDateTile, eventTiming, todayJst, daysBetween } from "@/components/organizer/mobile/event-date";
import { PlanBadge } from "@/components/organizer/mobile/plan-badge";
import { useOrganizerNavPlan } from "@/lib/organizer-pro-store";
import { getOrganizerCatalogPlan, type OrganizerCatalogPlanId } from "@/lib/organizer-plans";

const PLAN_RANK: Record<OrganizerCatalogPlanId, number> = { free: 0, standard: 1, game: 2, team: 3 };
/** プランが上がったとき、新しく使えるようになったもの（ホームに一度だけ出す） */
const UNLOCKED: Record<Exclude<OrganizerCatalogPlanId, "free">, { text: string; href: string; cta: string }> = {
  standard: { text: "レジと、掲載の数の制限なしが使えるようになりました", href: "/organizer/pos", cta: "レジを開く" },
  game: { text: "ゲーム（スタンプラリー・クイズなど）が作れるようになりました", href: "/organizer/games?pick=1", cta: "ゲームを作る" },
  team: { text: "メンバーを招待して、チームで運営できるようになりました", href: "/organizer/team", cta: "メンバーを招待" },
};
const LAST_PLAN_KEY = "mg-org-last-plan";

/** 前に見たときよりプランが上がっていたら、その分の案内を返す（見たら覚える） */
function usePlanUpgradeNotice() {
  const plan = useOrganizerNavPlan();
  const [notice, setNotice] = useState<{ plan: Exclude<OrganizerCatalogPlanId, "free"> } | null>(null);
  useEffect(() => {
    if (!plan) return;
    try {
      const last = window.localStorage.getItem(LAST_PLAN_KEY) as OrganizerCatalogPlanId | null;
      window.localStorage.setItem(LAST_PLAN_KEY, plan);
      if (last && last in PLAN_RANK && PLAN_RANK[plan] > PLAN_RANK[last] && plan !== "free") setNotice({ plan });
    } catch {
      /* 保存できない端末では出さない */
    }
  }, [plan]);
  return { notice, dismiss: () => setNotice(null) };
}
import { organizerDayEventHref } from "@/components/organizer/day/day-management-shared";

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 10月27日（火） 17:00〜21:00 */
function formatEventWhen(e: DashboardEvent): string {
  const [, m, d] = e.date.split("-").map(Number);
  const wd = new Date(`${e.date}T12:00:00+09:00`).getUTCDay();
  const day = m && d ? `${m}月${d}日（${WEEKDAY_JA[wd]}）` : e.date;
  const start = e.startTime?.slice(0, 5);
  const end = e.endTime?.slice(0, 5);
  if (!start) return day;
  return `${day} ${start}${end ? `〜${end}` : "〜"}`;
}

const STATUS_LABEL: Record<DashboardEvent["status"], { label: string; className: string }> = {
  public: { label: "公開中", className: "bg-[#e3f2e7] text-[#1f7a4a]" },
  draft: { label: "下書き", className: "bg-[#fdf1d8] text-[#a26a10]" },
  ended: { label: "終了", className: "bg-[#eef0ec] text-[#6b776f]" },
  archived: { label: "非公開", className: "bg-[#eef0ec] text-[#6b776f]" },
};

const SERIF = ORG_SERIF;

/** 数字1つ（白いカードの中。数字だけ深い緑） */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-1 text-center">
      <dt className="text-[10.5px] font-bold tracking-[0.06em] text-[#7b877f]">{label}</dt>
      <dd className="mt-0.5 whitespace-nowrap text-[19px] font-bold leading-tight tracking-tight text-[#173f2c]">{value}</dd>
    </div>
  );
}

/** 次のイベントのカードの小さなボタン */
function CardButton({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-[12px] px-2 text-[13px] font-bold active:scale-[0.97]",
        primary
          ? "border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[#f6ebc8] shadow-[0_2px_8px_rgba(14,42,29,0.18)]"
          : "border border-[#e6e2d6] bg-white text-[#173f2c]"
      )}
    >
      {children}
    </Link>
  );
}

/**
 * 次のイベント（1件だけ大きく）。その日にやることのボタンをカードの中に置く。
 * 当日・開催中は「当日の受付」と「レジ」を大きく、それより前は「申込者・当日の受付・編集」、下書きは「続きを編集」。
 */
function NextEventCard({ e, today }: { e: DashboardEvent; today: string }) {
  const timing = eventTiming(today, e.date, e.endDate);
  const isToday = !timing.past && daysBetween(today, e.date) <= 0;
  const draft = e.status === "draft";
  return (
    <section
      aria-label={isToday ? "今日のイベント" : "次のイベント"}
      className="relative overflow-hidden rounded-[20px] border border-[#e6e2d6] bg-white p-3.5 shadow-[0_3px_12px_rgba(22,56,40,0.06)]"
    >
      <span className="pointer-events-none absolute inset-x-5 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#c9a54e] to-transparent" aria-hidden />
      <div className="flex items-center justify-between gap-2">
        <OrgEyebrow>{isToday ? "TODAY" : "NEXT EVENT"}</OrgEyebrow>
        <span className={cn("shrink-0 rounded-full px-2 py-[3px] text-[11px] font-bold", timing.tag.className)}>
          {timing.tag.label}
        </span>
      </div>
      <Link href={`/organizer/events/${e.id}`} className="mt-2 flex items-center gap-3">
        <EventDateTile date={e.date} status={e.status} past={false} />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[16px] font-bold leading-snug text-[#163828] [font-feature-settings:'palt']"
          >
            {e.title}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-2 text-[12px] text-[#6b776f]">
            <span className="shrink-0">
              {draft ? "下書き・" : ""}
              {timing.multiDay ? `〜${timing.endLabel}・` : ""}
              {formatTimeRange(e) || formatEventWhen(e)}
            </span>
            {e.location ? (
              <span className="flex min-w-0 items-center gap-0.5">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{e.location}</span>
              </span>
            ) : null}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#a3ada6]" aria-hidden />
      </Link>

      {draft ? (
        <div className="mt-3">
          <CardButton href={`/organizer/events/${e.id}`} primary>
            <PenLine className="h-4 w-4" aria-hidden />
            続きを編集して公開する
          </CardButton>
        </div>
      ) : isToday ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <CardButton href={organizerDayEventHref(e.id)} primary>
              <QrCode className="h-4 w-4" aria-hidden />
              当日の受付
            </CardButton>
            <CardButton href={`/organizer/pos?event=${encodeURIComponent(e.id)}`} primary>
              <Wallet className="h-4 w-4" aria-hidden />
              レジ
              <PlanBadge feature="pos" />
            </CardButton>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[12px] font-bold text-[#3f6250]">
            <Link href={`/organizer/events/${e.id}/answers`} className="py-1">申込者 {e.participantCount ?? 0}人</Link>
            <Link href={`/organizer/events/${e.id}`} className="py-1">編集</Link>
          </div>
        </>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <CardButton href={`/organizer/events/${e.id}/answers`}>
            <Users className="h-4 w-4" aria-hidden />
            申込者 {e.participantCount ?? 0}
          </CardButton>
          <CardButton href={organizerDayEventHref(e.id)}>
            <QrCode className="h-4 w-4" aria-hidden />
            受付
          </CardButton>
          <CardButton href={`/organizer/events/${e.id}`}>
            <PenLine className="h-4 w-4" aria-hidden />
            編集
          </CardButton>
        </div>
      )}
    </section>
  );
}

/** 10:00〜16:00（時刻がなければ空） */
function formatTimeRange(e: DashboardEvent): string {
  const start = e.startTime?.slice(0, 5);
  const end = e.endTime?.slice(0, 5);
  if (!start) return "";
  return `${start}〜${end ?? ""}`;
}

/**
 * イベントの行。左は日付のカレンダー（月・日・曜日）、右端に「あと◯日」などの札。
 * 2行目は状態・時刻を控えめに（何日も続くイベントは終わりの日も）。日付の過ぎたものは灰色。
 */
function EventRow({ e, today }: { e: DashboardEvent; today: string }) {
  const st = STATUS_LABEL[e.status];
  const timing = eventTiming(today, e.date, e.endDate);
  const time = formatTimeRange(e);
  const sub = [st.label, timing.multiDay ? `〜${timing.endLabel}` : null, time || null].filter(Boolean).join("・");
  return (
    <Link href={`/organizer/events/${e.id}`} className="flex items-center gap-3 px-3 py-2.5 active:bg-[#f6f9f5]">
      <EventDateTile date={e.date} status={e.status} past={timing.past} />
      <span className="min-w-0 flex-1">
        {/* palt：「【」などの左の空きを詰めて、題名の左端をそろえる */}
        <span
          className={cn(
            "block truncate text-[14px] font-semibold [font-feature-settings:'palt']",
            timing.past ? "text-[#7b877f]" : "text-[#163828]"
          )}
        >
          {e.title}
        </span>
        <span className="mt-[3px] block truncate text-[12px] text-[#7b877f]">{sub}</span>
      </span>
      <span className={cn("shrink-0 rounded-full px-2 py-[3px] text-[11px] font-bold", timing.tag.className)}>
        {timing.tag.label}
      </span>
    </Link>
  );
}

/**
 * 主催者ホーム：「次に何をするか」の画面（全部の一覧は掲載管理の役目）。
 * 対応が必要なこと → 次のイベント（1件・その日のボタンつき）→ このあとの予定（2件まで）→ 数字 → 当日の道具（受付・レジ）
 * ゲームは掲載管理・新しく掲載から入る（2026-11-18）
 */
export function OrganizerHomeClient() {
  const role = useOrganizerRole();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [sales, setSales] = useState<PosSalesSummary | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch("/api/organizer/dashboard", { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        setData((await res.json()) as DashboardResponse);
      })
      .catch((e: unknown) => {
        if ((e as Error)?.name !== "AbortError") setError(true);
      });
    // 売上はレジの「今日の売上」。取れなくてもホームは出す
    fetch("/api/organizer/pos/sales", { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json()) as { summary?: PosSalesSummary };
        if (json.summary) setSales(json.summary);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [reloadKey]);

  const loading = !data && !error;
  const [today] = useState(todayJst);
  /** これから・開催中のイベント（公開中・下書き）。開催中 → 日付の近い順 */
  const upcoming = (data?.events ?? [])
    .filter((e) => (e.status === "public" || e.status === "draft") && (e.endDate ?? e.date).slice(0, 10) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = upcoming[0] ?? null;
  /** 次のイベントのあと、2週間以内のもの（2件まで）。すべては掲載管理で見る */
  const laterEvents = upcoming.slice(1).filter((e) => daysBetween(today, e.date) <= 14).slice(0, 2);
  // 未読メッセージは、主催者として参加している会話の分だけを数える（下のナビの「チャット」と同じ数）。
  // サーバーの数は利用者として参加している会話の未読も含むので、ここで置きかえる。
  const organizerUnread = useOrganizerUnreadCount();
  const todos: DashboardTodo[] = [
    ...(organizerUnread > 0
      ? [
          {
            id: "unread-messages",
            type: "unread" as const,
            title: `未読メッセージが${organizerUnread}件あります`,
            href: "/organizer/messages",
          },
        ]
      : []),
    ...(data?.todos ?? []).filter((t) => t.id !== "unread-messages"),
  ];

  const canSeeDashboard = role !== "staff";
  const upgrade = usePlanUpgradeNotice();
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 pb-6 tablet:max-w-[860px]">
      {/* 誰の主催者ホームか */}
      <header className="pt-1">
        <OrgEyebrow>ORGANIZER HOME</OrgEyebrow>
        <h1
          className="mt-0.5 truncate text-[22px] font-bold tracking-[0.04em] text-[#163828]"
          style={{ fontFamily: SERIF }}
        >
          {data?.organizationName ?? "主催者ホーム"}
        </h1>
      </header>

      {error ? (
        <div className="rounded-[18px] border border-[#f1d9c4] bg-[#fdf6ef] px-4 py-4 text-center">
          <p className="text-[13px] text-[#7a5a3a]">運営の情報を読み込めませんでした</p>
          <button
            type="button"
            onClick={() => setReloadKey((n) => n + 1)}
            className="mt-2 rounded-full bg-[#1f5e3a] px-4 py-2 text-[12px] font-bold text-white"
          >
            もう一度読み込む
          </button>
        </div>
      ) : null}

      {/* タブレットでは2列：左に「今やること」と次のイベント、右に数字と道具 */}
      <div className="space-y-4 tablet:grid tablet:grid-cols-2 tablet:items-start tablet:gap-6 tablet:space-y-0">
        <div className="min-w-0 space-y-4">
          {/* プランが上がった直後に一度だけ：新しく使えるようになったものへの入口 */}
          {upgrade.notice ? (
            <div className="relative overflow-hidden rounded-[18px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-br from-[#245a3e] to-[#173f2c] p-3.5 text-[#f6ebc8]">
              <p className="text-[11px] font-bold tracking-[0.12em] text-[#e6d29b]">
                {getOrganizerCatalogPlan(upgrade.notice.plan).name} プランになりました
              </p>
              <p className="mt-1 text-[13.5px] font-bold leading-snug text-white">{UNLOCKED[upgrade.notice.plan].text}</p>
              <div className="mt-2.5 flex items-center gap-2">
                <Link
                  href={UNLOCKED[upgrade.notice.plan].href}
                  onClick={upgrade.dismiss}
                  className="inline-flex min-h-[38px] items-center rounded-full bg-[#f6ebc8] px-4 text-[13px] font-bold text-[#173f2c]"
                >
                  {UNLOCKED[upgrade.notice.plan].cta} ›
                </Link>
                <button type="button" onClick={upgrade.dismiss} className="min-h-[38px] px-2 text-[12px] font-bold text-[#dfe8e1]">
                  とじる
                </button>
              </div>
            </div>
          ) : null}

          {/* 対応が必要なこと（いちばん上）。何もないときは1行だけ */}
          {loading ? (
            <div className="h-[44px] animate-pulse rounded-full bg-[#e8ede4]" />
          ) : data ? (
            todos.length === 0 ? (
              <p className="flex items-center gap-2 rounded-full border border-[#dcebdf] bg-[#f1f8f2] px-3.5 py-2.5 text-[12.5px] font-bold text-[#2f6b47]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#173f2c] text-[#ecdcab]" aria-hidden>
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                いま対応が必要なことはありません
              </p>
            ) : (
              <section aria-labelledby="org-todos">
                <h2 id="org-todos" className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-[#163828]">
                  対応が必要なこと
                  <span className="rounded-full bg-[#d0567a] px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                    {todos.length}
                  </span>
                </h2>
                <ul className="divide-y divide-[#f6e7d8] overflow-hidden rounded-[18px] border border-[#f3dcc6] bg-white shadow-[0_3px_10px_rgba(22,56,40,0.05)]">
                  {todos.slice(0, 3).map((todo) => (
                    <li key={todo.id}>
                      <Link href={todo.href} className="flex items-center gap-2.5 px-3.5 py-2.5 active:bg-[#fffaf5]">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fdf1e4] text-[#d4843a]" aria-hidden>
                          <Info className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 text-[13.5px] font-bold leading-snug text-[#163828]">{todo.title}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#a3ada6]" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          ) : null}

          {/* 次のイベント（1件だけ大きく）と、このあとの予定（2週間以内・2件まで）。全部の一覧は掲載管理 */}
          {loading ? (
            <div className="h-[170px] animate-pulse rounded-[20px] bg-[#e8ede4]" />
          ) : data ? (
            nextEvent ? (
              <div className="space-y-2">
                <NextEventCard e={nextEvent} today={today} />
                {laterEvents.length > 0 ? (
                  <section aria-label="このあとの予定">
                    <p className="mb-1 mt-3 px-1 text-[11.5px] font-bold tracking-[0.06em] text-[#7b877f]">このあとの予定</p>
                    <ul className="divide-y divide-[#eef1ec] overflow-hidden rounded-[18px] border border-[#ebeee8] bg-white shadow-[0_3px_10px_rgba(22,56,40,0.05)]">
                      {laterEvents.map((e) => (
                        <li key={e.id}>
                          <EventRow e={e} today={today} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                <Link
                  href="/organizer/listings?kind=event"
                  className="flex min-h-[40px] items-center justify-center gap-1 text-[12.5px] font-bold text-[#173f2c]"
                >
                  すべてのイベントは掲載管理で
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            ) : (
              <Link
                href="/organizer/new"
                className="flex flex-col items-center gap-1 rounded-[20px] border border-dashed border-[#d9c99a] bg-white px-4 py-5 text-center"
              >
                <span className="text-[14px] font-bold text-[#173f2c]">これからのイベントはありません</span>
                <span className="text-[12px] font-bold text-[#a3812f]">＋ 新しく掲載する</span>
              </Link>
            )
          ) : null}
        </div>

        <div className="min-w-0 space-y-4">
          {/* 数字（見るだけ）。押せるのは下の「くわしい数字を見る」の行だけ */}
          {loading ? (
            <div className="h-[100px] animate-pulse rounded-[18px] bg-[#e8ede4]" />
          ) : data ? (
            <div className="relative overflow-hidden rounded-[18px] border border-[#ebeee8] bg-white shadow-[0_3px_10px_rgba(22,56,40,0.05)]">
              <span className="pointer-events-none absolute inset-x-5 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#c9a54e] to-transparent" aria-hidden />
              <dl aria-label="運営サマリー" className="grid grid-cols-2 divide-x divide-[#eef1ec] px-2 pb-2.5 pt-3">
                <Stat label="公開中" value={`${data.kpis.hosting}件`} />
                <Stat label="新規申込" value={`${data.kpis.pendingApplications}件`} />
              </dl>
              {canSeeDashboard ? (
                <Link
                  href="/organizer/dashboard"
                  className="flex min-h-[40px] items-center justify-center gap-1 border-t border-[#eef1ec] text-[12px] font-bold text-[#173f2c] active:bg-[#f4f7f3]"
                >
                  くわしい数字を見る（参加・閲覧・売上）
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : null}
            </div>
          ) : null}

          {/* 当日の道具（2つ）。レジは今日の売上と1つにまとめる。使えないプランのときは金色の札でプラン名を出す */}
          <nav aria-label="当日の道具" className="grid grid-cols-2 gap-2">
            <Link
              href="/organizer"
              className="flex min-h-[64px] items-center gap-2.5 rounded-[16px] border border-[#ebeee8] bg-white px-3 shadow-[0_3px_10px_rgba(22,56,40,0.05)] active:scale-[0.97]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6f3ea] text-[#2f7d4e]" aria-hidden>
                <QrCode className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-bold text-[#163828]">当日の受付</span>
                <span className="block text-[11px] text-[#7b877f]">QRで受付・連絡</span>
              </span>
            </Link>
            <Link
              href="/organizer/pos"
              className="flex min-h-[64px] items-center gap-2.5 rounded-[16px] border border-[#ebeee8] bg-white px-3 shadow-[0_3px_10px_rgba(22,56,40,0.05)] active:scale-[0.97]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6f1fa] text-[#2f6fae]" aria-hidden>
                <Wallet className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-[13.5px] font-bold text-[#163828]">
                  レジ
                  <PlanBadge feature="pos" />
                </span>
                <span className="block truncate text-[11px] text-[#7b877f]">今日 {formatYen(sales?.totalYen ?? 0)}</span>
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
