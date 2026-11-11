"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ClipboardList,
  Info,
  MapPin,
  MessageCircle,
  QrCode,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { DashboardEvent, DashboardResponse } from "@/app/api/organizer/dashboard/route";
import type { PosSalesSummary } from "@/lib/pos/types";
import { formatYen } from "@/lib/pos/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { cn } from "@/lib/utils";

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
 * ホームから一度で行きたい、毎回のように使う4つ。
 * ゲーム・プランなどはそれぞれのタブ（運営・マイページ）から行く。
 */
const QUICK_ACTIONS: { href: string; label: string; Icon: LucideIcon; color: string; bg: string }[] = [
  { href: "/organizer/events", label: "申込を確認", Icon: ClipboardList, color: "#d4843a", bg: "#fdf1e4" },
  { href: "/organizer", label: "当日の受付", Icon: QrCode, color: "#2f7d4e", bg: "#e6f3ea" },
  { href: "/organizer/pos", label: "レジ", Icon: Wallet, color: "#2f6fae", bg: "#e6f1fa" },
  { href: "/messages", label: "メッセージ", Icon: MessageCircle, color: "#7a5cc0", bg: "#efeaf9" },
];

const STATUS_LABEL: Record<DashboardEvent["status"], { label: string; className: string }> = {
  public: { label: "公開中", className: "bg-[#e3f2e7] text-[#1f7a4a]" },
  draft: { label: "下書き", className: "bg-[#fdf1d8] text-[#a26a10]" },
  ended: { label: "終了", className: "bg-[#eef0ec] text-[#6b776f]" },
  archived: { label: "非公開", className: "bg-[#eef0ec] text-[#6b776f]" },
};

/** 数字だけを見せる欄。押して移動するのは下の「よく使う操作」に任せ、入口を重ねない */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-1 text-center">
      <dt className="text-[11px] font-bold text-[#6b776f]">{label}</dt>
      <dd className="mt-0.5 whitespace-nowrap text-[18px] font-bold leading-tight tracking-tight text-[#163828]">
        {value}
      </dd>
    </div>
  );
}

function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h2 className="text-[18px] font-bold text-[#163828]">{title}</h2>
      {href ? (
        <Link href={href} className="inline-flex items-center gap-0.5 text-[13px] font-bold text-[#1f7a4a]">
          すべて見る
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

/**
 * 主催者ホーム：開いてすぐ「今やること」が見える順に並べる。
 * 対応が必要なこと → 数字 → よく使う操作 → 管理中のイベント
 */
export function OrganizerHomeClient() {
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
  const events = (data?.events ?? []).filter((e) => e.status === "public" || e.status === "draft");
  const todos = data?.todos ?? [];

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 pb-6">
      {/* 誰の主催者ホームか（写真の帯はやめて1行にする） */}
      <div className="flex items-baseline justify-between gap-2 pt-1">
        <h1 className="min-w-0 truncate text-[20px] font-bold text-[#163828]">
          {data?.organizationName ?? "主催者ホーム"}
        </h1>
        <span className="shrink-0 text-[11px] font-bold tracking-[0.08em] text-[#6b8a76]">主催者モード</span>
      </div>

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

      {/* 対応が必要なこと（いちばん上に置く） */}
      {loading ? (
        <div className="h-[72px] animate-pulse rounded-[18px] bg-[#e8ede4]" />
      ) : data ? (
        <section aria-labelledby="org-todos">
          <h2 id="org-todos" className="mb-2 flex items-center gap-2 text-[16px] font-bold text-[#163828]">
            対応が必要なこと
            {todos.length > 0 ? (
              <span className="rounded-full bg-[#d0567a] px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                {todos.length}
              </span>
            ) : null}
          </h2>
          {todos.length === 0 ? (
            <p className="rounded-[18px] border border-[#ebeee8] bg-white px-4 py-3.5 text-[13px] text-[#6b776f]">
              いま対応が必要なことはありません
            </p>
          ) : (
            <ul className="space-y-2">
              {todos.slice(0, 3).map((todo) => (
                <li key={todo.id}>
                  <Link
                    href={todo.href}
                    className="flex items-center gap-3 rounded-[18px] border border-[#f3dcc6] bg-white px-3.5 py-3 shadow-[0_3px_10px_rgba(22,56,40,0.05)] active:bg-[#fafcf9]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fdf1e4] text-[#d4843a]" aria-hidden>
                      <Info className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1 text-[14px] font-bold leading-snug text-[#163828]">
                      {todo.title}
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[#163828]" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* 数字（横1行。見るだけ） */}
      {loading ? (
        <div className="h-[64px] animate-pulse rounded-[18px] bg-[#e8ede4]" />
      ) : data ? (
        <dl
          aria-label="運営サマリー"
          className="grid grid-cols-3 divide-x divide-[#eef1ec] rounded-[18px] border border-[#ebeee8] bg-white py-3 shadow-[0_3px_10px_rgba(22,56,40,0.05)]"
        >
          <Stat label="公開中" value={`${data.kpis.hosting}件`} />
          <Stat label="新規申込" value={`${data.kpis.pendingApplications}件`} />
          <Stat label="今日の売上" value={formatYen(sales?.totalYen ?? 0)} />
        </dl>
      ) : null}

      {/* よく使う操作 */}
      <nav aria-label="よく使う操作" className="grid grid-cols-4 gap-2">
        {QUICK_ACTIONS.map(({ href, label, Icon, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 rounded-[18px] border border-[#ebeee8] bg-white px-1 py-3 text-center shadow-[0_3px_10px_rgba(22,56,40,0.05)] active:scale-[0.97]"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: bg, color }}
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="whitespace-nowrap text-[11px] font-bold leading-tight text-[#163828]">{label}</span>
          </Link>
        ))}
      </nav>

      {/* 管理中のイベント */}
      {data ? (
        <section aria-labelledby="org-events">
          <SectionHead title="管理中のイベント" href="/organizer/listings" />
          {events.length === 0 ? (
            <Link
              href="/organizer/new"
              className="block rounded-[18px] border border-dashed border-[#cfe0d4] bg-white px-4 py-5 text-center text-[13px] font-bold text-[#1f7a4a]"
            >
              ＋ 最初の掲載をはじめる
            </Link>
          ) : (
            <ul className="space-y-2.5">
              {events.slice(0, 3).map((e) => {
                const st = STATUS_LABEL[e.status];
                return (
                  <li key={e.id}>
                    <Link
                      href={`/organizer/events/${e.id}`}
                      className="flex items-center gap-3 rounded-[20px] border border-[#ebeee8] bg-white p-2.5 pr-4 shadow-[0_3px_10px_rgba(22,56,40,0.05)] active:bg-[#fafcf9]"
                    >
                      <span className="relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-[14px] bg-[#e8ede4]">
                        <EventThumbnail imageUrl={e.imageUrl} alt="" rounded="none" fill placeholderSize="icon" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold", st.className)}>
                          {st.label}
                        </span>
                        <span className="mt-1 block truncate text-[15px] font-bold text-[#163828]">{e.title}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-[#6b776f]">{formatEventWhen(e)}</span>
                        {e.location ? (
                          <span className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-[#8a958d]">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="truncate">{e.location}</span>
                          </span>
                        ) : null}
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-[#163828]" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

    </div>
  );
}
