"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, ChevronRight, Info, QrCode, Wallet, type LucideIcon } from "lucide-react";
import type { DashboardResponse } from "@/app/api/organizer/dashboard/route";
import type { PosSalesSummary } from "@/lib/pos/types";
import { formatYen } from "@/lib/pos/types";
import { useOrganizerUnreadCount } from "@/hooks/use-scoped-unread-count";
import type { DashboardTodo } from "@/app/api/organizer/dashboard/route";
import { useOrganizerRole } from "@/hooks/use-organizer-role";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";
import { todayJst } from "@/components/organizer/mobile/event-date";
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

const SERIF = ORG_SERIF;

/**
 * 運営の道具の大きなボタン（深い緑・横長）。左にアイコン、まんなかに名前と一言、右に今の数字。
 * ホームの主役なので、3つとも同じ強さで縦に並べる。
 */
function BigTool({
  href,
  Icon,
  label,
  sub,
  value,
  badge,
}: {
  href: string;
  Icon: LucideIcon;
  label: string;
  sub: string;
  value?: string;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative flex min-h-[84px] items-center gap-3.5 overflow-hidden rounded-[20px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-br from-[#245a3e] to-[#173f2c] px-4 py-3.5 text-[#f6ebc8] shadow-[0_6px_16px_rgba(14,42,29,0.2)] transition active:scale-[0.98]"
    >
      <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#c9a54e]/10" aria-hidden />
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#f6ebc8] text-[#173f2c]" aria-hidden>
        <Icon className="h-6 w-6" strokeWidth={2} />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[17px] font-bold leading-tight text-white">
          {label}
          {badge}
        </span>
        {/* スマホは数字を2行目に（右に置くと説明が切れる）。タブレットは説明と数字を両方 */}
        {value ? (
          <span className="mt-1 block truncate text-[14px] font-bold tabular-nums leading-snug text-[#f6ebc8] tablet:hidden">{value}</span>
        ) : null}
        <span className={value ? "mt-1 hidden truncate text-[12px] leading-snug text-[#dfe8e1] tablet:block" : "mt-1 block truncate text-[12px] leading-snug text-[#dfe8e1]"}>
          {sub}
        </span>
      </span>
      {value ? (
        <span className="relative hidden shrink-0 text-right text-[15px] font-bold tabular-nums text-[#f6ebc8] tablet:block">{value}</span>
      ) : null}
      <ChevronRight className="relative h-5 w-5 shrink-0 text-[#e6d29b]" aria-hidden />
    </Link>
  );
}

/**
 * 主催者ホーム：運営の道具の画面（イベントの一覧は掲載管理の役目。2026-11-18）。
 * 対応が必要なこと → 今日のイベント（ある日だけ）→ 運営の道具（当日の受付・レジ・ダッシュボード）
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
  /** 今日が開催日（期間の途中も）で公開中のイベント。あれば道具の上に出し、受付・レジをそのイベントで開く */
  const dayEvent =
    (data?.events ?? [])
      .filter(
        (e) => e.status === "public" && e.date.slice(0, 10) <= today && (e.endDate ?? e.date).slice(0, 10) >= today
      )
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
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

      <div className="space-y-4">
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

          {/* 今日のイベント（ある日だけ）。押すとそのイベントの受付へ */}
          {dayEvent ? (
            <Link
              href={organizerDayEventHref(dayEvent.id)}
              className="flex items-center gap-2.5 rounded-full border border-[#e6d29b] bg-[#fbf3e1] px-3.5 py-2.5 active:bg-[#f6ebc8]"
            >
              <span className="shrink-0 rounded-full bg-[#c0572a] px-2 py-0.5 text-[11px] font-bold text-white">今日</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-[#173f2c]">{dayEvent.title}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#a3812f]" aria-hidden />
            </Link>
          ) : null}

          {/* 運営の道具（ホームの主役）。深い緑の大きなボタンで縦に3つ */}
          <nav aria-label="運営の道具" className="space-y-2.5">
            <OrgEyebrow>TOOLS</OrgEyebrow>
            <BigTool
              href={dayEvent ? organizerDayEventHref(dayEvent.id) : "/organizer"}
              Icon={QrCode}
              label="当日の受付"
              sub={dayEvent ? `${dayEvent.title}の受付・連絡` : "参加パスのQRを読んで受付・連絡"}
            />
            <BigTool
              href={dayEvent ? `/organizer/pos?event=${encodeURIComponent(dayEvent.id)}` : "/organizer/pos"}
              Icon={Wallet}
              label="レジ"
              sub="現金・スマホ払いで会計"
              value={`今日の売上 ${formatYen(sales?.totalYen ?? 0)}`}
              badge={<PlanBadge feature="pos" />}
            />
            {canSeeDashboard ? (
              <BigTool
                href="/organizer/dashboard"
                Icon={BarChart3}
                label="ダッシュボード"
                sub="参加・閲覧・売上・申込をふり返る"
                value={data ? `新しい申込 ${data.kpis.pendingApplications}件・公開中 ${data.kpis.hosting}件` : undefined}
              />
            ) : null}
          </nav>

          {/* イベントの一覧・下書きの続きは掲載管理で */}
          <Link
            href="/organizer/listings?kind=event"
            className="flex min-h-[44px] items-center justify-center gap-1 text-[13px] font-bold text-[#173f2c]"
          >
            イベントの一覧・下書きは掲載管理で
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
