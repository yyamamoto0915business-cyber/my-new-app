"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { createClient } from "@/lib/supabase/client";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type InboxItem = {
  conversation_id: string;
  other_user_id: string;
  other_display_name: string | null;
  other_avatar_url: string | null;
};

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { user, loading: authLoading } = useSupabaseUser();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<InboxItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setConversationId(p.conversationId));
  }, [params]);

  const currentUserId = user?.id ?? (AUTH_DISABLED ? "dev-user" : null);

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
        // 相手情報を inbox から取得
        const inboxRes = await fetchWithTimeout("/api/messages/inbox");
        if (inboxRes.ok) {
          const items: InboxItem[] = await inboxRes.json();
          const found = items.find((i) => i.conversation_id === conversationId);
          if (found) setOtherUser(found);
        }

        // メッセージ取得
        const msgRes = await fetchWithTimeout(
          `/api/messages/conversations/${conversationId}/messages`
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
        });
      } catch (e) {
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
    const supabase = createClient();
    if (!supabase) return;

    setSending(true);
    try {
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: text,
        })
        .select("id, conversation_id, sender_id, content, created_at")
        .single();

      if (insertError) {
        setError(insertError.message ?? "送信に失敗しました");
        return;
      }
      setContent("");
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data as Message];
      });
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
          href={`/login?returnTo=/messages/${conversationId}`}
          className="text-[var(--accent)] underline underline-offset-2"
        >
          ログイン
        </Link>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:h-[calc(100vh-0px)]">
      {/* ヘッダー */}
      <header className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] bg-white px-4 py-3 dark:bg-zinc-900">
        <Link
          href="/messages"
          className="flex items-center text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
        </Link>
        <div className="flex h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          {otherUser?.other_avatar_url ? (
            <img
              src={otherUser.other_avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-medium text-zinc-500">
              {(otherUser?.other_display_name || "?")[0]}
            </span>
          )}
        </div>
        <p className="font-medium">
          {otherUser?.other_display_name || "ユーザー"}
        </p>
      </header>

      {/* メッセージ一覧 */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        {messages.map((m) => {
          const isOwn = m.sender_id === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? "rounded-br-md bg-[var(--accent)] text-white"
                    : "rounded-bl-md bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">
                  {m.content}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    isOwn ? "text-white/80" : "text-zinc-500"
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
        <div ref={bottomRef} />
      </div>

      {/* 入力欄: Enter送信 / Shift+Enter改行 */}
      <div className="shrink-0 border-t border-[var(--border)] bg-white p-4 dark:bg-zinc-900">
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... (Enterで送信)"
            rows={1}
            className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-[var(--border)] bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 dark:bg-zinc-800"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={sending || !content.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
