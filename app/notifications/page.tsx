"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { ProfileEmptyCard } from "@/components/profile/profile-empty-card";
import { getLoginUrl } from "@/lib/auth-utils";

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const { user, loading: authLoading } = useSupabaseUser();

  const loginHref = getLoginUrl("/notifications");

  const load = async () => {
    if (!user) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }
    try {
      const res = await fetchWithTimeout("/api/notifications");
      if (res.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAuthRequired(false);
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const formatDate = (s: string) => {
    const d = new Date(s);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "たった今";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    return d.toLocaleDateString("ja-JP");
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4">
        <div className="mx-auto max-w-md pt-12">
          <ProfileEmptyCard
            title="ログインが必要です"
            description="お知らせを利用するにはログインしてください"
            ctaLabel="ログイン"
            ctaHref={loginHref}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              お知らせ
            </h1>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
              >
                {markingAll ? "処理中..." : "すべて既読にする"}
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center dark:border-zinc-800/50 dark:bg-zinc-900/50">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              お知らせはありません
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              イベントを探して、参加やチャットを始めましょう
            </p>
            <Link
              href="/events"
              className="mt-4 inline-block rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              イベント一覧を見る
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link ?? "/notifications"}
                  className={`block rounded-lg border p-4 transition-colors ${
                    n.read_at
                      ? "border-zinc-200/60 bg-white dark:border-zinc-700 dark:bg-zinc-900/50"
                      : "border-[var(--accent)]/30 bg-[var(--accent-soft)]/20 dark:bg-[var(--accent-soft)]/10"
                  }`}
                  onClick={() => !n.read_at && handleMarkAsRead(n.id)}
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    {formatDate(n.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-500 underline hover:text-zinc-700"
          >
            トップへ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
