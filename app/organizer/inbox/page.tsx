"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type Thread = {
  id: string;
  eventId: string;
  volunteerRoleId: string;
  status: string;
  lastMessageAt: string;
  partnerName: string;
};

export default function OrganizerInboxPage() {
  const { data: session, status } = useSession();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError(null);
    fetchWithTimeout("/api/dm/threads?as=organizer")
      .then((r) => r.json())
      .then((data) => setThreads(Array.isArray(data) ? data : []))
      .catch(() => {
        setThreads([]);
        setError("読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>ログインが必要です</p>
        <Link href="/login?returnTo=/organizer/inbox" className="text-[var(--accent)] underline">
          ログイン
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link href="/organizer/events" className="text-sm text-zinc-500 hover:underline">
            ← 主催者トップ
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            受信トレイ（DM一覧）
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <p className="text-zinc-500">読み込み中...</p>
        ) : error ? (
          <div>
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-[var(--accent)] underline"
            >
              再読み込み
            </button>
          </div>
        ) : threads.length === 0 ? (
          <p className="rounded-xl border border-zinc-200/60 bg-white/80 p-8 text-center text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-900/80">
            ボランティアからの相談はまだありません
          </p>
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/dm/${t.id}`}
                  className="block rounded-xl border border-zinc-200/60 bg-white/80 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:hover:bg-zinc-800/80"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t.partnerName}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        t.status === "resolved"
                          ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {t.status === "resolved" ? "完了" : "対応中"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    最終メッセージ: {new Date(t.lastMessageAt).toLocaleString("ja-JP")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
