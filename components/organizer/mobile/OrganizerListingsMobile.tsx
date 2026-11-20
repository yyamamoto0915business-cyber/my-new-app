"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ChevronRight,
  Plus,
  Search,
  ChevronDown,
  ExternalLink,
  LayoutGrid,
  MoreHorizontal,
  PenLine,
  X,
  Trash2,
  type LucideIcon,
  Archive,
  ArrowLeft,
} from "lucide-react";
import type { BillingSummary, DashboardEvent, DashboardResponse } from "@/app/api/organizer/dashboard/route";
import type { RecruitmentDashboardResponse } from "@/app/api/organizer/recruitments-dashboard/route";
import type { StoreRecord } from "@/lib/stores/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { cn } from "@/lib/utils";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";
import { EventDateTile, eventTiming, todayJst } from "@/components/organizer/mobile/event-date";
import { EventActionsSheet } from "@/components/organizer/mobile/EventActionsSheet";
import { LISTING_KINDS, LISTING_KIND_META, type ListingKind } from "@/components/organizer/mobile/listing-kinds";
import type { OrganizerGame } from "@/lib/organizer/games";

/** 掲載の種類（ゲームも、ほかの掲載と同じ一覧で管理する） */
type Kind = ListingKind;
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
  /** 公開中のときに見られる、利用者側のページ */
  publicHref: string;
  /** イベントだけ：日付（左の日付のカレンダーと「あと◯日」）と、押したときに出す操作のシートの対象 */
  event?: { id: string; date: string; endDate: string | null; status: DashboardEvent["status"] };
};

/** 種類ごとの色（写真がないときのアイコンの丸と、種類の文字に使う） */
const KIND_META = LISTING_KIND_META;
/** 種類のタイルに出す短い名前（3つ並べても切れないように） */
const TILE_LABEL: Record<string, string> = { "ボランティア募集": "ボランティア" };

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

function isArchivedEvent(e: DashboardEvent): boolean {
  return e.visibilityStatus === "archived";
}

/** イベント → 一覧の行（アーカイブしたものは別に分けるので、呼ぶ側で絞る） */
function fromEvents(events: DashboardEvent[]): Listing[] {
  return events.map((e) => {
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
      publicHref: `/events/${e.id}`,
      event: { id: e.id, date: e.date, endDate: e.endDate ?? null, status: e.status },
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
      publicHref: kitchen ? `/kitchen-cars/${s.id}` : `/stores/${s.id}`,
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
      sub: joinSub("ボランティア募集", shortDate(r.start_at)),
      metric: `応募 ${r.applicationCount}件`,
      href: `/organizer/recruitments/${r.id}`,
      publicHref: `/recruitments/${r.id}`,
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
      sub: joinSub("ゲーム", g.typeLabel, g.startsAt ? shortDate(g.startsAt.slice(0, 10)) : null),
      metric: g.eventTitle ? `${g.eventTitle}で使う` : null,
      href: `/organizer/games/${g.id}`,
      publicHref: g.joinPath || `/organizer/games/${g.id}`,
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
 * 1件ぶんの行（低くして1画面に多く並べる）。行全体は編集へのリンク。
 * イベントは左を日付のカレンダーにし、2行目に「あと◯日」。ポイントは右の小さな丸いボタン（リンクの入れ子にしないよう上に重ねる）。
 * 状態の札は2行目の頭に置いて、題名の左端をそろえる。
 */
function ListingRow({
  item,
  today,
  onOpenEvent,
  onMore,
  showKind = false,
}: {
  item: Listing;
  today: string;
  onOpenEvent: (eventId: string) => void;
  /** 種類が混ざるまとまり（終わったもの）では、行に種類の名前を出す */
  showKind?: boolean;
  /** イベント以外：右の「…」で、編集・公開ページのメニューを出す */
  onMore?: (item: Listing) => void;
}) {
  const { label: kindLabel, Icon, color, bg } = KIND_META[item.kind];
  const sub = item.sub.startsWith(kindLabel) ? item.sub.slice(kindLabel.length).replace(/^・/, "") : item.sub;
  const timing = item.event ? eventTiming(today, item.event.date, item.event.endDate) : null;
  const dim = (timing?.past ?? false) || item.status === "ended";
  const body = (
    <>
        {item.event && timing ? (
          <EventDateTile date={item.event.date} status={item.event.status} past={timing.past} />
        ) : (
          <span
            className="relative h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[12px]"
            style={item.imageUrl ? undefined : { background: bg, color }}
          >
            {item.imageUrl ? (
              <EventThumbnail imageUrl={item.imageUrl} alt="" rounded="none" fill placeholderSize="icon" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            )}
          </span>
        )}
        <span className="min-w-0 flex-1">
          {/* palt：「【」などの左の空きを詰めて、題名の左端をそろえる */}
          <span
            className={cn(
              "block truncate text-[14px] font-semibold [font-feature-settings:'palt']",
              dim ? "text-[#7b877f]" : "text-[#163828]"
            )}
          >
            {item.title}
          </span>
          <span className="mt-[3px] flex items-center gap-1.5 text-[12px] text-[#7b877f]">
            <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold", STATUS_STYLE[item.status])}>
              {statusText(item)}
            </span>
            <span className="min-w-0 truncate">
              {showKind ? (
                <span className="font-bold" style={{ color }}>
                  {kindLabel}・
                </span>
              ) : null}
              {item.event ? (
                <>
                  {timing?.multiDay ? `〜${timing.endLabel}・` : ""}
                  {item.metric}
                  {timing ? <span className={cn("font-bold", timing.tag.textClassName)}>・{timing.tag.label}</span> : null}
                </>
              ) : (
                // 種類は見出し（または上の種類の名前）で分かるので、ここには書かない
                <>{[sub, item.metric].filter(Boolean).join("・")}</>
              )}
            </span>
          </span>
        </span>
      {item.event || !onMore ? <ChevronRight className="h-4 w-4 shrink-0 text-[#a3ada6]" aria-hidden /> : null}
    </>
  );
  const rowClass = "flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-[#f6f9f5]";
  // イベントは、押すと操作のシート（公開・スタッフ募集・編集・ポイントなど）を出す。ほかは編集の画面へ
  if (item.event) {
    const eventId = item.event.id;
    return (
      <button type="button" onClick={() => onOpenEvent(eventId)} className={rowClass} aria-haspopup="dialog">
        {body}
      </button>
    );
  }
  if (!onMore) {
    return (
      <Link href={item.href} className={rowClass}>
        {body}
      </Link>
    );
  }
  return (
    <div className="relative">
      <Link href={item.href} className={cn(rowClass, "pr-[52px]")}>
        {body}
      </Link>
      <button
        type="button"
        onClick={() => onMore(item)}
        aria-label={`${item.title}のメニュー`}
        className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[#8a958d] active:bg-[#eef3ef]"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}

/** お店・キッチンカー・募集の行の「…」から出すメニュー（下から出る）。イベントは行を押すと操作のシート（EventActionsSheet） */
function ListingMenu({ item, onClose, onDeleted }: { item: Listing | null; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  /** 下書きのゲームは、ここから消せる（下書きがたまっても一覧をすっきりさせる） */
  const canDelete = item?.kind === "game" && item.status === "draft";
  const handleDelete = async () => {
    if (!item || deleting) return;
    if (!window.confirm(`「${item.title}」を削除しますか？元に戻せません。`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/organizer/games/${item.id.replace(/^game-/, "")}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        window.alert(json.error ?? "削除に失敗しました");
        return;
      }
      onClose();
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);
  if (!item || typeof document === "undefined") return null;
  const actions: { href: string; label: string; sub: string; Icon: LucideIcon; tone: string; external?: boolean }[] = [
    { href: item.href, label: "編集する", sub: "内容・写真・公開の設定", Icon: PenLine, tone: "bg-[#eaf4ed] text-[#1f6a42]" },
    ...(item.status === "public"
      ? [{ href: item.publicHref, label: "公開ページを見る", sub: "利用者に見えている画面", Icon: ExternalLink, tone: "bg-[#eef1f5] text-[#3d5a80]", external: true }]
      : []),
  ];
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/35" role="dialog" aria-modal="true" aria-label={`${item.title}のメニュー`} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-[22px] bg-[#fbfcf9] px-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#d5dbd6]" aria-hidden />
        <div className="mb-2 flex items-start gap-2">
          <p className="min-w-0 flex-1 pt-2 text-[15px] font-bold leading-snug text-[#163828] [font-feature-settings:'palt']">{item.title}</p>
          <button type="button" onClick={onClose} aria-label="閉じる" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#5f6d64]">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <ul className="divide-y divide-[#eef1ec] overflow-hidden rounded-[16px] border border-[#ebeee8] bg-white">
          {actions.map((a) => (
            <li key={a.label}>
              <Link
                href={a.href}
                onClick={onClose}
                {...(a.external ? { target: "_blank", rel: "noopener" } : {})}
                className="flex min-h-[56px] items-center gap-3 px-3.5 py-2.5 active:bg-[#f6f9f5]"
              >
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", a.tone)}>
                  <a.Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-[#163828]">{a.label}</span>
                  <span className="block text-[11.5px] text-[#7b877f]">{a.sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {canDelete ? (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="mt-2 flex min-h-[52px] w-full items-center gap-3 rounded-[16px] border border-[#f3d6cc] bg-white px-3.5 text-left active:bg-[#fff7f2] disabled:opacity-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fde9e3] text-[#b5482a]" aria-hidden>
              <Trash2 className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-bold text-[#a8481c]">{deleting ? "削除しています…" : "下書きを削除する"}</span>
              <span className="block text-[11.5px] text-[#7b877f]">元に戻せません</span>
            </span>
          </button>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

/**
 * 一覧のまとまり。どれがどの種類か分かるよう、種類ごとに分ける：
 * イベント（開催中・これから）／お店／キッチンカー／ボランティア募集／終わったもの（種類が混ざるので行に種類を出す）
 */
type GroupId = "upcoming" | "store" | "kitchen" | "volunteer" | "game" | "ended";
// 期限のあるもの（イベント・ボランティア募集・ゲーム）→ ずっと載せるもの（お店・キッチンカー）→ 終わったもの
const GROUP_ORDER: GroupId[] = ["upcoming", "volunteer", "game", "store", "kitchen", "ended"];
/** note：見出しの横の札。期限があるか（いつまで載るか）が一目で分かるように */
const GROUP_META: Record<GroupId, { title: string; en: string; kind: Kind | null; note: string | null; always?: boolean }> = {
  upcoming: { title: "イベント", en: "EVENTS", kind: "event", note: "開催日まで" },
  volunteer: { title: "ボランティア募集", en: "VOLUNTEERS", kind: "volunteer", note: "締切まで" },
  store: { title: "お店", en: "SHOPS", kind: "store", note: "期限なし・ずっと掲載", always: true },
  kitchen: { title: "キッチンカー", en: "KITCHEN CARS", kind: "kitchen", note: "期限なし・ずっと掲載", always: true },
  game: { title: "ゲーム", en: "GAMES", kind: "game", note: "開催期間まで" },
  ended: { title: "終わったもの", en: "ARCHIVE", kind: null, note: null },
};

function groupOf(item: Listing, today: string): GroupId {
  // お店・キッチンカーは期限なしでずっと載せるもの。非公開にしても「終わったもの」には入れない
  if (item.kind === "store" || item.kind === "kitchen") return item.kind;
  if (item.status === "ended") return "ended";
  if (item.event) return (item.event.endDate ?? item.event.date).slice(0, 10) < today ? "ended" : "upcoming";
  return item.kind === "event" ? "upcoming" : item.kind;
}

const SERIF = ORG_SERIF;

/** 種類ごとの管理画面（申込者の確認・CSV など、一覧より細かい操作はここから） */
const KIND_PAGES: { href: string; label: string; kind: Kind }[] = [
  { href: "/organizer/stores", label: "お店の管理", kind: "store" },
  { href: "/organizer/kitchen-cars", label: "キッチンカーの管理", kind: "kitchen" },
  { href: "/organizer/recruitments", label: "ボランティア募集の管理", kind: "volunteer" },
  { href: "/organizer/games", label: "ゲームの管理", kind: "game" },
];

/** 主催者：掲載管理（スマホ、見本「02_掲載管理」）。種類をまたいで1つの一覧にする */
export function OrganizerListingsMobile() {
  const [items, setItems] = useState<Listing[] | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<Kind | "all">("all");
  const [pagesOpen, setPagesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  /** お店・募集の行の「…」で開いているもの */
  const [menuItem, setMenuItem] = useState<Listing | null>(null);
  const closeMenu = useCallback(() => setMenuItem(null), []);
  /** 「終わったもの」を開いているか（ふだんはたたむ） */
  const [endedOpen, setEndedOpen] = useState(false);
  /** 上に残る切り替えの高さ（まとまりの見出しを、その下に残すため） */
  const barRef = useRef<HTMLDivElement>(null);
  const [barH, setBarH] = useState(0);
  const [today] = useState(todayJst);
  const [rawEvents, setRawEvents] = useState<DashboardEvent[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [archiveMode, setArchiveMode] = useState(false);
  const [sheetEventId, setSheetEventId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((n) => n + 1), []);
  const closeSheet = useCallback(() => setSheetEventId(null), []);

  // イベント管理（スマホ）から移ってきたとき（?kind=event）は、イベントだけに絞って開く
  useEffect(() => {
    const kind = new URLSearchParams(window.location.search).get("kind");
    if (kind && (LISTING_KINDS as string[]).includes(kind)) {
      setKindFilter(kind as Kind);
    }
  }, []);

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
      setRawEvents(events?.events ?? []);
      setBillingSummary(events?.billingSummary ?? null);
      const all = [
        ...fromEvents((events?.events ?? []).filter((e) => !isArchivedEvent(e))),
        ...fromStores(stores?.stores ?? null),
        ...fromRecruitments(recruitments),
        ...fromGames(games?.games ?? null),
      ];
      // 公開中→下書き→終了の順。同じ状態の中で、イベントは「開催中・これからの日付が近い順 → 日付の過ぎたもの（新しい順）」
      // （お店・募集など日付のないものは API の並びのまま）
      const today = todayJst();
      const lastDay = (i: Listing) => (i.event ? (i.event.endDate ?? i.event.date).slice(0, 10) : null);
      const isPast = (i: Listing) => {
        const d = lastDay(i);
        return d !== null && d < today;
      };
      all.sort((a, b) => {
        const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (s !== 0) return s;
        const p = Number(isPast(a)) - Number(isPast(b));
        if (p !== 0) return p;
        if (!a.event || !b.event) return 0;
        return isPast(a) ? b.event.date.localeCompare(a.event.date) : a.event.date.localeCompare(b.event.date);
      });
      setItems(all);
    });
    return () => controller.abort();
  }, [reloadKey]);

  // 切り替えの部分の高さを追う（アーカイブの画面から戻ったときに作り直されるので、そのたびに見張り直す）
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setBarH(el.offsetHeight));
    ro.observe(el);
    setBarH(el.offsetHeight);
    return () => ro.disconnect();
  }, [archiveMode]);

  const archivedEvents = useMemo(() => rawEvents.filter(isArchivedEvent), [rawEvents]);
  const sheetEvent = sheetEventId ? rawEvents.find((e) => e.id === sheetEventId) ?? null : null;

  /** タブで使う状態：日付の過ぎたイベントは、下書きでも「終了」に数える（下の「終わったもの」とそろえる） */
  const tabStatus = (i: Listing): Status => (groupOf(i, today) === "ended" ? "ended" : i.status);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter(
      (i) =>
        (tab === "all" || tabStatus(i) === tab) &&
        (kindFilter === "all" || i.kind === kindFilter) &&
        (!q || i.title.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabStatus は today だけで決まる
  }, [items, tab, query, kindFilter, today]);

  const counts = useMemo(() => {
    // 種類の絞り込みと検索の文字に合う件数（タブの状態だけは問わない）
    const q = query.trim().toLowerCase();
    const c: Record<Tab, number> = { all: 0, public: 0, draft: 0, ended: 0 };
    for (const i of items ?? []) {
      if (kindFilter !== "all" && i.kind !== kindFilter) continue;
      if (q && !i.title.toLowerCase().includes(q) && !i.sub.toLowerCase().includes(q)) continue;
      c.all += 1;
      c[tabStatus(i)] += 1;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabStatus は today だけで決まる
  }, [items, kindFilter, query, today]);

  const kindCounts = useMemo(() => {
    // 状態のタブと検索の文字に合う、種類ごとの件数
    const q = query.trim().toLowerCase();
    const c: Record<Kind | "all", number> = { all: 0, event: 0, store: 0, kitchen: 0, volunteer: 0, game: 0 };
    for (const i of items ?? []) {
      if (tab !== "all" && tabStatus(i) !== tab) continue;
      if (q && !i.title.toLowerCase().includes(q) && !i.sub.toLowerCase().includes(q)) continue;
      c.all += 1;
      c[i.kind] += 1;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabStatus は today だけで決まる
  }, [items, tab, query, today]);

  /** まとまりごとに分ける（中の並びは、これから＝日付の近い順・終わったもの＝新しい順） */
  const groups = useMemo(() => {
    const g: Record<GroupId, Listing[]> = { upcoming: [], store: [], kitchen: [], volunteer: [], game: [], ended: [] };
    for (const i of visible) g[groupOf(i, today)].push(i);
    const lastDay = (i: Listing) => (i.event ? (i.event.endDate ?? i.event.date).slice(0, 10) : "");
    g.upcoming.sort((a, b) => (a.event?.date ?? "").localeCompare(b.event?.date ?? ""));
    g.ended.sort((a, b) => lastDay(b).localeCompare(lastDay(a)));
    return GROUP_ORDER.filter((id) => g[id].length > 0).map((id) => ({ id, items: g[id] }));
  }, [visible, today]);

  const searching = searchOpen || query.length > 0;
  /** 検索中・「終了」のタブ・終わったものしかないときは、たたまずに出す */
  const endedShown = endedOpen || searching || tab === "ended" || groups.every((gr) => gr.id === "ended");

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
          {archivedEvents.length > 0 || archiveMode ? (
            <button
              type="button"
              onClick={() => setArchiveMode((v) => !v)}
              aria-pressed={archiveMode}
              aria-label={`アーカイブしたイベント ${archivedEvents.length}件`}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e3ece5] bg-white text-[#1f5e3a] shadow-[0_2px_6px_rgba(22,56,40,0.05)]",
                archiveMode && "border-[#173f2c] bg-[#173f2c] text-[#f3e6bf]"
              )}
            >
              <Archive className="h-[18px] w-[18px]" aria-hidden />
              <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-[#c9a54e] px-1 text-[9.5px] font-bold leading-[16px] text-[#0e2a1d]">
                {archivedEvents.length}
              </span>
            </button>
          ) : null}
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
            onClick={() => setPagesOpen((v) => !v)}
            aria-expanded={pagesOpen}
            aria-label="種類ごとの管理画面"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border border-[#e3ece5] bg-white text-[#1f5e3a] shadow-[0_2px_6px_rgba(22,56,40,0.05)]",
              pagesOpen && "border-[#1f6a42] bg-[#eaf4ed]"
            )}
          >
            <LayoutGrid className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
      </header>

      {/* 種類ごとの管理画面（申込者の確認・CSV など、一覧より細かい操作）。右上のボタンで開く */}
      {pagesOpen ? (
        <nav aria-label="種類ごとの管理画面" className="mt-3 rounded-[18px] border border-[#ebeee8] bg-white p-2 shadow-[0_3px_12px_rgba(22,56,40,0.05)]">
          <p className="px-1.5 pb-1.5 pt-0.5 text-[11.5px] font-bold text-[#6b776f]">種類ごとの管理画面（申込者の確認・CSV など）</p>
          <ul className="grid grid-cols-2 gap-1.5 tablet:grid-cols-4">
            {KIND_PAGES.map(({ href, label, kind }) => {
              const { Icon, color, bg } = KIND_META[kind];
              return (
                <li key={href}>
                  <Link href={href} className="flex min-h-[44px] flex-col items-start gap-1 rounded-[12px] bg-[#f7f9f6] px-2.5 py-2 active:bg-[#eef3ef] tablet:flex-row tablet:items-center tablet:gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: bg, color }}>
                      <Icon className="h-[15px] w-[15px]" aria-hidden />
                    </span>
                    <span className="min-w-0 text-[12px] font-bold leading-tight text-[#163828]">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {archiveMode ? (
        <section aria-label="アーカイブしたイベント" className="mt-3">
          <button
            type="button"
            onClick={() => setArchiveMode(false)}
            className="mb-2 inline-flex min-h-[40px] items-center gap-1 text-[13px] font-bold text-[#173f2c]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            掲載一覧にもどる
          </button>
          <p className="mb-2 text-[12px] leading-relaxed text-[#6b776f]">
            アーカイブしたイベントです。押すと、下書きに戻す（復元）か、完全に削除できます。
          </p>
          {archivedEvents.length === 0 ? (
            <p className="rounded-[20px] border border-dashed border-[#d6e3da] bg-white px-4 py-6 text-center text-[13px] text-[#6b776f]">
              アーカイブしたイベントはありません
            </p>
          ) : (
            <ul className="divide-y divide-[#eef1ec] overflow-hidden rounded-[20px] border border-[#ebeee8] bg-white">
              {fromEvents(archivedEvents).map((item) => (
                <li key={item.id}>
                  <ListingRow item={item} today={today} onOpenEvent={setSheetEventId} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
      {/* 状態の切り替え・検索・種類は、スクロールしても上に残す */}
      <div
        ref={barRef}
        className="sticky top-[calc(var(--mg-mobile-top-header-h,52px)+env(safe-area-inset-top,0px))] z-20 -mx-4 mt-3 space-y-2 bg-[#f9f9f6]/85 px-4 pb-2.5 pt-2 backdrop-blur-md min-[900px]:static min-[900px]:mx-0 min-[900px]:px-0"
      >
        {/* 種類（いちばん上の切り替え）。6つを3つずつ2段のタイルにして、名前と件数を横に並べる（1行だと窮屈だった） */}
        <div role="tablist" aria-label="種類" className="grid grid-cols-3 gap-1.5 tablet:grid-cols-6">
          {(["all", ...LISTING_KINDS] as const).map((k) => {
            const on = kindFilter === k;
            const meta = k === "all" ? null : KIND_META[k];
            const Icon = meta ? meta.Icon : LayoutGrid;
            const n = kindCounts[k];
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setKindFilter(k)}
                className={cn(
                  "flex min-h-[46px] min-w-0 items-center gap-1.5 overflow-hidden rounded-[14px] border pl-2 pr-1 text-left transition active:scale-[0.97]",
                  on
                    ? "border-[#173f2c] bg-[#173f2c] text-[#f6ebc8] shadow-[0_4px_10px_rgba(14,42,29,0.2)]"
                    : "border-[#ebeee8] bg-white text-[#1f2a24] shadow-[0_1px_4px_rgba(22,56,40,0.04)]"
                )}
              >
                <span
                  className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
                  style={on ? { background: "rgba(246,235,200,0.16)", color: "#f6ebc8" } : meta ? { background: meta.bg, color: meta.color } : { background: "#eef3ef", color: "#173f2c" }}
                  aria-hidden
                >
                  <Icon className="h-[13px] w-[13px]" />
                </span>
                {/* 名前は切らずに出し、件数はその下に小さく（横に並べると長い名前と重なった） */}
                <span className="min-w-0 flex-1">
                  <span className="block whitespace-nowrap text-[11.5px] font-bold leading-tight tracking-[-0.06em] max-[369px]:text-[10.5px] min-[400px]:text-[12.5px] min-[400px]:tracking-[-0.03em]">
                    {meta ? TILE_LABEL[meta.label] ?? meta.label : "すべて"}
                  </span>
                  {items ? (
                    <span className={cn("block text-[10.5px] font-bold leading-tight tabular-nums", on ? "text-[#e6d29b]" : "text-[#9aa29c]")}>
                      {n}件
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        {/* 状態（選んだ種類の中での小さな切り替え） */}
        <div role="tablist" aria-label="掲載の状態" className="flex items-center gap-1">
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
                  "flex min-h-[32px] items-center gap-1 rounded-full px-3 text-[12px] font-bold transition",
                  active ? "bg-[#e9efe9] text-[#173f2c] ring-1 ring-[#c9d8cd]" : "text-[#6b776f]"
                )}
              >
                {t.label}
                {items ? <span className={cn("tabular-nums text-[11px]", active ? "text-[#a3812f]" : "text-[#9aa49d]")}>{counts[t.id]}</span> : null}
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
              <span className="text-[12px] text-[#6b776f]">イベント・お店・キッチンカー・ボランティア募集・ゲームを載せられます</span>
            </Link>
          ) : (
            <p className="rounded-[20px] border border-dashed border-[#d6e3da] bg-white px-4 py-6 text-center text-[13px] text-[#6b776f]">
              条件に合う掲載はありません
            </p>
          )
        ) : (
          <div className="space-y-5">
            {groups.map(({ id, items: list }) => {
              const meta = GROUP_META[id];
              const folded = id === "ended" && !endedShown;
              return (
                <section key={id} aria-labelledby={`group-${id}`}>
                  {/* まとまりの見出し：上に残る切り替えのすぐ下に残す */}
                  <div
                    className="sticky z-10 -mx-4 flex items-end gap-2 bg-[#f9f9f6]/90 px-5 pb-1.5 pt-2 backdrop-blur-md min-[900px]:static min-[900px]:mx-0 min-[900px]:px-1"
                    style={{ top: `calc(var(--mg-mobile-top-header-h,52px) + env(safe-area-inset-top,0px) + ${barH}px)` }}
                  >
                    {meta.kind ? (
                      <span
                        className="mb-[1px] flex h-6 w-6 shrink-0 items-center justify-center self-center rounded-full"
                        style={{ background: KIND_META[meta.kind].bg, color: KIND_META[meta.kind].color }}
                        aria-hidden
                      >
                        {(() => {
                          const KindIcon = KIND_META[meta.kind].Icon;
                          return <KindIcon className="h-[13px] w-[13px]" />;
                        })()}
                      </span>
                    ) : null}
                    <h2 id={`group-${id}`} className="text-[15px] font-semibold tracking-[0.06em] text-[#173f2c]" style={{ fontFamily: SERIF }}>
                      {meta.title}
                    </h2>
                    <span className="pb-[2px] text-[11.5px] font-bold tabular-nums text-[#a3812f]">{list.length}</span>
                    {meta.note ? (
                      <span
                        className={cn(
                          "mb-[1px] shrink-0 self-center rounded-full px-2 py-[2px] text-[10.5px] font-bold",
                          meta.always ? "bg-[#e6f3ea] text-[#1f6a42]" : "bg-[#fdf1e4] text-[#b0641f]"
                        )}
                      >
                        {meta.always ? "∞ " : "⏱ "}
                        {meta.note}
                      </span>
                    ) : null}
                    <span className="mb-[7px] h-px flex-1 bg-gradient-to-r from-[#e6d6a8] to-transparent" aria-hidden />
                    {meta.note ? null : (
                      <span className="pb-[2px] text-[9px] font-semibold tracking-[0.22em] text-[#b8a26a]">{meta.en}</span>
                    )}
                  </div>
                  {folded ? (
                    <button
                      type="button"
                      onClick={() => setEndedOpen(true)}
                      className="flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-[18px] border border-dashed border-[#d9dfd8] bg-white/60 text-[13px] font-bold text-[#5f6d64]"
                    >
                      終わった{list.length}件を見る
                      <ChevronDown className="h-4 w-4" aria-hidden />
                    </button>
                  ) : (
                    <ul
                      className={cn(
                        "divide-y divide-[#eef1ec] overflow-hidden rounded-[20px] border border-[#ebeee8] bg-white shadow-[0_3px_12px_rgba(22,56,40,0.05)]",
                        // 種類のまとまりは、左に種類の色の線（終わったものは種類が混ざるので付けない）
                        meta.kind && "border-l-[3px]",
                        // タブレットは2列。1件だけのときは横幅いっぱい（右半分が空かないように）
                        list.length > 1 &&
                          "tablet:grid tablet:grid-cols-2 tablet:divide-y-0 tablet:[&>li]:border-b tablet:[&>li]:border-[#eef1ec] tablet:[&>li:nth-child(odd)]:border-r"
                      )}
                      style={meta.kind ? { borderLeftColor: KIND_META[meta.kind].color } : undefined}
                    >
                      {list.map((item) => (
                        <li key={item.id}>
                          <ListingRow
                            item={item}
                            today={today}
                            onOpenEvent={setSheetEventId}
                            onMore={setMenuItem}
                            showKind={!meta.kind}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>

        </>
      )}

      <ListingMenu item={menuItem} onClose={closeMenu} onDeleted={reload} />
      {sheetEvent ? (
        <EventActionsSheet
          event={sheetEvent}
          billingSummary={billingSummary}
          archiveBoxMode={isArchivedEvent(sheetEvent)}
          onClose={closeSheet}
          onRefresh={reload}
        />
      ) : null}
    </div>
  );
}
