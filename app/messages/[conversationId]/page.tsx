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
  bg: "#ffffff",
  surface: "#ffffff",
  received: "#efefef",
  input: "#f2f2f2",
  border: "#efefef",
  t1: "#19170f",
  t2: "#5a5448",
  t3: "#8e8e8e",
  green: "#2e8a5a",
  greenL: "#eaf4f0",
} as const;

const BUBBLE_R = 20;
const BUBBLE_TIGHT = 5;
const CLUSTER_MS = 5 * 60 * 1000;

function bubbleRadius(isOwn: boolean, isFirst: boolean, isLast: boolean): string {
  const r = `${BUBBLE_R}px`;
  const t = `${BUBBLE_TIGHT}px`;
  if (isOwn) {
    if (isFirst && isLast) return r;
    if (isFirst) return `${r} ${r} ${t} ${r}`;
    if (isLast) return `${r} ${t} ${r} ${r}`;
    return `${r} ${t} ${t} ${r}`;
  }
  if (isFirst && isLast) return r;
  if (isFirst) return `${r} ${r} ${r} ${t}`;
  if (isLast) return `${t} ${r} ${r} ${r}`;
  return `${t} ${r} ${r} ${t}`;
}

const LINE_H = 22;
const INPUT_MAX_LINES = 4;
const INPUT_MAX_H = LINE_H * INPUT_MAX_LINES;

function resizeComposer(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = `${LINE_H}px`;
  el.style.height = `${Math.min(el.scrollHeight, INPUT_MAX_H)}px`;
}

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function relationLabel(conversationKind: string): string {
  if (conversationKind === "follow_dm") return "フォロー";
  if (conversationKind === "general") return "手伝い";
  return "参加";
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
  const [counterpartAvatarUrl, setCounterpartAvatarUrl] = useState<string | null>(null);
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
    setEventId(null); setEventTitle(null); setCounterpartName(null); setCounterpartAvatarUrl(null);
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
        setCounterpartAvatarUrl(typeof data?.counterpartAvatarUrl === "string" ? data.counterpartAvatarUrl : null);
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

  useEffect(() => {
    resizeComposer(inputRef.current);
  }, [content]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.key === "Process") return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

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

  const canSend = content.trim().length > 0 && !sending;
  const rel = relationLabel(conversationKind);
  const name = counterpartName?.trim() || "相手";
  const nameInitial = name.slice(0, 1).toUpperCase() || "?";

  type MsgItem =
    | { type: "date"; label: string }
    | { type: "msg"; msg: Message; isOwn: boolean; isFirst: boolean; isLast: boolean; showTime: boolean };
  const items: MsgItem[] = [];
  let lastDate = "";

  messages.forEach((m, i) => {
    const dateStr = m.created_at.slice(0, 10);
    if (dateStr !== lastDate) {
      items.push({ type: "date", label: formatDateSep(m.created_at) });
      lastDate = dateStr;
    }
    const isOwn = m.sender_id === currentUserId;
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const t = new Date(m.created_at).getTime();
    const samePrev =
      !!prev &&
      prev.sender_id === m.sender_id &&
      prev.created_at.slice(0, 10) === dateStr &&
      t - new Date(prev.created_at).getTime() < CLUSTER_MS;
    const sameNext =
      !!next &&
      next.sender_id === m.sender_id &&
      next.created_at.slice(0, 10) === dateStr &&
      new Date(next.created_at).getTime() - t < CLUSTER_MS;
    items.push({
      type: "msg",
      msg: m,
      isOwn,
      isFirst: !samePrev,
      isLast: !sameNext,
      showTime: !sameNext,
    });
  });

  return (
    <div
      className="ms-anim-up"
      style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: C.bg, ...(keyboardInset > 0 ? { paddingBottom: keyboardInset } : {}) }}>

      <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.surface, padding: "6px 16px 8px 4px" }}>
        <Link
          href="/messages"
          className="min-[900px]:hidden"
          aria-label="一覧に戻る"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, color: C.t1, textDecoration: "none", flexShrink: 0 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 22, height: 22, strokeWidth: 1.8 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            background: C.greenL,
            color: C.green,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {counterpartAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={counterpartAvatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            nameInitial
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ms-ctx-name" style={{ fontSize: 15, fontWeight: 700, color: C.t1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.2px" }}>
            {name}
          </div>
          {eventId ? (
            <Link
              href={`/events/${eventId}`}
              className="ms-ctx-ev"
              style={{ display: "block", fontSize: 12, color: C.t3, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: "none" }}
            >
              {eventTitle ?? "イベント"} · {rel}
            </Link>
          ) : (
            <div className="ms-ctx-ev" style={{ fontSize: 12, color: C.t3, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {eventTitle ?? "イベント"} · {rel}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="ms-msgs-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px 20px", display: "flex", flexDirection: "column", background: C.bg }}>
        {error && (
          <div style={{ borderRadius: 12, background: "#fef2f2", padding: "8px 12px", fontSize: 13, color: "#b91c1c" }}>{error}</div>
        )}
        {loading && messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 8 }}>
            {[72, 54, 64].map((w, i) => (
              <div key={i} style={{ height: 36, width: `${w}%`, borderRadius: 20, background: C.input, alignSelf: i % 2 === 0 ? "flex-end" : "flex-start" }} />
            ))}
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>
              {myRole === "organizer" ? "メッセージを送ってみましょう" : "主催者にメッセージを送れます"}
            </p>
            <p style={{ fontSize: 13, color: C.t3, marginTop: 6, lineHeight: 1.6 }}>
              {myRole === "organizer" ? "当日の案内や確認に使えます" : "イベントについての質問や相談ができます"}
            </p>
          </div>
        )}

        {items.map((item, idx) => {
          if (item.type === "date") {
            return (
              <div key={`date-${idx}`} style={{ textAlign: "center", margin: "18px 0 12px" }}>
                <span style={{ fontSize: 12, color: C.t3, fontWeight: 500 }}>{item.label}</span>
              </div>
            );
          }
          const { msg, isOwn, isFirst, isLast, showTime } = item;
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isOwn ? "flex-end" : "flex-start",
                maxWidth: "78%",
                alignSelf: isOwn ? "flex-end" : "flex-start",
                marginTop: isFirst ? 8 : 2,
                marginBottom: showTime ? 2 : 0,
              }}
            >
              <div
                className="ms-bubble"
                style={{
                  padding: "8px 14px",
                  fontSize: 15,
                  lineHeight: 1.45,
                  wordBreak: "break-word",
                  borderRadius: bubbleRadius(isOwn, isFirst, isLast),
                  background: isOwn ? C.green : C.received,
                  color: isOwn ? "white" : C.t1,
                }}
              >
                {msg.content}
              </div>
              {showTime && (
                <span className="ms-mtime" style={{ fontSize: 11, color: C.t3, marginTop: 4, padding: "0 4px" }}>
                  {formatTime(msg.created_at)}
                </span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} style={{ height: 8, flexShrink: 0 }} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "8px 10px calc(10px + env(safe-area-inset-bottom, 0px))",
          background: C.surface,
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          className="ms-input-wrap"
          style={{
            flex: 1,
            background: C.input,
            borderRadius: 22,
            padding: "11px 16px",
            display: "flex",
            alignItems: "center",
            minHeight: 44,
          }}
        >
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
              resizeComposer(e.currentTarget);
            }}
            onKeyDown={handleKeyDown}
            placeholder="メッセージ…"
            rows={1}
            enterKeyHint="send"
            inputMode="text"
            autoComplete="off"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 15,
              fontFamily: "inherit",
              color: C.t1,
              resize: "none",
              height: LINE_H,
              minHeight: LINE_H,
              maxHeight: INPUT_MAX_H,
              overflowY: "auto",
              lineHeight: `${LINE_H}px`,
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="ms-send-btn"
          aria-label="送信"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: canSend ? "pointer" : "default",
            flexShrink: 0,
            background: C.green,
            opacity: canSend ? 1 : 0.35,
            transition: "opacity .15s",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 16, height: 16, strokeWidth: 2.4, color: "white" }}>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
