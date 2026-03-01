"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  type?: "user" | "system";
  sender?: { display_name: string | null; email: string | null };
};

type ParticipantStatus =
  | "applied"
  | "confirmed"
  | "declined"
  | "change_requested"
  | "checked_in"
  | "completed";

const STATUS_BUTTONS: { status: ParticipantStatus; label: string }[] = [
  { status: "confirmed", label: "参加確定" },
  { status: "declined", label: "辞退" },
  { status: "change_requested", label: "変更希望" },
  { status: "checked_in", label: "集合確認済み" },
];

type ChatRoomProps = {
  roomId: string;
  currentUserId: string;
  otherPartyName: string;
  eventId?: string;
  isParticipant?: boolean;
  participantId?: string | null;
};

export function ChatRoom({
  roomId,
  currentUserId,
  otherPartyName,
  eventId,
  isParticipant = false,
  participantId,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantStatus, setParticipantStatus] = useState<ParticipantStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
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
      const res = await fetchWithTimeout(`/api/chat/rooms/${roomId}/messages`);
      if (!res.ok) {
        setError(
          res.status === 503
            ? "Supabase 連携が必要です"
            : "読み込みに失敗しました。通信環境を確認してください。"
        );
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

  useEffect(() => {
    if (!eventId || !participantId) return;
    let cancelled = false;
    fetchWithTimeout(`/api/chat/rooms/${roomId}/status`)
      .then((r) => (r.ok ? r.json() : { status: null }))
      .then((data) => {
        if (!cancelled) setParticipantStatus(data?.status ?? null);
      })
      .catch(() => {
        if (!cancelled) setParticipantStatus(null);
      });
    return () => { cancelled = true; };
  }, [roomId, eventId, participantId]);

  const handleStatusClick = async (status: ParticipantStatus) => {
    if (statusLoading) return;
    setStatusLoading(status);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setParticipantStatus(status);
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      } else {
        setError(data.error ?? "ステータスの更新に失敗しました");
      }
    } catch {
      setError("通信に失敗しました");
    } finally {
      setStatusLoading(null);
    }
  };

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

  const showStatusButtons = eventId && participantId;
  const participantButtons = STATUS_BUTTONS.filter((b) =>
    isParticipant ? b.status !== "checked_in" : b.status === "checked_in"
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchWithTimeout(`/api/chat/rooms/${roomId}/messages`)
              .then((r) => {
                if (!r.ok) throw new Error("failed");
                return r.json();
              })
              .then((data) => setMessages(Array.isArray(data) ? data : []))
              .catch(() => setError("通信に失敗しました"))
              .finally(() => setLoading(false));
          }}
          className="text-sm text-[var(--accent)] underline"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[480px] flex-col rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-zinc-200/60 px-4 py-2 dark:border-zinc-700">
        <p className="text-sm font-medium">{otherPartyName}</p>
        {showStatusButtons && participantStatus && (
          <p className="mt-1 text-xs text-zinc-500">
            現在のステータス:{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {STATUS_BUTTONS.find((b) => b.status === participantStatus)?.label ?? participantStatus}
            </span>
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">メッセージがありません</p>
        ) : (
          messages.map((m) => {
            const isSystem = m.type === "system";
            if (isSystem) {
              return (
                <div key={m.id} className="flex justify-start pl-1">
                  <div className="flex min-w-0 max-w-[90%] items-start gap-2">
                    <div
                      className="flex shrink-0 flex-col items-center pt-0.5"
                      aria-hidden
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: "var(--mg-accent)" }}
                      />
                      <div
                        className="mt-1 h-full min-h-[1em] w-px opacity-30"
                        style={{ backgroundColor: "var(--mg-muted)" }}
                      />
                    </div>
                    <div className="rounded-lg px-3 py-2">
                      <p className="text-xs text-[var(--mg-muted)]">{m.content}</p>
                      <p className="mt-1 text-[10px] text-[var(--mg-muted)]/70">
                        {new Date(m.created_at).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
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
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                  <p
                    className={`mt-1 text-xs ${
                      isOwn ? "text-white/80" : "text-zinc-500 dark:text-zinc-400"
                    }`}
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
      {showStatusButtons && participantButtons.length > 0 && (
        <div className="border-t border-zinc-200/60 px-3 py-2 dark:border-zinc-700">
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ステータスを更新
          </p>
          <div className="flex flex-wrap gap-2">
            {participantButtons.map(({ status, label }) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusClick(status)}
                disabled={statusLoading !== null || participantStatus === status}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  participantStatus === status
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                } disabled:opacity-50`}
              >
                {statusLoading === status ? "更新中..." : label}
              </button>
            ))}
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-200/60 p-3 dark:border-zinc-700"
      >
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
