"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronRight,
  Info,
  MapPin,
  Users,
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

const STATUS_LABEL: Record<DashboardEvent["status"], { label: string; className: string }> = {
  public: { label: "公開中", className: "bg-[#e3f2e7] text-[#1f7a4a]" },
  draft: { label: "下書き", className: "bg-[#fdf1d8] text-[#a26a10]" },
  ended: { label: "終了", className: "bg-[#eef0ec] text-[#6b776f]" },
  archived: { label: "非公開", className: "bg-[#eef0ec] text-[#6b776f]" },
};

function SummaryCard({
  label,
  value,
  Icon,
  color,
  bg,
  href,
}: {
  label: string;
  value: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[20px] border border-[#ebeee8] bg-white px-3.5 py-4 shadow-[0_3px_10px_rgba(22,56,40,0.05)] active:scale-[0.98]"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ background: bg, color }}
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-bold text-[#4f5d54]">{label}</span>
        <span className="mt-0.5 block truncate text-[24px] font-bold leading-tight text-[#163828]">
          {value}
        </span>
      </span>
    </Link>
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

/** 主催者ホーム（見本「01_ホーム」）：運営サマリー・対応が必要なこと・管理中のイベント */
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
    <div className="mx-auto w-full max-w-xl space-y-6 pb-6">
      {/* ヒーロー */}
      <section className="relative overflow-hidden rounded-[24px] shadow-[0_8px_24px_rgba(22,56,40,0.16)]">
        <div className="relative aspect-[2/1] w-full">
          <Image
            src="/hero-festival.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 100vw, 576px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#123524]/90 via-[#123524]/50 to-transparent" aria-hidden />
          <div className="absolute inset-0 flex flex-col justify-center px-5 text-white">
            <span className="inline-flex w-fit items-center rounded-full border border-white/70 px-3 py-0.5 text-[10.5px] font-bold tracking-[0.12em]">
              ORGANIZER・主催者モード
            </span>
            <h1
              className="mt-2 text-[30px] font-bold leading-tight"
              style={{ fontFamily: "var(--font-serif-display), 'Noto Serif JP', serif" }}
            >
              主催者ホーム
            </h1>
            <p className="mt-1 text-[12.5px] text-white/90">
              {data?.organizationName
                ? `${data.organizationName}の掲載と運営をまとめて管理`
                : "イベント・店舗・運営をまとめて管理"}
            </p>
          </div>
        </div>
      </section>

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

      {/* 運営サマリー */}
      <section aria-labelledby="org-summary">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 id="org-summary" className="text-[18px] font-bold text-[#163828]">
            運営サマリー
          </h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[84px] animate-pulse rounded-[20px] bg-[#e8ede4]" />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label="公開中"
              value={`${data.kpis.hosting}件`}
              Icon={CalendarDays}
              color="#2f7d4e"
              bg="#e6f3ea"
              href="/organizer/listings"
            />
            <SummaryCard
              label="新規申込"
              value={`${data.kpis.pendingApplications}件`}
              Icon={Users}
              color="#d4843a"
              bg="#fdf1e4"
              href="/organizer/events"
            />
            <SummaryCard
              label="今日のレジ売上"
              value={formatYen(sales?.totalYen ?? 0)}
              Icon={Wallet}
              color="#b07a1c"
              bg="#fdf6e0"
              href="/organizer/pos"
            />
            <SummaryCard
              label="未対応"
              value={`${data.kpis.needsAction}件`}
              Icon={Bell}
              color="#d0567a"
              bg="#fde9ef"
              href="/organizer/events"
            />
          </div>
        ) : null}
      </section>

      {/* 対応が必要なこと */}
      {data ? (
        <section aria-labelledby="org-todos">
          <h2 id="org-todos" className="mb-2.5 text-[18px] font-bold text-[#163828]">
            対応が必要なこと
          </h2>
          {todos.length === 0 ? (
            <p className="rounded-[18px] border border-[#ebeee8] bg-white px-4 py-4 text-[13px] text-[#6b776f]">
              いま対応が必要なことはありません
            </p>
          ) : (
            <ul className="space-y-2">
              {todos.slice(0, 3).map((todo) => (
                <li key={todo.id}>
                  <Link
                    href={todo.href}
                    className="flex items-center gap-3 rounded-[18px] border border-[#ebeee8] bg-white px-4 py-3.5 shadow-[0_3px_10px_rgba(22,56,40,0.05)] active:bg-[#fafcf9]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fdf1e4] text-[#d4843a]" aria-hidden>
                      <Info className="h-5 w-5" />
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

      {/* チーム運営の案内（TEAM プランは準備中なのでプランのページへ） */}
      <Link
        href="/organizer/settings/plan"
        className="flex items-center gap-3 rounded-[22px] border border-[#d9eadf] bg-gradient-to-br from-[#eef7f0] to-[#f8fbf5] px-5 py-4 active:scale-[0.99]"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-bold text-[#1f5e3a]">チームでイベントを運営しよう</span>
          <span className="mt-1 block text-[12.5px] text-[#5f7266]">招待・権限設定で作業を分担（TEAMプラン・準備中）</span>
        </span>
        <Users className="h-8 w-8 shrink-0 text-[#2f7d4e]" aria-hidden />
      </Link>
    </div>
  );
}
