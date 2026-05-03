"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { createClient } from "@/lib/supabase/client";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { cn } from "@/lib/utils";
import { CommonAvatar } from "@/components/profile/common-avatar";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

/** 本番で Cookie 付き API を確実に叩く */
const API_CREDENTIALS: RequestInit = { credentials: "include" };

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ConversationPage() {
  const routeParams = useParams<{ conversationId?: string | string[] }>();
  const { user, loading: authLoading } = useSupabaseUser();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [counterpartDisplayName, setCounterpartDisplayName] = useState<string | null>(null);
  const [counterpartAvatarUrl, setCounterpartAvatarUrl] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<"organizer" | "volunteer">("volunteer");
  const [conversationKind, setConversationKind] = useState<string>("event_inquiry");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestionChips = [
    { label: "質問したい", value: "イベントについて質問したいです。" },
    { label: "参加を相談", value: "参加について相談したいです。" },
    { label: "ボランティア", value: "ボランティア参加は可能でしょうか。" },
    { label: "キャンセル相談", value: "キャンセル方法について確認したいです。" },
  ] as const;

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const emptySuggestionsAutoOpened = useRef(false);
  /** iOS 等: キーボード表示時にレイアウト下端が隠れないよう visualViewport から余白を取る */
  const [keyboardInsetPx, setKeyboardInsetPx] = useState(0);

  useEffect(() => {
    emptySuggestionsAutoOpened.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (loading || messages.length > 0 || emptySuggestionsAutoOpened.current) return;
    emptySuggestionsAutoOpened.current = true;
    // モバイルは縦が狭いので候補の自動表示はせず、入力欄を優先
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      return;
    }
    setSuggestionsOpen(true);
  }, [conversationId, loading, messages.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = Math.max(
        0,
        Math.round(window.innerHeight - vv.height - vv.offsetTop)
      );
      setKeyboardInsetPx(inset);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    const raw = routeParams?.conversationId;
    if (typeof raw === "string" && raw.length > 0) {
      setConversationId(raw);
      return;
    }
    if (Array.isArray(raw) && raw[0]) {
      setConversationId(raw[0]);
      return;
    }
    setConversationId(null);
  }, [routeParams]);

  const currentUserId = user?.id ?? (AUTH_DISABLED ? "dev-user" : null);

  // 会話のメタ情報（イベント名 / 相手表示名）
  useEffect(() => {
    if (!conversationId) return;
    setEventId(null);
    setEventTitle(null);
    setCounterpartDisplayName(null);
    setCounterpartAvatarUrl(null);
    setMyRole("volunteer");
    setConversationKind("event_inquiry");

    fetchWithTimeout(
      `/api/messages/conversations/${conversationId}/meta`,
      API_CREDENTIALS
    )
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error ?? "メタ情報の取得に失敗しました");
        setEventId(data?.eventId ?? null);
        setEventTitle(data?.eventTitle ?? null);
        setMyRole(data?.myRole === "organizer" ? "organizer" : "volunteer");
        setConversationKind(typeof data?.conversationKind === "string" ? data.conversationKind : "event_inquiry");
        setCounterpartDisplayName(data?.counterpartDisplayName ?? null);
        setCounterpartAvatarUrl(data?.counterpartAvatarUrl ?? null);
      })
      .catch(() => {
        // 表示だけなら最低限で成立するので、失敗しても会話UIは出す
      });
  }, [conversationId]);

  // メッセージ取得・既読・Realtime 購読
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        // メッセージ取得
        const msgRes = await fetchWithTimeout(
          `/api/messages/conversations/${conversationId}/messages`,
          API_CREDENTIALS
        );
        if (msgRes.ok) {
          const msgs: Message[] = await msgRes.json();
          setMessages(msgs);
        } else {
          setError("メッセージの取得に失敗しました");
        }

        // 既読に更新
        await fetch(`/api/messages/conversations/${conversationId}/read`, {
          method: "POST",
          ...API_CREDENTIALS,
        });
      } catch {
        setError("通信に失敗しました");
      } finally {
        setLoading(false);
      }
    })();

    // Realtime: messages の INSERT を購読
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newRow = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            return [...prev, newRow];
          });
        }
      )
      .subscribe();

    return () => {
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
      const res = await fetch(
        `/api/messages/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          ...API_CREDENTIALS,
          body: JSON.stringify({ content: text }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        step?: string;
        message?: string;
      };
      if (!res.ok) {
        const line =
          typeof data.step === "string" && typeof data.message === "string"
            ? `${data.step}: ${data.message}`
            : typeof data.error === "string"
              ? data.error
              : "送信に失敗しました";
        setError(line);
        return;
      }
      setContent("");
      const refreshRes = await fetchWithTimeout(
        `/api/messages/conversations/${conversationId}/messages`,
        API_CREDENTIALS
      );
      if (refreshRes.ok) {
        setMessages((await refreshRes.json()) as Message[]);
      }
    } catch {
      setError("通信に失敗しました");
    } finally {
      setSending(false);
    }
  }, [content, conversationId, currentUserId, sending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.key === "Process") return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || !conversationId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-zinc-600 dark:text-zinc-400">
          ログインするとメッセージを利用できます
        </p>
        <Link
          href={`/auth?next=/messages/${conversationId}`}
          className="text-[var(--accent)] underline underline-offset-2"
        >
          ログイン
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-[#f4f0e8] dark:bg-zinc-950",
        "h-[100dvh] max-h-[100dvh] box-border",
        "md:h-auto md:max-h-none md:flex-1 md:min-h-0"
      )}
      style={
        keyboardInsetPx > 0
          ? { paddingBottom: keyboardInsetPx }
          : undefined
      }
    >
      {/* ヘッダー */}
      <header className="z-50 shrink-0 border-b border-[#ccc4b4] bg-[#faf8f2]/95 backdrop-blur-md pt-[max(0.35rem,env(safe-area-inset-top,0px))]">
        <div className="flex items-center gap-2 px-4 pb-3 pt-1">
          {/* モバイルのみ戻るボタン */}
          <Link
            href="/messages"
            className="flex shrink-0 items-center gap-0.5 rounded-lg py-1.5 pl-0.5 pr-1 text-[#6a6258] transition-colors hover:text-[#3a3428] active:bg-[#f0ece4] md:hidden"
            aria-label="メッセージ一覧へ戻る"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <CommonAvatar
                avatarUrl={counterpartAvatarUrl}
                displayName={counterpartDisplayName ?? (myRole === "organizer" ? "参加者" : "主催者")}
                size="sm"
                className="border border-[#ccc4b4] bg-[#eef6f2]"
              />
              <div className="min-w-0">
                <p
                  className="truncate text-[15px] font-semibold text-[#0e1610]"
                  style={{ fontFamily: "'Shippori Mincho', serif" }}
                >
                  {eventTitle ?? "イベント"}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[#6a6258]">
                  {counterpartDisplayName
                    ? `${myRole === "organizer" ? (conversationKind === "general" ? "ボランティア応募者" : "参加者") : "主催者"} · ${counterpartDisplayName}`
                    : myRole === "organizer" ? "参加者" : "主催者"}
                </p>
              </div>
            </div>
          </div>

          {eventId && (
            <Link
              href={`/events/${eventId}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ccc4b4] bg-white text-[#6a6258] transition-colors hover:bg-[#f0ece4]"
              aria-label="イベントページを開く"
            >
              <CalendarDays className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      </header>

      {/* メッセージ一覧 */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3",
          "md:px-4"
        )}
      >
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        {loading && messages.length === 0 && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`h-10 w-full animate-pulse rounded-2xl ${
                  i % 2 === 0 ? "bg-zinc-100 dark:bg-zinc-800" : "bg-zinc-50 dark:bg-zinc-900"
                }`}
              />
            ))}
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div className="rounded-2xl border border-[var(--mg-line)] bg-white/80 p-4 text-center shadow-[var(--mg-shadow)] dark:border-zinc-700/60 dark:bg-zinc-900/40">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-[var(--accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {myRole === "organizer"
                ? "参加者にメッセージを送ってみましょう"
                : "主催者にメッセージを送ってみましょう"}
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {myRole === "organizer"
                ? "応募内容の確認や当日の案内に使えます。"
                : "イベントについての質問や相談ができます。"}
            </p>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              {myRole === "organizer"
                ? "参加前の不安を減らす連絡にも便利です。"
                : "参加前の確認にも使えます。"}
            </p>
          </div>
        )}
        {messages.map((m, idx) => {
          const isOwn = m.sender_id === currentUserId;
          const prev = idx > 0 ? messages[idx - 1] : null;
          const isSameSender = prev?.sender_id === m.sender_id;
          return (
            <div
              key={m.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} ${
                idx === 0 ? "" : isSameSender ? "mt-1" : "mt-3"
              }`}
            >
              <div
                className={`max-w-[58%] rounded-[10px] px-3 py-2.5 ${
                  isOwn
                    ? "bg-[#1e3848] text-[#e8f4f8]"
                    : "border border-[#ccc4b4] bg-[#faf8f2] text-[#3a3428]"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-[11px] leading-[1.55]">
                  {m.content}
                </p>
                <p
                  className={`mt-1 text-[10px] leading-none ${
                    isOwn ? "text-[#e8f4f8]/60" : "text-[#a8a090]"
                  }`}
                >
                  {new Date(m.created_at).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-1 shrink-0" aria-hidden />
      </div>

      {/* 入力欄: Enter送信 / Shift+Enter改行 */}
      <div
        className="z-40 shrink-0 border-t border-[#ccc4b4] bg-[#faf8f2]/95 px-3 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md md:px-4 md:pt-2.5 md:pb-3"
      >
        {!loading && error && (
          <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="mb-1.5 md:mb-2">
          <button
            type="button"
            onClick={() => setSuggestionsOpen((o) => !o)}
            className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-[var(--accent)] hover:underline dark:text-zinc-400 md:text-xs"
          >
            {suggestionsOpen ? "候補を隠す" : "返信の候補を表示"}
          </button>
          {suggestionsOpen && (
            <div className="scrollbar-hide mt-1.5 flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] md:mt-2 md:pb-1">
              {suggestionChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setContent(chip.value);
                    setError(null);
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                  className="shrink-0 rounded-full border border-[var(--mg-line)] bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm active:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:active:bg-zinc-700"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (
                typeof window !== "undefined" &&
                window.matchMedia("(min-width: 768px)").matches
              ) {
                return;
              }
              requestAnimationFrame(() => {
                inputRef.current?.scrollIntoView({
                  block: "nearest",
                  behavior: "smooth",
                });
              });
            }}
            placeholder="メッセージを入力..."
            rows={1}
            enterKeyHint="send"
            inputMode="text"
            autoComplete="off"
            autoCorrect="on"
            className="min-h-[44px] max-h-32 flex-1 resize-none rounded-[24px] border border-[#ccc4b4] bg-white px-4 py-2.5 text-[16px] leading-snug text-[#0e1610] placeholder:text-[#a8a090] focus:outline-none focus:ring-1 focus:ring-[#1e3848]/40 md:min-h-[40px] md:text-[13px]"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={sending || !content.trim()}
            className="flex h-10 shrink-0 items-center justify-center rounded-[20px] bg-[#1e3848] px-4 text-[13px] font-medium text-[#f4f0e8] hover:opacity-90 active:opacity-95 disabled:opacity-40"
            aria-label="送信"
          >
            {sending ? "…" : "送信"}
          </button>
        </div>
      </div>
    </div>
  );
}
