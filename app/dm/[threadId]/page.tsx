"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

type Thread = {
  id: string;
  eventId: string;
  volunteerRoleId: string;
  organizerId: string;
  volunteerId: string;
  status: string;
};

export default function DmPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { data: session, status } = useSession();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setThreadId(p.threadId));
  }, [params]);

  useEffect(() => {
    if (!threadId || (!session?.user && !AUTH_DISABLED)) return;
    setLoading(true);
    setError(null);
    fetchWithTimeout(`/api/dm/${threadId}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "スレッドが見つかりません" : "読み込みに失敗しました");
        return r.json();
      })
      .then((data) => {
        setThread(data.thread);
        setMessages(data.messages ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [threadId, session?.user, AUTH_DISABLED]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !threadId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/dm/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: content.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.id) {
        setMessages((prev) => [...prev, data]);
        setContent("");
      } else if (!res.ok) {
        setError(data.error ?? "送信に失敗しました");
      }
    } catch {
      setError("通信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: "open" | "resolved") => {
    if (!threadId) return;
    await fetch(`/api/dm/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (thread) setThread({ ...thread, status });
  };

  if (status === "loading" || !threadId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (status === "unauthenticated" && !AUTH_DISABLED) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>ログインが必要です</p>
        <Link href={`/login?returnTo=/dm/${threadId}`} className="text-[var(--accent)] underline">
          ログイン
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-[var(--accent)] underline"
        >
          再読み込み
        </button>
        <Link href="/?mode=select" className="ml-4 text-sm text-zinc-600 underline">
          ← トップへ
        </Link>
      </div>
    );
  }

  const userId = AUTH_DISABLED ? "dev-user" : session?.user?.id;
  const isOrganizer = thread && userId === thread.organizerId;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href={isOrganizer ? "/organizer/inbox" : "/volunteer"} className="text-sm text-zinc-500 hover:underline">
            ← 戻る
          </Link>
          <h1 className="text-lg font-semibold">1対1DM</h1>
          {isOrganizer && (
            <select
              value={thread?.status}
              onChange={(e) => handleStatusChange(e.target.value as "open" | "resolved")}
              className="rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="open">対応中</option>
              <option value="resolved">完了</option>
            </select>
          )}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4">
        <div className="flex-1 space-y-3 overflow-y-auto pb-4">
          {messages.map((m) => {
            const isOwn = m.senderId === userId;
            return (
              <div
                key={m.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isOwn ? "bg-[var(--accent)] text-white" : "bg-zinc-100 dark:bg-zinc-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                  <p className={`mt-1 text-xs ${isOwn ? "text-white/80" : "text-zinc-500"}`}>
                    {new Date(m.createdAt).toLocaleString("ja-JP")}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSend} className="flex gap-2 border-t border-zinc-200/60 pt-4 dark:border-zinc-700">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 rounded-lg border border-zinc-200/60 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            送信
          </button>
        </form>
      </main>
    </div>
  );
}
