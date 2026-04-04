"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { createClient } from "@/lib/supabase/client";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { cn } from "@/lib/utils";

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

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { user, loading: authLoading } = useSupabaseUser();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [organizerDisplayName, setOrganizerDisplayName] = useState<string | null>(null);
  const [organizerAvatarUrl, setOrganizerAvatarUrl] = useState<string | null>(null);
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

  useEffect(() => {
    emptySuggestionsAutoOpened.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (loading || messages.length > 0 || emptySuggestionsAutoOpened.current) return;
    emptySuggestionsAutoOpened.current = true;
    setSuggestionsOpen(true);
  }, [conversationId, loading, messages.length]);

  useEffect(() => {
    params.then((p) => setConversationId(p.conversationId));
  }, [params]);

  const currentUserId = user?.id ?? (AUTH_DISABLED ? "dev-user" : null);

  // 会話のメタ情報（イベント名 / 主催者名）
  useEffect(() => {
    if (!conversationId) return;
    setEventId(null);
    setEventTitle(null);
    setOrganizerDisplayName(null);
    setOrganizerAvatarUrl(null);

    fetchWithTimeout(
      `/api/messages/conversations/${conversationId}/meta`,
      API_CREDENTIALS
    )
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error ?? "メタ情報の取得に失敗しました");
        setEventId(data?.eventId ?? null);
        setEventTitle(data?.eventTitle ?? null);
        setOrganizerDisplayName(data?.organizerDisplayName ?? null);
        setOrganizerAvatarUrl(data?.organizerAvatarUrl ?? null);
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
        "flex min-h-0 flex-col bg-[var(--mg-paper)] dark:bg-zinc-950",
        "h-[100dvh] max-h-[100dvh]",
        "md:h-auto md:max-h-none md:flex-1 md:min-h-0"
      )}
    >
      {/* スマホ: 専用コンパクトヘッダー / md: 一覧併用時も同じ情報密度で統一 */}
      <header
        className={cn(
          "z-50 shrink-0 border-b border-[var(--mg-line)] bg-white/95 backdrop-blur-md",
          "pt-[max(0.35rem,env(safe-area-inset-top,0px))] dark:bg-zinc-900/95",
          "md:pt-2"
        )}
      >
        <div className="flex items-start gap-2 px-3 pb-2 md:px-4 md:pb-2.5">
          <Link
            href="/messages"
            className="mt-0.5 flex shrink-0 items-center gap-0.5 rounded-lg py-1.5 pl-0.5 pr-1 text-zinc-500 transition-colors hover:text-zinc-800 active:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:active:bg-zinc-800"
            aria-label="メッセージ一覧へ戻る"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-xs font-medium">戻る</span>
          </Link>

          <div className="flex min-w-0 flex-1 items-start gap-2">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--accent)]/10">
              {organizerAvatarUrl ? (
                <img
                  src={organizerAvatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-[18px] w-[18px] text-[var(--accent)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0z" />
                </svg>
              )}
            </span>
            <div className="min-w-0 flex-1 py-0.5">
              <p className="line-clamp-1 text-[15px] font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                {eventTitle ?? "イベント"}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
                主催者: {organizerDisplayName ?? "主催者"}
              </p>
            </div>
          </div>

          {eventId ? (
            <Link
              href={`/events/${eventId}`}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mg-line)] bg-white text-zinc-600 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="イベントページを開く"
            >
              <CalendarDays className="h-5 w-5" aria-hidden />
            </Link>
          ) : (
            <span className="w-10 shrink-0" aria-hidden />
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
              主催者にメッセージを送ってみましょう
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              イベントについての質問や相談ができます。
            </p>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              参加前の確認にも使えます。
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
                className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 ${
                  isOwn
                    ? "rounded-br-md bg-[var(--accent)] text-white shadow-sm"
                    : "rounded-bl-md border border-[var(--mg-line)] bg-white text-zinc-900 shadow-[var(--mg-shadow)] dark:border-zinc-600/50 dark:bg-zinc-800 dark:text-zinc-50"
                }`}
              >
                <p className="whitespace-pre-wrap break-all break-words text-sm">
                  {m.content}
                </p>
                <p
                  className={`mt-1 text-[11px] leading-none ${
                    isOwn ? "text-white/70" : "text-zinc-500/90"
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
        className="z-40 shrink-0 border-t border-[var(--mg-line)] bg-white/95 px-3 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/95 md:px-4 md:pt-2.5 md:pb-3"
      >
        {!loading && error && (
          <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="mb-2">
          <button
            type="button"
            onClick={() => setSuggestionsOpen((o) => !o)}
            className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-[var(--accent)] hover:underline dark:text-zinc-400"
          >
            {suggestionsOpen ? "候補を隠す" : "返信の候補を表示"}
          </button>
          {suggestionsOpen && (
            <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
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
            placeholder="メッセージを入力"
            rows={1}
            className="min-h-[48px] max-h-32 flex-1 resize-none rounded-[14px] border border-[var(--mg-line)] bg-zinc-50 px-3.5 py-3 text-[15px] leading-snug text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={sending || !content.trim()}
            className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--accent)] text-white shadow-sm hover:opacity-90 active:opacity-95 disabled:opacity-50"
            aria-label="送信"
          >
            {sending ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2v4m0 16v-4m10-6h-4M6 12H2m15.364-7.364l-2.828 2.828M9.464 14.536l-2.828 2.828m12.728 0l-2.828-2.828M9.464 9.464L6.636 6.636"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
