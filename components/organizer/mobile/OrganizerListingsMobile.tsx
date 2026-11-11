"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Gamepad2,
  Heart,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { DashboardResponse } from "@/app/api/organizer/dashboard/route";
import type { RecruitmentDashboardResponse } from "@/app/api/organizer/recruitments-dashboard/route";
import type { StoreRecord } from "@/lib/stores/types";
import type { OrganizerGame } from "@/lib/organizer/games";
import { EventThumbnail } from "@/components/event-thumbnail";
import { OrganizerPageTitle } from "@/components/organizer/mobile/OrganizerPageTitle";
import { cn } from "@/lib/utils";

type Kind = "event" | "store" | "kitchen" | "volunteer" | "game";
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
};

const KIND_META: Record<Kind, { label: string; Icon: LucideIcon }> = {
  event: { label: "イベント", Icon: CalendarDays },
  store: { label: "お店", Icon: Store },
  kitchen: { label: "キッチンカー", Icon: Truck },
  volunteer: { label: "募集", Icon: Heart },
  game: { label: "ゲーム", Icon: Gamepad2 },
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

function fromGames(games: OrganizerGame[] | null): Listing[] {
  return (games ?? []).map((g) => {
    const status: Status = g.status === "published" ? "public" : g.status === "draft" ? "draft" : "ended";
    return {
      id: `game-${g.id}`,
      kind: "game",
      title: g.name,
      imageUrl: null,
      status,
      statusLabel: status === "ended" ? "終了" : "",
      sub: joinSub("ゲーム", g.typeLabel, shortDate(g.startsAt)),
      metric: g.spotCount > 0 ? `スポット ${g.spotCount}か所` : null,
      href: `/organizer/games/${g.id}`,
    };
  });
}

function StatusBadge({ item }: { item: Listing }) {
  const label =
    item.status === "public" ? "公開中" : item.status === "draft" ? "下書き" : item.statusLabel || "終了";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
        item.status === "public" && "bg-[#e3f2e7] text-[#1f7a4a]",
        item.status === "draft" && "bg-[#fdf1d8] text-[#a26a10]",
        item.status === "ended" && "bg-[#eef0ec] text-[#6b776f]"
      )}
    >
      {label}
    </span>
  );
}

function ListingCard({ item }: { item: Listing }) {
  const { Icon } = KIND_META[item.kind];
  return (
    <Link
      href={item.href}
      className="flex items-stretch gap-3 rounded-[20px] border border-[#ebeee8] bg-white p-2.5 pr-3.5 shadow-[0_3px_10px_rgba(22,56,40,0.05)] active:bg-[#fafcf9]"
    >
      <span className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[14px] bg-[#eef3ef]">
        {item.imageUrl ? (
          <EventThumbnail imageUrl={item.imageUrl} alt="" rounded="none" fill placeholderSize="icon" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[#7fa08c]">
            <Icon className="h-8 w-8" aria-hidden />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col py-0.5">
        <span className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 text-[15px] font-bold leading-snug text-[#163828] [overflow-wrap:anywhere]">
            {item.title}
          </span>
          <StatusBadge item={item} />
        </span>
        <span className="mt-1 truncate text-[12px] text-[#6b776f]">{item.sub}</span>
        <span className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <span className="truncate text-[12.5px] text-[#4f5d54]">{item.metric ?? ""}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-[#1f7a4a]">
            <Pencil className="h-4 w-4" aria-hidden />
            編集
          </span>
        </span>
      </span>
    </Link>
  );
}

/** 種類ごとの管理画面（申込者の確認・CSV など、一覧より細かい操作はここから） */
const KIND_PAGES: { href: string; label: string; kind: Kind }[] = [
  { href: "/organizer/events", label: "イベント管理", kind: "event" },
  { href: "/organizer/stores", label: "お店の管理", kind: "store" },
  { href: "/organizer/kitchen-cars", label: "キッチンカーの管理", kind: "kitchen" },
  { href: "/organizer/recruitments", label: "募集の管理", kind: "volunteer" },
  { href: "/organizer/games", label: "ゲームの管理", kind: "game" },
];

/** 主催者：掲載管理（スマホ、見本「02_掲載管理」）。種類をまたいで1つの一覧にする */
export function OrganizerListingsMobile() {
  const [items, setItems] = useState<Listing[] | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<Kind | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    void Promise.all([
      getJson<DashboardResponse>("/api/organizer/dashboard", signal),
      getJson<{ stores?: StoreRecord[] }>("/api/organizer/stores", signal),
      getJson<RecruitmentDashboardResponse>("/api/organizer/recruitments-dashboard", signal),
      getJson<{ games?: OrganizerGame[] }>("/api/organizer/games", signal),
    ]).then(([events, stores, recruitments, games]) => {
      if (signal.aborted) return;
      const all = [
        ...fromEvents(events),
        ...fromStores(stores?.stores ?? null),
        ...fromRecruitments(recruitments),
        ...fromGames(games?.games ?? null),
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

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 pb-6">
      <OrganizerPageTitle
        title="掲載管理"
        subtitle="イベント・店舗・募集をまとめて管理"
        Icon={CalendarDays}
      />

      <Link
        href="/organizer/new"
        className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-gradient-to-b from-[#2f7d4e] to-[#1f6a42] text-[16px] font-bold text-white shadow-[0_6px_16px_rgba(22,56,40,0.22)] active:scale-[0.99]"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        新しく掲載する
      </Link>

      <div role="tablist" aria-label="掲載の状態" className="flex gap-1 rounded-full border border-[#e3ece5] bg-[#f3f6f2] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-[40px] flex-1 rounded-full text-[13px] font-bold transition",
              tab === t.id ? "bg-[#1f6a42] text-white shadow-[0_3px_8px_rgba(22,56,40,0.2)]" : "text-[#5f6d64]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="flex h-12 items-center gap-2 rounded-[16px] border border-[#e3ece5] bg-white pl-4 pr-1.5">
          <Search className="h-5 w-5 shrink-0 text-[#8a958d]" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル・掲載内容を検索"
            aria-label="掲載を検索"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[#163828] outline-none placeholder:text-[14px] placeholder:text-[#9aa49d]"
          />
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            aria-expanded={filterOpen}
            aria-label="種類で絞り込む"
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1f5e3a]",
              filterOpen && "bg-[#eaf4ed]"
            )}
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden />
            {kindFilter !== "all" && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#e66b27]" aria-hidden />
            )}
          </button>
        </label>
        {filterOpen && (
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {(["all", "event", "store", "kitchen", "volunteer", "game"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                aria-pressed={kindFilter === k}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold",
                  kindFilter === k
                    ? "border-[#1f6a42] bg-[#1f6a42] text-white"
                    : "border-[#e3ece5] bg-white text-[#4f5d54]"
                )}
              >
                {k === "all" ? "すべての種類" : KIND_META[k].label}
              </button>
            ))}
          </div>
        )}
      </div>

      <section aria-labelledby="listings-heading" className="space-y-3">
        <h2 id="listings-heading" className="text-[18px] font-bold text-[#163828]">
          掲載一覧{items ? `・${visible.length}件` : ""}
        </h2>
        {items === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[112px] animate-pulse rounded-[20px] bg-[#e8ede4]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="rounded-[18px] border border-dashed border-[#d6e3da] bg-white px-4 py-6 text-center text-[13px] text-[#6b776f]">
            {items.length === 0 ? "まだ掲載がありません。「新しく掲載する」から始めましょう。" : "条件に合う掲載はありません"}
          </p>
        ) : (
          <ul className="space-y-3">
            {visible.map((item) => (
              <li key={item.id}>
                <ListingCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="kind-pages" className="space-y-2 pt-2">
        <h2 id="kind-pages" className="text-[14px] font-bold text-[#163828]">
          種類ごとの管理画面
        </h2>
        <ul className="divide-y divide-[#eef1ec] overflow-hidden rounded-[18px] border border-[#ebeee8] bg-white">
          {KIND_PAGES.map(({ href, label, kind }) => {
            const { Icon } = KIND_META[kind];
            return (
              <li key={href}>
                <Link href={href} className="flex items-center gap-3 px-4 py-3 active:bg-[#fafcf9]">
                  <Icon className="h-5 w-5 shrink-0 text-[#2f7d4e]" aria-hidden />
                  <span className="min-w-0 flex-1 text-[14px] font-bold text-[#163828]">{label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#8a958d]" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
