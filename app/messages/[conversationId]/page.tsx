"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { createClient } from "@/lib/supabase/client";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { isAbortLikeError } from "@/lib/is-abort-like-error";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
const API_CREDENTIALS: RequestInit = { credentials: "include" };

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

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type RoleKey = "h" | "v" | "p";

function getRoleKey(myRole: "organizer" | "volunteer", conversationKind: string): RoleKey {
  if (myRole === "organizer") return "h";
  if (conversationKind === "general") return "v";
  return "p";
}

function getChipText(myRole: "organizer" | "volunteer", conversationKind: string): string {
  if (myRole === "organizer") return conversationKind === "general" ? "ボランティア応募者" : "参加者";
  return "主催者";
}

function getChipStyle(chipText: string): { background: string; color: string } {
  if (chipText === "参加者") return { background: C.greenL, color: C.green };
  if (chipText === "ボランティア応募者") return { background: C.blueL, color: C.blue };
  return { background: C.orangeL, color: C.orange };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSep(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) return "今日";
  if (diff < 172800000) return "昨日";
  return d.toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
}


export default function ConversationPage() {
  const routeParams = useParams<{ conversationId?: string | string[] }>();
  const { user, loading: authLoading } = useSupabaseUser();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [counterpartName, setCounterpartName] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<"organizer" | "volunteer">("volunteer");
  const [conversationKind, setConversationKind] = useState<string>("event_inquiry");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const raw = routeParams?.conversationId;
    if (typeof raw === "string" && raw.length > 0) { setConversationId(raw); return; }
    if (Array.isArray(raw) && raw[0]) { setConversationId(raw[0]); return; }
    setConversationId(null);
  }, [routeParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setKeyboardInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const controller = new AbortController();
    setEventId(null); setEventTitle(null); setCounterpartName(null);
    setMyRole("volunteer"); setConversationKind("event_inquiry");
    fetchWithTimeout(`/api/messages/conversations/${conversationId}/meta`, {
      ...API_CREDENTIALS,
      signal: controller.signal,
    })
      .then(async (r) => {
        if (controller.signal.aborted || r.status === 499) return;
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error ?? "メタ情報の取得に失敗しました");
        setEventId(data?.eventId ?? null);
        setEventTitle(data?.eventTitle ?? null);
        setMyRole(data?.myRole === "organizer" ? "organizer" : "volunteer");
        setConversationKind(typeof data?.conversationKind === "string" ? data.conversationKind : "event_inquiry");
        setCounterpartName(data?.counterpartDisplayName ?? null);
      })
      .catch((e) => {
        if (!controller.signal.aborted && !isAbortLikeError(e)) {
          console.warn("conversation meta fetch failed:", e);
        }
      });
    return () => controller.abort();
  }, [conversationId]);

  const currentUserId = user?.id ?? (AUTH_DISABLED ? "dev-user" : null);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError(null);

    (async () => {
      try {
        const msgRes = await fetchWithTimeout(`/api/messages/conversations/${conversationId}/messages`, {
          ...API_CREDENTIALS,
          signal: controller.signal,
        });
        if (controller.signal.aborted || msgRes.status === 499) return;
        if (msgRes.ok) setMessages(await msgRes.json());
        else setError("メッセージの取得に失敗しました");
        await fetch(`/api/messages/conversations/${conversationId}/read`, {
          method: "POST",
          ...API_CREDENTIALS,
          signal: controller.signal,
        });
      } catch (e) {
        if (!controller.signal.aborted && !isAbortLikeError(e)) {
          setError("通信に失敗しました");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    const channel = supabase.channel(`messages:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const newRow = payload.new as Message;
        setMessages((prev) => prev.some((m) => m.id === newRow.id) ? prev : [...prev, newRow]);
      })
      .subscribe();

    return () => {
      controller.abort();
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = content.trim();
    if (!text || !conversationId || !currentUserId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...API_CREDENTIALS,
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.step && data?.message ? `${data.step}: ${data.message}` : data?.error ?? "送信に失敗しました");
        return;
      }
      setContent("");
      const r2 = await fetchWithTimeout(`/api/messages/conversations/${conversationId}/messages`, API_CREDENTIALS);
      if (r2.ok) setMessages(await r2.json());
    } catch { setError("通信に失敗しました"); }
    finally { setSending(false); }
  }, [content, conversationId, currentUserId, sending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.key === "Process") return;
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (authLoading || !conversationId) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ fontSize: 14, color: C.t3 }}>読み込み中...</p></div>;
  }
  if (!currentUserId) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 16px" }}>
        <p style={{ color: C.t2 }}>ログインするとメッセージを利用できます</p>
        <Link href={`/auth?next=/messages/${conversationId}`} style={{ color: C.green, textDecoration: "underline" }}>ログイン</Link>
      </div>
    );
  }

  const rk = getRoleKey(myRole, conversationKind);
  const chipText = getChipText(myRole, conversationKind);
  const chipStyle = getChipStyle(chipText);
  const accentColor = rk === "h" ? C.green : rk === "v" ? C.blue : C.orange;
  const bubbleBg = rk === "h" ? C.green : rk === "v" ? C.blue : C.orange;
  const inpClass = rk === "h" ? "ms-input-wrap fh" : rk === "v" ? "ms-input-wrap fv" : "ms-input-wrap fp";

  // Group messages by day, track sender changes
  type MsgItem = { type: "date"; label: string } | { type: "sender"; name: string } | { type: "msg"; msg: Message; isOwn: boolean };
  const items: MsgItem[] = [];
  let lastDate = "";
  let lastSender = "";

  messages.forEach((m) => {
    const dateStr = m.created_at.slice(0, 10);
    if (dateStr !== lastDate) {
      items.push({ type: "date", label: formatDateSep(m.created_at) });
      lastDate = dateStr;
      lastSender = "";
    }
    const isOwn = m.sender_id === currentUserId;
    const senderKey = isOwn ? "__me__" : m.sender_id;
    if (senderKey !== lastSender) {
      const senderLabel = isOwn ? (user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "自分") : (counterpartName ?? "相手");
      items.push({ type: "sender", name: senderLabel });
      lastSender = senderKey;
    }
    items.push({ type: "msg", msg: m, isOwn });
  });

  return (
    <div
      className="ms-anim-up"
      style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: C.bg, ...(keyboardInset > 0 ? { paddingBottom: keyboardInset } : {}) }}>

      {/* Context bar */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.surface, boxShadow: `0 1px 0 ${C.border}` }}>
        <div style={{ width: 4, flexShrink: 0, background: accentColor }} />
        <div style={{ flex: 1, minWidth: 0, padding: "11px 14px" }}>
          <div className="ms-ctx-ev" style={{ fontSize: 12.5, fontWeight: 500, color: C.t1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-.1px" }}>
            {eventTitle ?? "イベント"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span className="ms-ctx-chip" style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, ...chipStyle }}>{chipText}</span>
            <span className="ms-ctx-name" style={{ fontSize: 11, color: C.t2 }}>{counterpartName ?? "—"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, paddingRight: 14, alignItems: "center" }}>
          {/* Back button (mobile) */}
          <Link href="/messages" className="sm:hidden"
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.t2, padding: 0, marginRight: 4, textDecoration: "none" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 15, height: 15, strokeWidth: 2 }}><polyline points="15 18 9 12 15 6"/></svg>
            戻る
          </Link>
          {eventId && (
            <Link href={`/events/${eventId}`} className="ms-icn"
              style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.t3, transition: "all .12s", textDecoration: "none" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 12, height: 12, strokeWidth: 1.8 }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="ms-msgs-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        {error && (
          <div style={{ borderRadius: 8, background: "#fef2f2", padding: "8px 12px", fontSize: 13, color: "#b91c1c" }}>{error}</div>
        )}
        {loading && messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[80,60,70,50,65].map((w,i) => (
              <div key={i} style={{ height: 40, width: `${w}%`, borderRadius: 18, background: i % 2 === 0 ? C.border2 : C.border, alignSelf: i % 2 === 0 ? "flex-start" : "flex-end" }} />
            ))}
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, padding: 16, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 24, height: 24, color: accentColor, margin: "0 auto 8px", display: "block", strokeWidth: 1.5 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>
              {myRole === "organizer" ? "参加者にメッセージを送ってみましょう" : "主催者にメッセージを送ってみましょう"}
            </p>
            <p style={{ fontSize: 12, color: C.t3, marginTop: 4, lineHeight: 1.7 }}>
              {myRole === "organizer" ? "当日の案内や応募内容の確認に使えます。" : "イベントについての質問や相談ができます。"}
            </p>
          </div>
        )}

        {items.map((item, idx) => {
          if (item.type === "date") {
            return (
              <div key={`date-${idx}`} style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 8px" }}>
                <div style={{ flex: 1, height: 1, background: C.border2 }} />
                <span style={{ fontSize: 10.5, color: C.t3, whiteSpace: "nowrap" }}>{item.label}</span>
                <div style={{ flex: 1, height: 1, background: C.border2 }} />
              </div>
            );
          }
          if (item.type === "sender") {
            return (
              <div key={`sep-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 6px" }}>
                <div style={{ flex: 1, height: 1, background: C.border2 }} />
                <span style={{ fontSize: 10, color: C.t3, whiteSpace: "nowrap", background: C.bg, padding: "0 4px" }}>{item.name}</span>
                <div style={{ flex: 1, height: 1, background: C.border2 }} />
              </div>
            );
          }
          const { msg, isOwn } = item;
          return (
            <div key={msg.id}
              style={{ display: "flex", gap: 6, maxWidth: "72%", margin: "1px 0", alignSelf: isOwn ? "flex-end" : "flex-start", flexDirection: isOwn ? "row-reverse" : "row" }}>
              <div className="ms-bubble" style={{
                padding: "9px 14px", fontSize: 13, lineHeight: 1.7, wordBreak: "break-word",
                borderRadius: isOwn ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                background: isOwn ? bubbleBg : C.surface,
                color: isOwn ? "white" : C.t1,
                border: isOwn ? "none" : `1px solid ${C.border2}`,
                boxShadow: isOwn ? "0 1px 6px rgba(0,0,0,.12)" : "0 1px 4px rgba(0,0,0,.06)",
              }}>
                {msg.content}
              </div>
              <span className="ms-mtime" style={{ fontSize: 9.5, color: C.t3, alignSelf: "flex-end", whiteSpace: "nowrap", marginBottom: 3 }}>
                {formatTime(msg.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} style={{ height: 4, flexShrink: 0 }} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div className={inpClass}
          style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 100, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, transition: "border-color .15s, box-shadow .15s" }}>
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); if (error) setError(null); }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches) return;
              requestAnimationFrame(() => inputRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
            }}
            placeholder="メッセージを入力…"
            rows={1}
            enterKeyHint="send"
            inputMode="text"
            autoComplete="off"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: "inherit", color: C.t1, resize: "none", minHeight: 22, maxHeight: 120, overflowY: "auto", lineHeight: 1.6 }}
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !content.trim()}
          className="ms-send-btn"
          style={{ width: 36, height: 36, borderRadius: "50%", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "transform .15s, opacity .15s", boxShadow: "0 1px 6px rgba(0,0,0,.15)", background: accentColor, opacity: sending || !content.trim() ? 0.4 : 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 13, height: 13, strokeWidth: 2.5, color: "white" }}>
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
