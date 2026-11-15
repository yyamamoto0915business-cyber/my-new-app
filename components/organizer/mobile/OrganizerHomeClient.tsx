"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardList,
  Info,
  MapPin,
  Gamepad2,
  QrCode,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { DashboardEvent, DashboardResponse } from "@/app/api/organizer/dashboard/route";
import type { PosSalesSummary } from "@/lib/pos/types";
import { formatYen } from "@/lib/pos/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { cn } from "@/lib/utils";
import { useOrganizerUnreadCount } from "@/hooks/use-scoped-unread-count";
import type { DashboardTodo } from "@/app/api/organizer/dashboard/route";
import { useOrganizerRole } from "@/hooks/use-organizer-role";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";

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

/**
 * イベントを動かす道具。入口はここだけ（前の「運営」タブはホームと重なっていたのでなくした）。
 * チャットは下のナビ、プランはマイページから行く。
 */
const QUICK_ACTIONS: { href: string; label: string; Icon: LucideIcon; color: string; bg: string }[] = [
  { href: "/organizer/events", label: "イベント管理", Icon: ClipboardList, color: "#d4843a", bg: "#fdf1e4" },
  { href: "/organizer", label: "当日の受付", Icon: QrCode, color: "#2f7d4e", bg: "#e6f3ea" },
  { href: "/organizer/pos", label: "レジ", Icon: Wallet, color: "#2f6fae", bg: "#e6f1fa" },
  { href: "/organizer/games", label: "ゲーム", Icon: Gamepad2, color: "#7a5cc0", bg: "#efeaf9" },
];

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

/** 英字の小さいラベル＋明朝体の見出し（利用者側の見出しとそろえる） */
function SectionHead({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div className="mb-2 flex items-end justify-between gap-2">
      <div className="min-w-0">
        <OrgEyebrow>{eyebrow}</OrgEyebrow>
        <h2 className="mt-0.5 text-[17px] font-bold tracking-[0.04em] text-[#163828]" style={{ fontFamily: SERIF }}>
          {title}
        </h2>
      </div>
      {href ? (
        <Link href={href} className="mb-0.5 inline-flex shrink-0 items-center gap-0.5 text-[12px] font-bold text-[#173f2c]">
          すべて見る
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

/** 公開中で写真のあるイベントだけ、写真を大きく見せる */
function FeaturedEvent({ e, imageUrl }: { e: DashboardEvent; imageUrl: string }) {
  const st = STATUS_LABEL[e.status];
  return (
    <Link
      href={`/organizer/events/${e.id}`}
      className="relative block h-[148px] overflow-hidden rounded-[20px] bg-[#173f2c] shadow-[0_8px_20px_rgba(14,42,29,0.18)]"
    >
      <EventThumbnail imageUrl={imageUrl} alt="" rounded="none" fill placeholderSize="icon" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" aria-hidden />
      <span className="absolute inset-x-0 bottom-0 p-3.5 pr-10">
        <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold", st.className)}>{st.label}</span>
        <span className="mt-1 block truncate text-[17px] font-bold text-white drop-shadow" style={{ fontFamily: SERIF }}>
          {e.title}
        </span>
        <span className="mt-0.5 flex items-center gap-2 truncate text-[12px] text-white/90">
          <span className="shrink-0">{formatEventWhen(e)}</span>
          {e.location ? (
            <span className="flex min-w-0 items-center gap-0.5">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{e.location}</span>
            </span>
          ) : null}
        </span>
      </span>
      <ChevronRight className="absolute bottom-4 right-3 h-5 w-5 text-white" aria-hidden />
    </Link>
  );
}

/** 2026-11-29 と今日（YYYY-MM-DD）の日数の差 */
function daysBetween(today: string, ymd: string): number {
  const a = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const b = Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
  return Math.round((b - a) / 86400000);
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
  const startDay = e.date.slice(0, 10);
  const [, m, d] = startDay.split("-").map(Number);
  const wd = WEEKDAY_JA[new Date(`${startDay}T12:00:00+09:00`).getUTCDay()];
  const lastDay = (e.endDate ?? e.date).slice(0, 10);
  const multiDay = lastDay > startDay;
  const past = lastDay < today;
  const diff = daysBetween(today, startDay);
  const ongoing = !past && diff < 0;
  const tag = past
    ? { label: "終了", className: "bg-[#eef0ec] text-[#8a958d]" }
    : ongoing
      ? { label: "開催中", className: "bg-[#173f2c] text-[#f3e6bf]" }
      : diff === 0
        ? { label: "今日", className: "bg-[#c0572a] text-white" }
        : diff === 1
          ? { label: "明日", className: "bg-[#fbe7dc] text-[#b04c22]" }
          : diff <= 7
            ? { label: `あと${diff}日`, className: "bg-[#fbe7dc] text-[#b04c22]" }
            : { label: `あと${diff}日`, className: "bg-[#eef4ef] text-[#3f6250]" };
  const time = formatTimeRange(e);
  const [, em, ed] = lastDay.split("-").map(Number);
  const sub = [st.label, multiDay ? `〜${em}/${ed}` : null, time || null].filter(Boolean).join("・");
  return (
    <Link href={`/organizer/events/${e.id}`} className="flex items-center gap-3 px-3 py-2.5 active:bg-[#f6f9f5]">
      <span
        className={cn(
          "flex h-[46px] w-[42px] shrink-0 flex-col items-center justify-center rounded-[12px] leading-none",
          past
            ? "bg-[#f1f2ef] text-[#a3aaa5]"
            : e.status === "public"
              ? "bg-[#173f2c] text-white"
              : "bg-[#fbf3e1] text-[#5f4810]"
        )}
        aria-hidden
      >
        <span
          className={cn(
            "text-[9.5px] font-bold",
            past ? "" : e.status === "public" ? "text-[#e6d29b]" : "text-[#a3812f]"
          )}
        >
          {m}月
        </span>
        <span className="mt-[3px] text-[17px] font-bold tracking-tight">{d}</span>
        <span className="mt-[3px] text-[9px] font-bold opacity-80">{wd}</span>
      </span>
      <span className="min-w-0 flex-1">
        {/* palt：「【」などの左の空きを詰めて、題名の左端をそろえる */}
        <span
          className={cn(
            "block truncate text-[14px] font-semibold [font-feature-settings:'palt']",
            past ? "text-[#7b877f]" : "text-[#163828]"
          )}
        >
          {e.title}
        </span>
        <span className="mt-[3px] block truncate text-[12px] text-[#7b877f]">{sub}</span>
      </span>
      <span className={cn("shrink-0 rounded-full px-2 py-[3px] text-[11px] font-bold", tag.className)}>{tag.label}</span>
    </Link>
  );
}

/**
 * 主催者ホーム：開いてすぐ「今やること」が見える順に並べる。
 * 対応が必要なこと → 数字 → 運営の道具（イベント管理・当日の受付・レジ・ゲーム） → 管理中のイベント
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
  // 公開中 → これからの日付が近い順 → 日付の過ぎたもの（新しい順）に並べる
  const [today] = useState(() => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10));
  const rank = (e: DashboardEvent) => (e.status === "public" ? 0 : 2) + (e.date >= today ? 0 : 1);
  const events = (data?.events ?? [])
    .filter((e) => e.status === "public" || e.status === "draft")
    .sort((a, b) => {
      const r = rank(a) - rank(b);
      if (r !== 0) return r;
      return a.date >= today ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });
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
  // 大きく見せるのは「公開中で写真がある」いちばん上のイベントだけ。ほかは同じ低い行で並べる
  const featured = events[0]?.status === "public" && events[0]?.imageUrl ? events[0] : null;
  const rowEvents = featured ? events.slice(1, 4) : events.slice(0, 4);
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

      {/* タブレットでは2列：左に「今やること」、右に管理中のイベント */}
      <div className="space-y-4 tablet:grid tablet:grid-cols-2 tablet:items-start tablet:gap-6 tablet:space-y-0">
        <div className="min-w-0 space-y-4">
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

          {/* 数字（緑のカード。見るだけ）。押せるのは下の「くわしい数字を見る」の行だけにして、スクロール中に触れても移らないようにする */}
          {loading ? (
            <div className="h-[100px] animate-pulse rounded-[18px] bg-[#e8ede4]" />
          ) : data ? (
            <div className="relative overflow-hidden rounded-[18px] border border-[#ebeee8] bg-white shadow-[0_3px_10px_rgba(22,56,40,0.05)]">
              {/* 金色の細い線（差し色はここだけ） */}
              <span className="pointer-events-none absolute inset-x-5 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#c9a54e] to-transparent" aria-hidden />
              <dl aria-label="運営サマリー" className="grid grid-cols-3 divide-x divide-[#eef1ec] px-2 pb-2.5 pt-3">
                <Stat label="公開中" value={`${data.kpis.hosting}件`} />
                <Stat label="新規申込" value={`${data.kpis.pendingApplications}件`} />
                <Stat label="今日の売上" value={formatYen(sales?.totalYen ?? 0)} />
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

          {/* 運営の道具 */}
          <nav aria-label="運営の道具" className="grid grid-cols-4 gap-2">
            {QUICK_ACTIONS.map(({ href, label, Icon, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 rounded-[16px] border border-[#ebeee8] bg-white px-1 pb-1.5 pt-2 text-center shadow-[0_3px_10px_rgba(22,56,40,0.05)] active:scale-[0.97]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: bg, color }} aria-hidden>
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                <span className="whitespace-nowrap text-[11px] font-bold leading-tight text-[#163828]">{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="min-w-0">
          {/* 管理中のイベント：1件目は写真を大きく、残りは低い行 */}
          {data ? (
            <section aria-label="管理中のイベント">
              <SectionHead eyebrow="EVENTS" title="管理中のイベント" href="/organizer/listings" />
              {events.length === 0 ? (
                <Link
                  href="/organizer/new"
                  className="block rounded-[18px] border border-dashed border-[#cfe0d4] bg-white px-4 py-5 text-center text-[13px] font-bold text-[#1f7a4a]"
                >
                  ＋ 最初の掲載をはじめる
                </Link>
              ) : (
                <div className="space-y-2.5">
                  {featured?.imageUrl ? <FeaturedEvent e={featured} imageUrl={featured.imageUrl} /> : null}
                  {rowEvents.length > 0 ? (
                    <ul className="divide-y divide-[#eef1ec] overflow-hidden rounded-[18px] border border-[#ebeee8] bg-white shadow-[0_3px_10px_rgba(22,56,40,0.05)]">
                      {rowEvents.map((e) => (
                        <li key={e.id}>
                          <EventRow e={e} today={today} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
