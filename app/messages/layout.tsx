"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { InboxItem } from "@/lib/inbox-queries";
import { ProfileEmptyCard } from "@/components/profile/profile-empty-card";
import { getLoginUrl } from "@/lib/auth-utils";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
const API_CREDENTIALS: RequestInit = { credentials: "include" };

// v14 design tokens (fixes2: lighter background, no texture)
const C = {
  bg: "#f8f7f4",
  surface: "#ffffff",
  surface2: "#f5f4f1",
  border: "#e8e3db",
  border2: "#eeebe4",
  t1: "#19170f",
  t2: "#5a5448",
  t3: "#9e9688",
  green: "#2e8a5a",  greenL: "#eaf4f0",  greenD: "#1a5538",
  blue:  "#3460a8",  blueL:  "#eaeff8",  blueD:  "#1c3a70",
  orange:"#b85c2a",  orangeL:"#faeee6",  orangeD:"#7a3510",
} as const;

const THEMES = [
  { border:"#c2e0ce", bg:"linear-gradient(160deg,#f0faf4 0%,#fff 60%)", plistBg:"rgba(240,250,244,.5)", stBg:"rgba(224,242,230,.6)", stBorder:"#c2e0ce", thumbBg: C.greenL,  thumbColor: C.greenD  },
  { border:"#f0d4bc", bg:"linear-gradient(160deg,#fef6ef 0%,#fff 60%)", plistBg:"rgba(254,246,239,.5)", stBg:"rgba(254,234,224,.5)", stBorder:"#f0d4bc", thumbBg: C.orangeL, thumbColor: C.orangeD },
  { border:"#bcd4f0", bg:"linear-gradient(160deg,#eff4fe 0%,#fff 60%)", plistBg:"rgba(239,244,254,.5)", stBg:"rgba(224,234,248,.6)", stBorder:"#bcd4f0", thumbBg: C.blueL,   thumbColor: C.blueD   },
  { border:"#e8c8d4", bg:"linear-gradient(160deg,#fef0f4 0%,#fff 60%)", plistBg:"rgba(254,240,244,.5)", stBg:"rgba(248,228,236,.5)", stBorder:"#e8c8d4", thumbBg: "#faeee6",  thumbColor: "#7a3510"  },
] as const;

type Tab = "h" | "v" | "p";

type EventGroup = {
  eventId: string | null;
  eventTitle: string | null;
  eventImageUrl: string | null;
  participants: InboxItem[];
  volunteers: InboxItem[];
  unreadCount: number;
  themeIdx: number;
};

function buildGroups(items: InboxItem[]): EventGroup[] {
  const map = new Map<string, EventGroup>();
  const order: string[] = [];
  items.forEach((item) => {
    const key = item.event_id ?? `__${item.conversation_id}`;
    if (!map.has(key)) {
      map.set(key, { eventId: item.event_id, eventTitle: item.event_title, eventImageUrl: item.event_image_url, participants: [], volunteers: [], unreadCount: 0, themeIdx: order.length % 4 });
      order.push(key);
    }
    const g = map.get(key)!;
    g.unreadCount += item.unread_count;
    if (item.conversation_kind === "general") g.volunteers.push(item);
    else g.participants.push(item);
  });
  return order.map((k) => map.get(k)!);
}

function formatRel(iso: string): string {
  const d = new Date(iso), now = new Date(), diff = now.getTime() - d.getTime();
  if (diff < 60000) return "たった今";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
  if (diff < 86400000 && d.getDate() === now.getDate())
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  if (diff < 172800000) return "昨日";
  if (diff < 604800000) return "先週";
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

function getName(item: InboxItem): string {
  const n = item.other_display_name?.trim();
  if (n) return n;
  const e = item.other_email?.split("@")[0]?.trim();
  if (e) return e;
  return item.my_role === "organizer" ? (item.conversation_kind === "general" ? "応募者" : "参加者") : "主催者";
}

function initials(name: string): string {
  return name.charAt(0).toUpperCase();
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      style={{ width: 13, height: 13, strokeWidth: 2, color: C.t3, flexShrink: 0, margin: "0 12px 0 8px", transition: "transform .22s ease", transform: open ? "rotate(180deg)" : "none" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function PersonRow({ item, activeId, avBg, avColor, activeBg, activeBorder, unreadColor }: {
  item: InboxItem; activeId?: string;
  avBg: string; avColor: string; activeBg: string; activeBorder: string; unreadColor: string;
}) {
  const name = getName(item);
  const active = item.conversation_id === activeId;
  return (
    <Link href={`/messages/${item.conversation_id}`} className="ms-pitem"
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", textDecoration: "none", borderLeft: `2.5px solid ${active ? activeBorder : "transparent"}`, background: active ? activeBg : "transparent", transition: "background .1s", position: "relative", borderBottom: `1px solid ${C.border2}` }}>
      <div className="ms-av" style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0, background: avBg, color: avColor }}>
        {initials(name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ms-pname" style={{ fontSize: 12, fontWeight: 500, color: C.t1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div className="ms-pprev" style={{ fontSize: 11, color: C.t3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
          {item.last_message_content ?? "メッセージがありません"}
        </div>
      </div>
      <span className="ms-ptime" style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>{item.last_message_at ? formatRel(item.last_message_at) : ""}</span>
      {item.unread_count > 0 && <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginLeft: 5, background: unreadColor }} />}
    </Link>
  );
}

function EvCard({ group, activeId, tab, search }: { group: EventGroup; activeId?: string; tab: Tab; search: string }) {
  const [open, setOpen] = useState(true);
  const [sub, setSub] = useState<"pax" | "vol">("pax");
  const t = THEMES[group.themeIdx];
  const hasBoth = group.participants.length > 0 && group.volunteers.length > 0;

  const avProps = (item: InboxItem) => {
    if (tab === "h") {
      if (item.conversation_kind === "general") return { avBg: C.blueL, avColor: C.blueD, activeBg: C.blueL, activeBorder: C.blue, unreadColor: C.blue };
      return { avBg: C.greenL, avColor: C.greenD, activeBg: C.greenL, activeBorder: C.green, unreadColor: C.green };
    }
    if (tab === "v") return { avBg: C.blueL, avColor: C.blueD, activeBg: C.blueL, activeBorder: C.blue, unreadColor: C.blue };
    return { avBg: C.orangeL, avColor: C.orangeD, activeBg: C.orangeL, activeBorder: C.orange, unreadColor: C.orange };
  };

  const tabUnread = tab === "h" ? C.green : tab === "v" ? C.blue : C.orange;

  const displayItems = hasBoth
    ? (sub === "pax" ? group.participants : group.volunteers)
    : [...group.participants, ...group.volunteers];

  const filteredItems = search
    ? displayItems.filter((i) => getName(i).includes(search) || (i.event_title ?? "").includes(search))
    : displayItems;

  if (search && filteredItems.length === 0 && !(group.eventTitle ?? "").includes(search)) return null;

  return (
    <div className="ms-evcard"
      style={{ margin: "8px 10px 0", borderRadius: 12, overflow: "hidden", border: `1px solid ${t.border}`, background: t.bg, boxShadow: "0 1px 4px rgba(0,0,0,.05)", transition: "box-shadow .15s" }}>
      {/* Header row */}
      <div onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
        <div style={{ width: 56, minWidth: 56, height: 56, flexShrink: 0, borderRadius: 8, margin: "9px 0 9px 10px", overflow: "hidden", position: "relative" }}>
          {group.eventImageUrl ? (
            <img
              src={group.eventImageUrl}
              alt={group.eventTitle ?? ""}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 8 }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fb) fb.style.display = "flex";
              }}
            />
          ) : null}
          <div style={{ display: group.eventImageUrl ? "none" : "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: t.thumbBg, borderRadius: 8, fontSize: 22, color: t.thumbColor, position: group.eventImageUrl ? "absolute" : undefined, inset: group.eventImageUrl ? 0 : undefined }}>
            📅
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: "0 0 0 12px" }}>
          <div className="ms-ev-name" style={{ fontSize: 12, fontWeight: 600, color: C.t1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-.1px" }}>
            {group.eventTitle ?? "イベント"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
            {group.participants.length > 0 && (
              <span className="ms-ev-pill" style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 100, background: C.greenL, color: C.greenD }}>
                参加者 {group.participants.length}
              </span>
            )}
            {group.volunteers.length > 0 && (
              <span className="ms-ev-pill" style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: C.blueL, color: C.blueD }}>
                ボランティア募集 {group.volunteers.length}
              </span>
            )}
            {group.unreadCount > 0 && (
              <span className="ms-ev-unread" style={{ width: 20, height: 20, borderRadius: "50%", fontSize: 10, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto", flexShrink: 0, background: tabUnread, boxShadow: "0 1px 4px rgba(0,0,0,.18)" }}>
                {group.unreadCount}
              </span>
            )}
          </div>
        </div>
        <Chevron open={open} />
      </div>

      {open && (
        <>
          {hasBoth && (
            <div style={{ display: "flex", background: t.stBg, borderTop: `1px solid ${t.stBorder}` }}>
              <button className="ms-sub-btn" onClick={() => setSub("pax")}
                style={{ flex: 1, padding: "7px 8px", background: sub === "pax" ? C.greenL : "none", border: "none", borderBottom: `2px solid ${sub === "pax" ? C.green : "transparent"}`, cursor: "pointer", fontFamily: "inherit", fontSize: 10.5, fontWeight: 500, color: sub === "pax" ? C.greenD : C.t3, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .13s" }}>
                参加者
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 14, height: 14, borderRadius: 100, fontSize: 9, fontWeight: 700, padding: "0 3px", background: sub === "pax" ? C.green : C.border, color: sub === "pax" ? "white" : C.t2 }}>
                  {group.participants.length}
                </span>
              </button>
              <button className="ms-sub-btn" onClick={() => setSub("vol")}
                style={{ flex: 1, padding: "7px 8px", background: sub === "vol" ? C.blueL : "none", border: "none", borderBottom: `2px solid ${sub === "vol" ? C.blue : "transparent"}`, cursor: "pointer", fontFamily: "inherit", fontSize: 10.5, fontWeight: 500, color: sub === "vol" ? C.blueD : C.t3, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .13s" }}>
                ボランティア応募
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 14, height: 14, borderRadius: 100, fontSize: 9, fontWeight: 700, padding: "0 3px", background: sub === "vol" ? C.blue : C.border, color: sub === "vol" ? "white" : C.t2 }}>
                  {group.volunteers.length}
                </span>
              </button>
            </div>
          )}
          <div style={{ background: search ? undefined : t.plistBg }}>
            {(search ? filteredItems : displayItems).map((item) => (
              <PersonRow key={item.conversation_id} item={item} activeId={activeId} {...avProps(item)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useSupabaseUser();
  const authRequired = !user && !AUTH_DISABLED;
  const loginHref = getLoginUrl(pathname ?? "/messages");
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("h");
  const [search, setSearch] = useState("");

  const conversationId = pathname?.split("/").filter(Boolean)[1];

  useEffect(() => {
    if (!user && !AUTH_DISABLED) { setLoading(false); return; }
    if (AUTH_DISABLED) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetchWithTimeout("/api/messages/inbox", API_CREDENTIALS)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error ?? "取得に失敗しました");
        return data as InboxItem[];
      })
      .then((data) => setItems(data ?? []))
      .catch((e) => setError(e?.message ?? "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) {
    return <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center" }}><p style={{ fontSize: 14, color: C.t3 }}>読み込み中...</p></div>;
  }
  if (authRequired) {
    return (
      <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <ProfileEmptyCard title="ログインが必要です" description="メッセージを利用するにはログインしてください" ctaLabel="ログイン" ctaHref={loginHref} />
        </div>
      </div>
    );
  }

  // Sort: unread first, then by recency
  const sorted = [...items].sort((a, b) => {
    if ((a.unread_count > 0) !== (b.unread_count > 0)) return (b.unread_count > 0) ? 1 : -1;
    return (b.last_message_at ?? "").localeCompare(a.last_message_at ?? "");
  });

  const hostItems      = sorted.filter((i) => i.my_role === "organizer");
  const volunteerItems = sorted.filter((i) => i.my_role === "volunteer" && i.conversation_kind === "general");
  const participantItems = sorted.filter((i) => i.my_role === "volunteer" && i.conversation_kind !== "general");

  const tabItems = tab === "h" ? hostItems : tab === "v" ? volunteerItems : participantItems;
  const groups = buildGroups(tabItems);

  const unreadCount = (arr: InboxItem[]) => arr.reduce((s, i) => s + (i.unread_count > 0 ? 1 : 0), 0);
  const hBadge = unreadCount(hostItems);
  const vBadge = unreadCount(volunteerItems);
  const pBadge = unreadCount(participantItems);

  const tabColor = tab === "h" ? C.green : tab === "v" ? C.blue : C.orange;

  const tabDef = [
    { id: "h" as Tab, label: "主催者",      badge: hBadge, onColor: C.green,  onL: C.greenL },
    { id: "v" as Tab, label: "ボランティア", badge: vBadge, onColor: C.blue,   onL: C.blueL  },
    { id: "p" as Tab, label: "参加者",       badge: pBadge, onColor: C.orange, onL: C.orangeL },
  ];

  // Mobile: hide sidebar when viewing a conversation
  const sidebarHidden = !!conversationId;
  const mainHidden = !conversationId;

  return (
    <div className="ms-shell" style={{ display: "flex", height: "100dvh", overflow: "hidden", background: C.bg, fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* Sidebar */}
      <aside
        style={{ background: C.surface, borderRight: `1px solid ${C.border}`, flexDirection: "column", overflow: "hidden" }}
        className={sidebarHidden ? "hidden sm:flex sm:w-[304px] sm:shrink-0" : "flex flex-col w-full sm:w-[304px] sm:shrink-0"}
      >
        {/* Header */}
        <div style={{ padding: "18px 16px 13px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', 'Noto Serif JP', serif", fontStyle: "italic", fontSize: 17, fontWeight: 500, color: C.t1, marginBottom: 10, letterSpacing: "-.4px", lineHeight: 1 }}>
            メッセージ
          </div>
          <div style={{ position: "relative" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: C.t3, strokeWidth: 2, pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="イベント名・人名で検索…"
              className="ms-sbsearch-input"
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 100, padding: "7px 12px 7px 32px", fontSize: 12, fontFamily: "inherit", color: C.t1, outline: "none", transition: "border-color .15s, box-shadow .15s" }}
            />
          </div>
        </div>

        {/* Role Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {tabDef.map((td) => {
            const on = tab === td.id;
            return (
              <button key={td.id} className="ms-tab-btn" onClick={() => setTab(td.id)}
                style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", borderBottom: `2px solid ${on ? td.onColor : "transparent"}`, marginBottom: -1, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: on ? 500 : 400, color: on ? td.onColor : C.t3, transition: "all .13s", letterSpacing: ".02em", whiteSpace: "nowrap" }}>
                {td.label}
                {td.badge > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 14, height: 14, borderRadius: 100, fontSize: 9, fontWeight: 700, padding: "0 4px", marginLeft: 4, verticalAlign: "middle", background: td.onL, color: td.onColor }}>
                    {td.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Conversation list */}
        <div className="ms-conv-scroll" style={{ flex: 1, overflowY: "auto" }}>
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
              {[1,2,3].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.border }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, background: C.border, borderRadius: 6, width: "60%", marginBottom: 6 }} />
                    <div style={{ height: 11, background: C.border2, borderRadius: 6, width: "80%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !error && groups.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: C.t3 }}>まだメッセージがありません</p>
              <Link href="/events" style={{ display: "inline-flex", alignItems: "center", marginTop: 16, borderRadius: 100, background: tabColor, color: "white", padding: "8px 20px", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
                イベントを探す
              </Link>
            </div>
          )}
          {!loading && !error && groups.map((g, idx) => (
            <EvCard key={g.eventId ?? idx} group={g} activeId={conversationId} tab={tab} search={search} />
          ))}
          <div style={{ height: 8 }} />
        </div>
      </aside>

      {/* Main area */}
      <main
        style={{ flexDirection: "column", overflow: "hidden", background: C.bg }}
        className={mainHidden ? "hidden sm:flex sm:flex-1 sm:flex-col" : "flex flex-1 flex-col"}
      >
        {children}
      </main>
    </div>
  );
}
