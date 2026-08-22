"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { InboxItem } from "@/lib/inbox-queries";
import { ProfileEmptyCard } from "@/components/profile/profile-empty-card";
import { getLoginUrl } from "@/lib/auth-utils";
import { isAbortLikeError } from "@/lib/is-abort-like-error";
import { resolveAvatarUrlByRole } from "@/lib/profile-avatar";

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

type FilterId = "all" | "unread" | "h" | "v" | "p" | "f";

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

function getName(item: InboxItem): string {
  const n = item.other_display_name?.trim();
  if (n) return n;
  const e = item.other_email?.split("@")[0]?.trim();
  if (e) return e;
  return item.my_role === "organizer"
    ? item.conversation_kind === "general"
      ? "応募者"
      : "参加者"
    : "主催者";
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

function PersonRow({ item, activeId }: { item: InboxItem; activeId?: string }) {
  const name = getName(item);
  const active = item.conversation_id === activeId;
  const unread = item.unread_count > 0;
  const photo = avatarUrlFor(item);
  const eventLine = isFollowChat(item)
    ? relationLabel(item)
    : [item.event_title ?? "イベント", relationLabel(item)].join(" · ");

  return (
    <Link
      href={`/messages/${item.conversation_id}`}
      className="ms-pitem"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        cursor: "pointer",
        textDecoration: "none",
        background: active ? C.greenL : "transparent",
        transition: "background .1s",
        borderBottom: `1px solid ${C.border2}`,
      }}
    >
      <div
        className="ms-av"
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 600,
          flexShrink: 0,
          background: C.greenL,
          color: C.green,
          overflow: "hidden",
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          initials(name)
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div
            className="ms-pname"
            style={{
              fontSize: 14,
              fontWeight: unread ? 700 : 500,
              color: C.t1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
          >
            {name}
          </div>
          <span className="ms-ptime" style={{ fontSize: 11, color: C.t3, flexShrink: 0 }}>
            {item.last_message_at ? formatRel(item.last_message_at) : ""}
          </span>
        </div>
        <div
          className="ms-pprev"
          style={{
            fontSize: 13,
            color: unread ? C.t1 : C.t3,
            fontWeight: unread ? 500 : 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginTop: 2,
          }}
        >
          {item.last_message_content ?? "メッセージがありません"}
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.t3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginTop: 2,
          }}
        >
          {eventLine}
        </div>
      </div>
      {unread && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            flexShrink: 0,
            background: C.green,
          }}
        />
      )}
    </Link>
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
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");

  const conversationId = pathname?.split("/").filter(Boolean)[1];

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
      <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <ProfileEmptyCard
            title="ログインが必要です"
            description="メッセージを利用するにはログインしてください"
            ctaLabel="ログイン"
            ctaHref={loginHref}
          />
        </div>
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => {
    if ((a.unread_count > 0) !== (b.unread_count > 0)) return b.unread_count > 0 ? 1 : -1;
    return (b.last_message_at ?? "").localeCompare(a.last_message_at ?? "");
  });

  const unreadThreadCount = sorted.filter((i) => i.unread_count > 0).length;
  const hCount = sorted.filter((i) => itemMatchesFilter(i, "h") && i.unread_count > 0).length;
  const vCount = sorted.filter((i) => itemMatchesFilter(i, "v") && i.unread_count > 0).length;
  const pCount = sorted.filter((i) => itemMatchesFilter(i, "p") && i.unread_count > 0).length;
  const fCount = sorted.filter((i) => itemMatchesFilter(i, "f") && i.unread_count > 0).length;

  const q = search.trim();
  const visible = sorted.filter((i) => {
    if (!itemMatchesFilter(i, filter)) return false;
    if (!q) return true;
    return getName(i).includes(q) || (i.event_title ?? "").includes(q);
  });

  const chips: { id: FilterId; label: string; badge: number }[] = [
    { id: "all", label: "すべて", badge: 0 },
    { id: "unread", label: "未読", badge: unreadThreadCount },
    { id: "h", label: "主催", badge: hCount },
    { id: "p", label: "参加", badge: pCount },
    { id: "v", label: "手伝い", badge: vCount },
    { id: "f", label: "フォロー", badge: fCount },
  ];

  const sidebarHidden = !!conversationId;
  const mainHidden = !conversationId;

  return (
    <div
      className="ms-shell max-[899px]:h-[calc(100dvh-var(--mg-mobile-top-header-h,46px)-env(safe-area-inset-top,0px)-calc(72px+env(safe-area-inset-bottom,0px)))] min-[900px]:h-[100dvh]"
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
          <div
            className="ms-sidebar-title"
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: C.t1,
              marginBottom: 10,
              letterSpacing: "-.2px",
              lineHeight: 1.2,
            }}
          >
            メッセージ
          </div>
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
                fontSize: 13,
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
                    border: `1px solid ${on ? C.green : C.border}`,
                    background: on ? C.green : "transparent",
                    color: on ? "#fff" : C.t2,
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
          </div>
        </div>

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
          {!loading && !error && items.length === 0 && (
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
          {!loading && !error && items.length > 0 && visible.length === 0 && (
            <div className="ms-empty-state" style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: C.t3 }}>条件に合う会話はありません</p>
            </div>
          )}
          {!loading && !error && visible.map((item) => (
            <PersonRow key={item.conversation_id} item={item} activeId={conversationId} />
          ))}
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
