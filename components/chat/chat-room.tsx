"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: { display_name: string | null; email: string | null };
};

type ChatRoomProps = {
  roomId: string;
  currentUserId: string;
  otherPartyName: string;
};

export function ChatRoom({
  roomId,
  currentUserId,
  otherPartyName,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    let channel: { unsubscribe: () => void } | null = null;

    const fetchMessages = async () => {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (!res.ok) {
        setError(res.status === 503 ? "Supabase 連携が必要です" : "読み込みに失敗しました");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      setLoading(false);
    };

    fetchMessages();

    const supabase = createClient();
    if (supabase) {
      channel = supabase
        .channel(`chat:${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
          }
        )
        .subscribe();
    }

    return () => {
      channel?.unsubscribe();
    };
  }, [roomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    });
    setSending(false);
    if (res.ok) {
      setContent("");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "送信に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[400px] flex-col rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-zinc-200/60 px-4 py-2 dark:border-zinc-700">
        <p className="text-sm font-medium">{otherPartyName}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">メッセージがありません</p>
        ) : (
          messages.map((m) => {
            const isOwn = m.sender_id === currentUserId;
            const name = isOwn
              ? "自分"
              : m.sender?.display_name ?? m.sender?.email ?? "参加者";
            return (
              <div
                key={m.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isOwn
                      ? "bg-[var(--accent)] text-white"
                      : "bg-zinc-100 dark:bg-zinc-800"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {name}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {m.content}
                  </p>
                  <p
                    className={`mt-1 text-xs ${isOwn ? "text-white/80" : "text-zinc-500 dark:text-zinc-400"}`}
                  >
                    {new Date(m.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t border-zinc-200/60 p-3 dark:border-zinc-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 rounded-lg border border-zinc-200/60 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
}
