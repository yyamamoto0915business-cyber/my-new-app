"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { InboxItem } from "@/lib/inbox-queries";
import { CalendarDays, ChevronDown, Heart, MessageCircle } from "lucide-react";
import { safeDisplayName } from "@/lib/safe-display-name";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";
import { LoginRequiredPanel } from "@/components/auth/LoginRequiredPanel";
import { isAbortLikeError } from "@/lib/is-abort-like-error";
import { resolveAvatarUrlByRole } from "@/lib/profile-avatar";
import {
  isOrganizerConversation,
  messagesBasePath,
  messagesScopeFromPath,
} from "@/lib/messages-scope";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
const API_CREDENTIALS: RequestInit = { credentials: "include" };

const C = {
  bg: "#f8f7f4",
  surface: "#ffffff",
  border: "#e8e3db",
  border2: "#eeebe4",
  t1: "#19170f",
  t2: "#5a5448",
  t3: "#9e9688",
  green: "#2e8a5a",
  greenL: "#eaf4f0",
} as const;

/** h は使っていない（主催の会話は主催者のチャットに分けた）。op/ov は主催者のチャットの「参加者」「ボランティア」 */
type FilterId = "all" | "unread" | "h" | "v" | "p" | "f" | "op" | "ov";

function formatRel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "たった今";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 172800000) return "昨日";
  if (diff < 604800000) return "先週";
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

/** 相手の呼び名。メールアドレスは出さない（表示名がメールのままの人もいるので、そのときは「参加者さん」など） */
function getName(item: InboxItem): string {
  const fallback =
    item.my_role === "organizer"
      ? item.conversation_kind === "general"
        ? "応募者さん"
        : "参加者さん"
      : "主催者";
  return safeDisplayName(item.other_display_name, fallback);
}

function relationLabel(item: InboxItem): string {
  if (item.conversation_kind === "follow_dm") return "フォロー";
  if (item.conversation_kind === "general") return "手伝い";
  return "参加";
}

function isFollowChat(item: InboxItem): boolean {
  return item.conversation_kind === "follow_dm";
}

function itemMatchesFilter(item: InboxItem, filter: FilterId): boolean {
  if (filter === "all") return true;
  if (filter === "unread") return item.unread_count > 0;
  if (filter === "op") return isOrganizerConversation(item) && item.conversation_kind !== "general";
  if (filter === "ov") return isOrganizerConversation(item) && item.conversation_kind === "general";
  if (filter === "f") return isFollowChat(item);
  if (isFollowChat(item)) return false;
  if (filter === "h") return item.my_role === "organizer";
  if (filter === "v") return item.my_role === "volunteer" && item.conversation_kind === "general";
  return item.my_role === "volunteer" && item.conversation_kind !== "general";
}

function avatarUrlFor(item: InboxItem): string | null {
  return resolveAvatarUrlByRole(
    {
      avatar_url: item.other_avatar_url,
      participant_avatar_url: item.other_participant_avatar_url,
      organizer_avatar_url: item.other_organizer_avatar_url,
    },
    item.my_role === "organizer" ? "participant" : "organizer"
  );
}

function initials(name: string): string {
  const compact = name.trim().replace(/\s+/g, "");
  return (compact.slice(0, 1) || "?").toUpperCase();
}

/** 主催者のチャットの1行：名前・最後のひとこと・何の会話か（イベント名の札）・未読の数 */
function OrganizerPersonRow({ item, activeId, basePath }: { item: InboxItem; activeId?: string; basePath: string }) {
  const name = getName(item);
  const active = item.conversation_id === activeId;
  const unread = item.unread_count > 0;
  const photo = avatarUrlFor(item);
  const volunteer = item.conversation_kind === "general";
  return (
    <Link
      href={`${basePath}/${item.conversation_id}`}
      className={`mx-3 mb-2 flex items-center gap-3 rounded-[18px] border px-3.5 py-3 no-underline shadow-[0_1px_4px_rgba(23,63,44,0.05)] active:bg-[#f7f5ee] ${unread ? "border-[#d9bc6e] bg-white" : "border-[#ece8dc] bg-white"} ${active ? "ring-1 ring-[#173f2c]" : ""}`}
    >
      {/* 顔写真がない人は、呼び名の頭の文字ではなく、会話の種類のアイコン（参加＝カレンダー、ボランティア＝ハート） */}
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ${volunteer ? "bg-[#fbe9f0] text-[#c0507a]" : "bg-[#fdf1e4] text-[#c7742c]"}`}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : volunteer ? (
          <Heart className="h-5 w-5" aria-hidden />
        ) : (
          <CalendarDays className="h-5 w-5" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={`min-w-0 flex-1 truncate text-[14.5px] text-[#1f2a24] ${unread ? "font-bold" : "font-semibold"}`}>{name}</span>
          <span className={`shrink-0 text-[11px] ${unread ? "font-bold text-[#173f2c]" : "text-[#9aa29c]"}`}>
            {item.last_message_at ? formatRel(item.last_message_at) : ""}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-[13px] ${unread ? "font-medium text-[#1f2a24]" : "text-[#7b877f]"}`}>
            {item.last_message_content ?? "まだメッセージはありません"}
          </span>
          {unread ? (
            <span className="min-w-[20px] shrink-0 rounded-full bg-[#173f2c] px-1.5 text-center text-[11px] font-bold leading-[20px] text-[#f6ebc8]">
              {item.unread_count > 99 ? "99+" : item.unread_count}
            </span>
          ) : null}
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5">
          <span
            className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold ${volunteer ? "bg-[#fbe9f0] text-[#c0507a]" : "bg-[#fdf1e4] text-[#b0641f]"}`}
          >
            {volunteer ? "ボランティア" : "参加"}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[#5f6d64]">
            {item.event_title ?? item.topic_title ?? (volunteer ? "ボランティアの相談" : "イベントの相談")}
          </span>
          {/* 返事のようす：相手からが最後なら「返事待ち」、自分からなら「返信済み」 */}
          {item.last_message_at && !unread ? (
            item.last_message_from_me ? (
              <span className="shrink-0 text-[10.5px] font-semibold text-[#9aa29c]">返信済み</span>
            ) : (
              <span className="shrink-0 rounded-full bg-[#fbf3e1] px-1.5 py-px text-[10px] font-bold text-[#a3812f]">返事待ち</span>
            )
          ) : null}
        </span>
      </span>
    </Link>
  );
}

/** 利用者のチャットの1行：主催者のチャットと同じカードの形。会話の種類（参加・手伝い・フォロー）を色で見分ける */
function PersonRow({ item, activeId, basePath }: { item: InboxItem; activeId?: string; basePath: string }) {
  const name = getName(item);
  const active = item.conversation_id === activeId;
  const unread = item.unread_count > 0;
  const photo = avatarUrlFor(item);
  const kind = isFollowChat(item) ? "follow" : item.conversation_kind === "general" ? "help" : "join";
  const tone =
    kind === "follow"
      ? { av: "bg-[#e8f1ec] text-[#2d6b4a]", chip: "bg-[#e8f1ec] text-[#2d6b4a]" }
      : kind === "help"
        ? { av: "bg-[#fbe9f0] text-[#c0507a]", chip: "bg-[#fbe9f0] text-[#c0507a]" }
        : { av: "bg-[#fdf1e4] text-[#c7742c]", chip: "bg-[#fdf1e4] text-[#b0641f]" };
  const topic = kind === "follow" ? null : (item.event_title ?? item.topic_title ?? null);
  return (
    <Link
      href={`${basePath}/${item.conversation_id}`}
      className={`mx-3 mb-2 flex items-center gap-3 rounded-[18px] border px-3.5 py-3 no-underline shadow-[0_1px_4px_rgba(23,63,44,0.05)] active:bg-[#f7f5ee] ${unread ? "border-[#d9bc6e] bg-white" : "border-[#ece8dc] bg-white"} ${active ? "ring-1 ring-[#173f2c]" : ""}`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-[17px] font-bold ${tone.av}`}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          initials(name)
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={`min-w-0 flex-1 truncate text-[14.5px] text-[#1f2a24] ${unread ? "font-bold" : "font-semibold"}`}>{name}</span>
          <span className={`shrink-0 text-[11px] ${unread ? "font-bold text-[#173f2c]" : "text-[#9aa29c]"}`}>
            {item.last_message_at ? formatRel(item.last_message_at) : ""}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-[13px] ${unread ? "font-medium text-[#1f2a24]" : "text-[#7b877f]"}`}>
            {item.last_message_content ?? "まだメッセージはありません"}
          </span>
          {unread ? (
            <span className="min-w-[20px] shrink-0 rounded-full bg-[#173f2c] px-1.5 text-center text-[11px] font-bold leading-[20px] text-[#f6ebc8]">
              {item.unread_count > 99 ? "99+" : item.unread_count}
            </span>
          ) : null}
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5">
          <span className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold ${tone.chip}`}>{relationLabel(item)}</span>
          {topic ? <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[#5f6d64]">{topic}</span> : null}
        </span>
      </span>
    </Link>
  );
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useSupabaseUser();
  const authRequired = !user && !AUTH_DISABLED;
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  /** 主催者のチャット：やり取りのない会話（たたんでおく）を開いているか */
  const [quietOpen, setQuietOpen] = useState(false);
  /** 主催者のチャット：イベントで絞りこむ（空＝すべて） */
  const [eventFilter, setEventFilter] = useState("");

  // 主催者として（/organizer/messages）か、利用者として（/messages）か。会話の一覧もそれぞれの分だけ出す
  const scope = messagesScopeFromPath(pathname);
  const basePath = messagesBasePath(scope);
  const conversationId =
    pathname && pathname.startsWith(`${basePath}/`)
      ? pathname.slice(basePath.length + 1).split("/")[0] || undefined
      : undefined;

  useEffect(() => {
    if (!user && !AUTH_DISABLED) {
      setLoading(false);
      return;
    }

    if (AUTH_DISABLED) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchWithTimeout("/api/messages/inbox", { ...API_CREDENTIALS, signal: controller.signal })
      .then(async (r) => {
        if (controller.signal.aborted || r.status === 499) return null;
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error ?? "取得に失敗しました");
        return data as InboxItem[];
      })
      .then((data) => {
        if (controller.signal.aborted || data == null) return;
        setItems(data);
      })
      .catch((e) => {
        if (controller.signal.aborted || isAbortLikeError(e)) return;
        setError(e?.message ?? "取得に失敗しました");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user]);

  if (authLoading) {
    return (
      <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 14, color: C.t3 }}>読み込み中...</p>
      </div>
    );
  }
  if (authRequired) {
    return (
      <LoginRequiredPanel
        returnTo={pathname ?? "/messages"}
        Icon={MessageCircle}
        title="メッセージ"
        description="イベントの主催者や、募集を出している人と直接やりとりできます。"
        benefits={[
          "イベントの内容や持ち物を、主催者に相談できる",
          "ボランティアや募集の連絡をまとめて受け取れる",
          "フォローしている人と気軽にメッセージを送り合える",
        ]}
      />
    );
  }

  const scopedItems = items.filter((i) =>
    scope === "organizer" ? isOrganizerConversation(i) : !isOrganizerConversation(i)
  );
  const sorted = [...scopedItems].sort((a, b) => {
    if ((a.unread_count > 0) !== (b.unread_count > 0)) return b.unread_count > 0 ? 1 : -1;
    return (b.last_message_at ?? "").localeCompare(a.last_message_at ?? "");
  });

  const unreadThreadCount = sorted.filter((i) => i.unread_count > 0).length;
  /** イベントごとの会話の数（イベントで絞りこむ選択肢） */
  const eventCounts = new Map<string, number>();
  for (const i of sorted) {
    if (i.event_title) eventCounts.set(i.event_title, (eventCounts.get(i.event_title) ?? 0) + 1);
  }
  const vCount = sorted.filter((i) => itemMatchesFilter(i, "v") && i.unread_count > 0).length;
  const pCount = sorted.filter((i) => itemMatchesFilter(i, "p") && i.unread_count > 0).length;
  const fCount = sorted.filter((i) => itemMatchesFilter(i, "f") && i.unread_count > 0).length;

  const q = search.trim();
  const visible = sorted.filter((i) => {
    if (!itemMatchesFilter(i, filter)) return false;
    if (scope === "organizer" && eventFilter && (i.event_title ?? "") !== eventFilter) return false;
    if (!q) return true;
    return getName(i).includes(q) || (i.event_title ?? "").includes(q);
  });

  const chips: { id: FilterId; label: string; badge: number }[] =
    scope === "organizer"
      ? [
          // 参加者かボランティアかは、行のイベント名の札で分かるので、絞りこみは2つだけ
          { id: "all", label: "すべて", badge: 0 },
          { id: "unread", label: "未読", badge: unreadThreadCount },
        ]
      : [
          { id: "all", label: "すべて", badge: 0 },
          { id: "unread", label: "未読", badge: unreadThreadCount },
          { id: "p", label: "参加", badge: pCount },
          { id: "v", label: "手伝い", badge: vCount },
          { id: "f", label: "フォロー", badge: fCount },
        ];

  const sidebarHidden = !!conversationId;
  const mainHidden = !conversationId;
  // 会話を開いているときは、スマホの上の帯・下のメニューを出さない（mobile-main-shell）ので画面いっぱいを使う
  // 主催者の下のナビは利用者のものより低い（約58px）。
  // Tailwind はソースに書かれたクラスしか作らないので、組み立てずにそのまま書く
  const mobileHeightClass = conversationId
    ? "max-[899px]:h-[100dvh]"
    : scope === "organizer"
      ? "max-[899px]:h-[calc(100dvh-var(--mg-mobile-top-header-h,46px)-env(safe-area-inset-top,0px)-calc(58px+env(safe-area-inset-bottom,0px)))]"
      : "max-[899px]:h-[calc(100dvh-var(--mg-mobile-top-header-h,46px)-env(safe-area-inset-top,0px)-calc(72px+env(safe-area-inset-bottom,0px)))]";
  // PC の主催者の画面は上のナビの下に入るので、その分を引く
  const pcHeightClass =
    scope === "organizer" ? "min-[900px]:h-[calc(100dvh-var(--mg-pc-top-nav-h,52px))]" : "min-[900px]:h-[100dvh]";

  return (
    <div
      className={`ms-shell ${mobileHeightClass} ${pcHeightClass}`}
      style={{ display: "flex", overflow: "hidden", background: C.bg, fontFamily: "'Noto Sans JP', sans-serif" }}
    >
      <aside
        style={{ background: C.surface, borderRight: `1px solid ${C.border}`, flexDirection: "column", overflow: "hidden" }}
        className={
          sidebarHidden
            ? "hidden min-[900px]:flex min-[900px]:w-[340px] min-[900px]:shrink-0"
            : "flex flex-col w-full min-[900px]:w-[340px] min-[900px]:shrink-0"
        }
      >
        <div className="ms-sidebar-header" style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {scope === "organizer" ? (
            // スマホでは金色の英字ラベルだけ残し、見出しと説明は出さない（下のナビに「チャット」とあるため）
            <div className="mb-2.5">
              <OrgEyebrow>MESSAGES</OrgEyebrow>
              <h1 className="max-[899px]:hidden mt-1 text-[21px] font-bold leading-tight tracking-[0.04em] text-[#173f2c]" style={{ fontFamily: ORG_SERIF }}>
                チャット
              </h1>
              <p className="mt-0.5 text-[12px] text-[#6b776f] max-[899px]:hidden">参加者・ボランティアからの質問や連絡がここに届きます</p>
            </div>
          ) : (
            // 利用者：主催者と同じ金色の英字ラベルと明朝の見出し
            <div className="mb-2.5">
              <OrgEyebrow>MESSAGES</OrgEyebrow>
              <h1 className="mt-1 text-[21px] font-bold leading-tight tracking-[0.04em] text-[#173f2c]" style={{ fontFamily: ORG_SERIF }}>
                チャット
              </h1>
            </div>
          )}
          <div style={{ position: "relative" }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                width: 13,
                height: 13,
                color: C.t3,
                strokeWidth: 2,
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="名前・イベントで検索"
              className="ms-sbsearch-input"
              style={{
                width: "100%",
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 100,
                padding: "7px 12px 7px 30px",
                fontSize: 16,
                fontFamily: "inherit",
                color: C.t1,
                outline: "none",
                transition: "border-color .15s, box-shadow .15s",
              }}
            />
          </div>
          <div
            className="ms-chip-row"
            style={{
              display: "flex",
              gap: 6,
              marginTop: 10,
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {chips.map((chip) => {
              const on = filter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  className="ms-filter-chip"
                  onClick={() => setFilter(chip.id)}
                  style={{
                    flexShrink: 0,
                    padding: "5px 12px",
                    borderRadius: 100,
                    border: `1px solid ${on ? "#173f2c" : C.border}`,
                    background: on ? "#173f2c" : "#fff",
                    color: on ? "#f6ebc8" : C.t2,
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: on ? 600 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {chip.label}
                  {chip.badge > 0 && (
                    <span style={{ marginLeft: 4, opacity: on ? 0.9 : 1 }}>{chip.badge}</span>
                  )}
                </button>
              );
            })}
            {scope === "organizer" && eventCounts.size > 1 ? (
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                aria-label="イベントで絞りこむ"
                className="ml-auto min-w-0 max-w-[55%] shrink truncate rounded-full border border-[#e6e2d6] bg-white px-3 text-[16px] font-medium text-[#3f5146]"
                style={{ height: 34 }}
              >
                <option value="">すべてのイベント</option>
                {[...eventCounts.entries()].map(([title, n]) => (
                  <option key={title} value={title}>
                    {title}（{n}）
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>

        <div className="ms-conv-scroll" style={{ flex: 1, overflowY: "auto", background: "#f7f6f2" }}>
          {error && (
            <div style={{ padding: 16 }}>
              <div style={{ borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", padding: "12px 16px" }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#b91c1c" }}>読み込みに失敗しました</p>
                <p style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>{error}</p>
              </div>
            </div>
          )}
          {loading && !error && (
            <div style={{ padding: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.border }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, background: C.border, borderRadius: 6, width: "50%", marginBottom: 8 }} />
                    <div style={{ height: 11, background: C.border2, borderRadius: 6, width: "80%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !error && scopedItems.length === 0 && scope === "organizer" && (
            <div className="ms-empty-state" style={{ padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>メッセージはまだありません</p>
              <p style={{ fontSize: 12, color: C.t3, marginTop: 8, lineHeight: 1.7 }}>
                参加者やボランティアに応募した人とのやりとりが、ここに出ます
              </p>
            </div>
          )}
          {!loading && !error && scopedItems.length === 0 && scope === "member" && (
            <div className="ms-empty-state" style={{ padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>メッセージはまだありません</p>
              <p style={{ fontSize: 12, color: C.t3, marginTop: 8, lineHeight: 1.7 }}>
                イベントや募集、みんなの投稿から送れます
              </p>
              <Link href="/events" style={{ display: "inline-block", marginTop: 14, fontSize: 13, color: C.green, fontWeight: 600, textDecoration: "none" }}>
                イベントを見る
              </Link>
            </div>
          )}
          {!loading && !error && scopedItems.length > 0 && visible.length === 0 && (
            <div className="ms-empty-state" style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: C.t3 }}>条件に合う会話はありません</p>
            </div>
          )}
          {!loading && !error ? (
            <div className="pt-3">
              {/* やり取りのある会話（未読が上） */}
              {visible
                .filter((item) => item.last_message_at || item.last_message_content)
                .map((item) =>
                  scope === "organizer" ? (
                    <OrganizerPersonRow key={item.conversation_id} item={item} activeId={conversationId} basePath={basePath} />
                  ) : (
                    <PersonRow key={item.conversation_id} item={item} activeId={conversationId} basePath={basePath} />
                  ),
                )}
              {/* まだやり取りのない会話は、下にたたんでおく */}
              {(() => {
                const quiet = visible.filter((item) => !item.last_message_at && !item.last_message_content);
                if (quiet.length === 0) return null;
                const open = quietOpen || !!q || visible.length === quiet.length;
                return (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setQuietOpen((v) => !v)}
                      aria-expanded={open}
                      className="flex min-h-[44px] w-full items-center justify-between px-5 text-[12.5px] font-bold text-[#6b776f]"
                    >
                      まだやり取りのない会話 {quiet.length}
                      <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
                    </button>
                    {open
                      ? quiet.map((item) =>
                          scope === "organizer" ? (
                            <OrganizerPersonRow key={item.conversation_id} item={item} activeId={conversationId} basePath={basePath} />
                          ) : (
                            <PersonRow key={item.conversation_id} item={item} activeId={conversationId} basePath={basePath} />
                          ),
                        )
                      : null}
                  </div>
                );
              })()}
              {/* 会話が少ないときは、下の空いた所に、どこから届くかの説明 */}
              {visible.length > 0 && visible.length <= 4 && !q ? (
                <div className="mx-3 mt-4 rounded-[16px] border border-dashed border-[#e1d6b4] bg-[#fffdf7] px-4 py-4 text-center">
                  <p className="text-[12.5px] font-bold text-[#173f2c]">チャットはどこから届く？</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-[#6b776f]">
                    {scope === "organizer"
                      ? "イベントのページの「主催者に相談」や、ボランティアの応募から届きます。未読は上に並び、返事がまだの会話には「返事待ち」が付きます。"
                      : "イベントのページの「主催者に相談」や、ボランティアの応募、フォローした人とのやり取りがここに並びます。未読は上に出ます。"}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>

      <main
        style={{ flexDirection: "column", overflow: "hidden", background: C.bg }}
        className={mainHidden ? "hidden min-[900px]:flex min-[900px]:flex-1 min-[900px]:flex-col" : "flex flex-1 flex-col"}
      >
        {children}
      </main>
    </div>
  );
}
