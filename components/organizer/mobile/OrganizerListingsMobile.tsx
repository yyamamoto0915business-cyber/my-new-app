"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Heart,
  Plus,
  Search,
  SlidersHorizontal,
  Store,
  Truck,
  type LucideIcon,
  Sparkles,
} from "lucide-react";
import type { DashboardResponse } from "@/app/api/organizer/dashboard/route";
import type { RecruitmentDashboardResponse } from "@/app/api/organizer/recruitments-dashboard/route";
import type { StoreRecord } from "@/lib/stores/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { cn } from "@/lib/utils";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";

/** まちに載せるものだけ。ゲームはイベントの中で使う道具なので「運営 → ゲーム」で管理する */
type Kind = "event" | "store" | "kitchen" | "volunteer";
type Status = "public" | "draft" | "ended";
type Tab = "all" | Status;

type Listing = {
  id: string;
  kind: Kind;
  title: string;
  imageUrl: string | null;
  status: Status;
  /** 状態の表示（終了・非公開・締切など、種類ごとの言い方） */
  statusLabel: string;
  /** 種類・日付・場所など */
  sub: string;
  /** 申込数など、実データのある数だけ */
  metric: string | null;
  href: string;
  /** イベントだけ：ポイントの設定（スマホではここが入口。PC はイベント管理のメニュー） */
  pointsHref?: string;
};

/** 種類ごとの色（写真がないときのアイコンの丸と、種類の文字に使う） */
const KIND_META: Record<Kind, { label: string; Icon: LucideIcon; color: string; bg: string }> = {
  event: { label: "イベント", Icon: CalendarDays, color: "#c7742c", bg: "#fdf1e4" },
  store: { label: "お店", Icon: Store, color: "#2f7d4e", bg: "#e6f3ea" },
  kitchen: { label: "キッチンカー", Icon: Truck, color: "#2f6fae", bg: "#e6f1fa" },
  volunteer: { label: "募集", Icon: Heart, color: "#c0507a", bg: "#fbe9f0" },
};

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "public", label: "公開中" },
  { id: "draft", label: "下書き" },
  { id: "ended", label: "終了" },
];

const STATUS_ORDER: Record<Status, number> = { public: 0, draft: 1, ended: 2 };

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 2026-10-27 → 10/27（火） */
function shortDate(ymd: string | null | undefined): string | null {
  if (!ymd) return null;
  const day = ymd.slice(0, 10);
  const [, m, d] = day.split("-").map(Number);
  if (!m || !d) return null;
  const wd = new Date(`${day}T12:00:00+09:00`).getUTCDay();
  return `${m}/${d}（${WEEKDAY_JA[wd]}）`;
}

function joinSub(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join("・");
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function fromEvents(data: DashboardResponse | null): Listing[] {
  return (data?.events ?? []).map((e) => {
    const status: Status = e.status === "public" ? "public" : e.status === "draft" ? "draft" : "ended";
    return {
      id: `event-${e.id}`,
      kind: "event",
      title: e.title,
      imageUrl: e.imageUrl ?? null,
      status,
      statusLabel: e.status === "archived" ? "非公開" : status === "ended" ? "終了" : "",
      sub: joinSub("イベント", shortDate(e.date)),
      metric: `申込 ${e.applicationCount}件`,
      href: `/organizer/events/${e.id}`,
      pointsHref: `/organizer/events/${e.id}/points`,
    };
  });
}

function fromStores(stores: StoreRecord[] | null): Listing[] {
  return (stores ?? []).map((s) => {
    const kitchen = s.kind === "kitchen_car";
    const status: Status = s.status === "public" ? "public" : s.status === "draft" ? "draft" : "ended";
    return {
      id: `store-${s.id}`,
      kind: kitchen ? "kitchen" : "store",
      title: s.name,
      imageUrl: s.coverImageUrl || s.galleryImages[0] || null,
      status,
      statusLabel: status === "ended" ? "非公開" : "",
      sub: joinSub(kitchen ? "キッチンカー" : "お店", s.category, s.address?.split(/[\s　]/)[0]),
      metric: null,
      href: kitchen ? `/organizer/kitchen-cars/${s.id}` : `/organizer/stores/${s.id}`,
    };
  });
}

function fromRecruitments(data: RecruitmentDashboardResponse | null): Listing[] {
  return (data?.recruitments ?? []).map((r) => {
    const status: Status = r.status === "public" ? "public" : r.status === "draft" ? "draft" : "ended";
    return {
      id: `recruitment-${r.id}`,
      kind: "volunteer",
      title: r.title,
      imageUrl: r.image_url || r.gallery_images?.[0] || null,
      status,
      statusLabel: status === "ended" ? "締切" : "",
      sub: joinSub("募集", shortDate(r.start_at)),
      metric: `応募 ${r.applicationCount}件`,
      href: `/organizer/recruitments/${r.id}`,
    };
  });
}

const STATUS_STYLE: Record<Status, string> = {
  public: "bg-[#e3f2e7] text-[#1f7a4a]",
  draft: "bg-[#fdf1d8] text-[#a26a10]",
  ended: "bg-[#eef0ec] text-[#6b776f]",
};

function statusText(item: Listing): string {
  return item.status === "public" ? "公開中" : item.status === "draft" ? "下書き" : item.statusLabel || "終了";
}

/**
 * 1件ぶんの行（低くして1画面に多く並べる）。
 * 行全体は編集へのリンク。イベントだけ右に「ポイント」を重ねる（リンクの入れ子にしない）。
 */
function ListingRow({ item }: { item: Listing }) {
  const { label: kindLabel, Icon, color, bg } = KIND_META[item.kind];
  const sub = item.sub.startsWith(kindLabel) ? item.sub.slice(kindLabel.length).replace(/^・/, "") : item.sub;
  return (
    <div className="relative">
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 active:bg-[#f6f9f5]",
          item.pointsHref ? "pr-[76px]" : "pr-3"
        )}
      >
        <span
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px]"
          style={item.imageUrl ? undefined : { background: bg, color }}
        >
          {item.imageUrl ? (
            <EventThumbnail imageUrl={item.imageUrl} alt="" rounded="none" fill placeholderSize="icon" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold", STATUS_STYLE[item.status])}>
              {statusText(item)}
            </span>
            <span className="truncate text-[14.5px] font-bold text-[#163828]">{item.title}</span>
          </span>
          <span className="mt-1 block truncate text-[12px] text-[#6b776f]">
            <span className="font-bold" style={{ color }}>
              {kindLabel}
            </span>
            {sub ? `・${sub}` : ""}
            {item.metric ? `・${item.metric}` : ""}
          </span>
        </span>
        {item.pointsHref ? null : <ChevronRight className="h-4 w-4 shrink-0 text-[#a3ada6]" aria-hidden />}
      </Link>
      {item.pointsHref ? (
        <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
          <Link
            href={item.pointsHref}
            aria-label={`${item.title}のイベントポイント`}
            className="flex h-[48px] w-[50px] flex-col items-center justify-center gap-0.5 rounded-[12px] border border-[#ecd9a6] bg-[#fffaf0] text-[#8a6a1c] active:scale-[0.97]"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="text-[10px] font-bold leading-none">ポイント</span>
          </Link>
          <ChevronRight className="pointer-events-none h-4 w-4 shrink-0 text-[#a3ada6]" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}

const SERIF = ORG_SERIF;

/** 種類ごとの管理画面（申込者の確認・CSV など、一覧より細かい操作はここから） */
const KIND_PAGES: { href: string; label: string; kind: Kind }[] = [
  { href: "/organizer/events", label: "イベント管理", kind: "event" },
  { href: "/organizer/stores", label: "お店の管理", kind: "store" },
  { href: "/organizer/kitchen-cars", label: "キッチンカーの管理", kind: "kitchen" },
  { href: "/organizer/recruitments", label: "募集の管理", kind: "volunteer" },
];

/** 主催者：掲載管理（スマホ、見本「02_掲載管理」）。種類をまたいで1つの一覧にする */
export function OrganizerListingsMobile() {
  const [items, setItems] = useState<Listing[] | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<Kind | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    void Promise.all([
      getJson<DashboardResponse>("/api/organizer/dashboard", signal),
      getJson<{ stores?: StoreRecord[] }>("/api/organizer/stores", signal),
      getJson<RecruitmentDashboardResponse>("/api/organizer/recruitments-dashboard", signal),
    ]).then(([events, stores, recruitments]) => {
      if (signal.aborted) return;
      const all = [
        ...fromEvents(events),
        ...fromStores(stores?.stores ?? null),
        ...fromRecruitments(recruitments),
      ];
      // 公開中→下書き→終了の順（同じ状態の中は API の並びのまま）
      all.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      setItems(all);
    });
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter(
      (i) =>
        (tab === "all" || i.status === tab) &&
        (kindFilter === "all" || i.kind === kindFilter) &&
        (!q || i.title.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q))
    );
  }, [items, tab, query, kindFilter]);

  const counts = useMemo(() => {
    // 種類の絞り込みと検索の文字に合う件数（タブの状態だけは問わない）
    const q = query.trim().toLowerCase();
    const c: Record<Tab, number> = { all: 0, public: 0, draft: 0, ended: 0 };
    for (const i of items ?? []) {
      if (kindFilter !== "all" && i.kind !== kindFilter) continue;
      if (q && !i.title.toLowerCase().includes(q) && !i.sub.toLowerCase().includes(q)) continue;
      c.all += 1;
      c[i.status] += 1;
    }
    return c;
  }, [items, kindFilter, query]);

  const searching = searchOpen || query.length > 0;

  return (
    <div className="mx-auto w-full max-w-xl pb-6 tablet:max-w-[860px]">
      {/* 見出し1行：右に検索と種類の絞り込み。新しく掲載するのは下のナビの「＋」だけにする */}
      <header className="flex items-end justify-between gap-3 pt-1">
        <div className="min-w-0">
          <OrgEyebrow>LISTINGS</OrgEyebrow>
          <h1
            className="mt-0.5 flex items-baseline gap-2 text-[22px] font-bold tracking-[0.04em] text-[#163828]"
            style={{ fontFamily: SERIF }}
          >
            掲載管理
            {items ? (
              <span className="font-sans text-[13px] font-bold tracking-normal text-[#6b776f]">{items.length}件</span>
            ) : null}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-expanded={searching}
            aria-label="掲載を検索"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border border-[#e3ece5] bg-white text-[#1f5e3a] shadow-[0_2px_6px_rgba(22,56,40,0.05)]",
              searching && "border-[#1f6a42] bg-[#eaf4ed]"
            )}
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            aria-expanded={filterOpen}
            aria-label="種類で絞り込む"
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e3ece5] bg-white text-[#1f5e3a] shadow-[0_2px_6px_rgba(22,56,40,0.05)]",
              filterOpen && "border-[#1f6a42] bg-[#eaf4ed]"
            )}
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
            {kindFilter !== "all" && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e66b27]" aria-hidden />
            )}
          </button>
        </div>
      </header>

      {/* 状態の切り替え・検索・種類は、スクロールしても上に残す */}
      <div className="sticky top-[calc(var(--mg-mobile-top-header-h,52px)+env(safe-area-inset-top,0px))] z-10 -mx-4 mt-3 space-y-2 bg-white/70 px-4 pb-2.5 pt-2 backdrop-blur-md min-[900px]:static min-[900px]:mx-0 min-[900px]:px-0">
        <div role="tablist" aria-label="掲載の状態" className="flex gap-1 rounded-full bg-[#eef3ef] p-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-full text-[12.5px] font-bold transition",
                  active ? "bg-[#173f2c] text-[#f3e6bf] shadow-[0_3px_8px_rgba(14,42,29,0.25)]" : "text-[#5f6d64]"
                )}
              >
                {t.label}
                {items ? (
                  <span
                    className={cn(
                      "min-w-[18px] rounded-full px-1 text-[10.5px] leading-[16px]",
                      active ? "bg-[#c9a54e] text-[#0e2a1d]" : "bg-[#dfe8e1] text-[#5f6d64]"
                    )}
                  >
                    {counts[t.id]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {searching && (
          <label className="flex h-11 items-center gap-2 rounded-[14px] border border-[#e3ece5] bg-white px-3.5">
            <Search className="h-[18px] w-[18px] shrink-0 text-[#8a958d]" aria-hidden />
            <input
              type="search"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトル・場所で検索"
              aria-label="掲載を検索"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-[#163828] outline-none placeholder:text-[14px] placeholder:text-[#9aa49d]"
            />
          </label>
        )}

        {filterOpen && (
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-hide">
            {(["all", "event", "store", "kitchen", "volunteer"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                aria-pressed={kindFilter === k}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold",
                  kindFilter === k
                    ? "border-[#173f2c] bg-[#173f2c] text-[#f3e6bf]"
                    : "border-[#e3ece5] bg-white text-[#4f5d54]"
                )}
              >
                {k === "all" ? "すべての種類" : KIND_META[k].label}
              </button>
            ))}
          </div>
        )}
      </div>

      <section aria-label="掲載一覧" className="mt-1">
        {items === null ? (
          <div className="space-y-px overflow-hidden rounded-[20px] border border-[#ebeee8] bg-white">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="h-14 w-14 animate-pulse rounded-[14px] bg-[#e8ede4]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#e8ede4]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[#eef2ec]" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          items.length === 0 ? (
            <Link
              href="/organizer/new"
              className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-[#cfe0d4] bg-white px-4 py-7 text-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e6f3ea] text-[#1f6a42]">
                <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </span>
              <span className="text-[14px] font-bold text-[#1f6a42]">最初の掲載をはじめる</span>
              <span className="text-[12px] text-[#6b776f]">イベント・お店・キッチンカー・募集を載せられます</span>
            </Link>
          ) : (
            <p className="rounded-[20px] border border-dashed border-[#d6e3da] bg-white px-4 py-6 text-center text-[13px] text-[#6b776f]">
              条件に合う掲載はありません
            </p>
          )
        ) : (
          <ul className="divide-y divide-[#eef1ec] overflow-hidden rounded-[20px] border border-[#ebeee8] bg-white shadow-[0_3px_12px_rgba(22,56,40,0.05)] tablet:grid tablet:grid-cols-2 tablet:divide-y-0 tablet:[&>li]:border-b tablet:[&>li]:border-[#eef1ec] tablet:[&>li:nth-child(odd)]:border-r">
            {visible.map((item) => (
              <li key={item.id}>
                <ListingRow item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 種類ごとの管理画面（申込者の確認・CSV など、一覧より細かい操作） */}
      <section aria-labelledby="kind-pages" className="mt-6">
        <h2 id="kind-pages" className="mb-2 text-[12px] font-bold tracking-[0.04em] text-[#6b776f]">
          種類ごとの管理画面
        </h2>
        <ul className="grid grid-cols-2 gap-2 tablet:grid-cols-4">
          {KIND_PAGES.map(({ href, label, kind }) => {
            const { Icon, color, bg } = KIND_META[kind];
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex min-h-[48px] items-center gap-2 rounded-[14px] border border-[#ebeee8] bg-white px-2.5 py-2 active:bg-[#fafcf9]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: bg, color }}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-[12.5px] font-bold leading-tight text-[#163828]">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
