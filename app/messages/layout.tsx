"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { InboxItem } from "@/lib/inbox-queries";
import { ProfileEmptyCard } from "@/components/profile/profile-empty-card";
import { getLoginUrl } from "@/lib/auth-utils";
import { getModeFromCookie, type ModePreference } from "@/lib/mode-preference";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

const API_CREDENTIALS: RequestInit = { credentials: "include" };

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "たった今";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
  if (diff < 86400000 && d.getDate() === now.getDate())
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}日前`;
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseUser();
  const authRequired = !user && !AUTH_DISABLED;
  const loginHref = getLoginUrl(pathname ?? "/messages");
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const conversationId = pathname?.split("/").filter(Boolean)[1]; // messages/[id] -> id

  const [mode, setMode] = useState<ModePreference>(null);

  useEffect(() => {
    // ModeSegmentNav と同じ cookie を使い、一覧ヘッダーにも短い説明を出す
    setMode(getModeFromCookie());
  }, []);

  // 未読を優先し、次に最終更新日時が新しいものを上に表示
  const sortedItems = [...items].sort((a, b) => {
    const aUnread = a.unread_count > 0 ? 1 : 0;
    const bUnread = b.unread_count > 0 ? 1 : 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    const aAt = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bAt = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bAt - aAt;
  });

  useEffect(() => {
    if (!user && !AUTH_DISABLED) {
      setLoading(false);
      return;
    }
    if (AUTH_DISABLED) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchWithTimeout("/api/messages/inbox", API_CREDENTIALS)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          const msg =
            data?.error ??
            (r.status === 401 ? "ログインが必要です" : "取得に失敗しました");
          const detail = data?.detail ? `（${data.detail}）` : "";
          throw new Error(`${msg}${detail}`);
        }
        return data as InboxItem[];
      })
      .then((data) => setItems(data ?? []))
      .catch((e) => {
        const msg = e?.message ?? "取得に失敗しました";
        const needDbUrl =
          /schema cache|could not find the (table|function)|SUPABASE_DB_URL|設定されていません/i.test(
            msg
          );
        const isDbAuthError = /password authentication|DB接続に失敗/i.test(msg);
        setError(
          isDbAuthError
            ? `DB接続エラー: ${msg}（SUPABASE_DB_PASSWORD が正しいか確認し、サーバーを再起動してください）`
            : needDbUrl
              ? "SUPABASE_DB_URL を .env.local に追加してください（docs/MESSAGES_SETUP.md 参照）"
              : msg
        );
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <ProfileEmptyCard
            title="ログインが必要です"
            description="メッセージを利用するにはログインしてください"
            ctaLabel="ログイン"
            ctaHref={loginHref}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* 左: トーク一覧 (スマホで会話中は非表示) */}
      <aside
        className={`w-full border-b border-[var(--border)] bg-white md:w-80 md:flex-shrink-0 md:border-b-0 md:border-r dark:bg-zinc-900 ${
          conversationId ? "hidden md:block" : ""
        }`}
      >
        <div className="flex flex-col gap-1 border-b border-[var(--border)] px-4 py-4">
          <h1 className="text-lg font-semibold">メッセージ</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            イベントごとのやり取りを確認できます
          </p>
          {mode && (
            <p className="mt-1 text-[11px] font-medium text-[var(--accent)]">
              {mode === "ORGANIZER"
                ? "主催としてのやり取り"
                : mode === "VOLUNTEER"
                  ? "ボランティア関連のやり取り"
                  : "参加者としてのやり取り"}
            </p>
          )}
        </div>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto md:max-h-[calc(100vh-4rem)]">
          {error && (
            <div className="p-4">
              <div className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-4 dark:border-red-800/40 dark:bg-red-950/20">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">読み込みに失敗しました</p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-200">{error}</p>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  再読み込み
                </button>
              </div>
            </div>
          )}

          {loading && !error && (
            <div className="space-y-3 px-4 py-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 dark:border-zinc-700/60 dark:bg-zinc-900/30"
                >
                  <div className="h-12 w-12 rounded-full bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-2/3 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                    <div className="mt-2 h-4 w-3/4 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                  </div>
                  <div className="h-4 w-10 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          )}

          {!error && !loading && sortedItems.length === 0 && (
            <div className="p-4">
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 text-center dark:border-zinc-700/60 dark:bg-zinc-900/95">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
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
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">まだメッセージがありません</h3>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  イベント詳細ページから主催者へメッセージできます。
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  気になることがあれば、まずは質問してみましょう。
                </p>
                <Link
                  href="/events"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  イベントを探す
                </Link>
              </div>
            </div>
          )}

          {!error && sortedItems.length > 0 && (
            <ul className="space-y-3 px-4 py-3">
              {sortedItems.map((item) => {
                const isActive = item.conversation_id === conversationId;
                const eventInitial = (item.event_title ?? "イベント")[0];
                return (
                  <li key={item.conversation_id}>
                    <Link
                      href={`/messages/${item.conversation_id}`}
                      className={`flex min-h-[72px] items-center gap-3 rounded-2xl border px-4 py-3 ${
                        isActive
                          ? "border-[var(--accent)] bg-[var(--accent)]/5"
                          : item.unread_count > 0
                            ? "border-[var(--accent)]/40 bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 dark:border-[var(--accent)]/30 dark:bg-zinc-950/20"
                            : "border-zinc-200/80 bg-white hover:bg-zinc-50 dark:border-zinc-700/60 dark:bg-zinc-950/30 dark:hover:bg-zinc-900/30"
                      }`}
                    >
                      <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--accent)]/10">
                        <span className="text-lg font-semibold text-[var(--accent)]">{eventInitial}</span>
                        {item.unread_count > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-xs font-semibold text-white">
                            {item.unread_count > 99 ? "99+" : item.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`line-clamp-2 text-sm font-semibold ${item.unread_count > 0 ? "text-[var(--accent)] dark:text-[var(--accent)]" : "text-zinc-900 dark:text-zinc-100"}`}>
                          {item.event_title ?? "イベント"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                          {item.other_display_name || "主催者"}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {item.last_message_content || "メッセージがありません"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {item.last_message_at && (
                          <span className="text-xs text-zinc-400">{formatRelative(item.last_message_at)}</span>
                        )}
                        {item.unread_count > 0 && (
                          <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                            未読
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* 右: プレースホルダー or 会話 (PC時) / スマホでは children がフル表示 */}
      <main className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        {children}
      </main>
    </div>
  );
}
