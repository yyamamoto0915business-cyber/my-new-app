"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { InboxItem } from "@/lib/inbox-queries";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

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
  const { user, loading: authLoading } = useSupabaseUser();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const conversationId = pathname?.split("/").filter(Boolean)[1]; // messages/[id] -> id

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
    fetchWithTimeout("/api/messages/inbox")
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

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* 左: トーク一覧 (スマホで会話中は非表示) */}
      <aside
        className={`w-full border-b border-[var(--border)] bg-white md:w-80 md:flex-shrink-0 md:border-b-0 md:border-r dark:bg-zinc-900 ${
          conversationId ? "hidden md:block" : ""
        }`}
      >
        <div className="flex h-14 items-center border-b border-[var(--border)] px-4">
          <h1 className="text-lg font-semibold">メッセージ</h1>
        </div>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto md:max-h-[calc(100vh-4rem)]">
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}
          {!error && !loading && items.length === 0 && (
            <div className="p-6 text-center text-sm text-zinc-500">
              まだメッセージはありません
            </div>
          )}
          {!error && items.length > 0 && (
            <ul className="divide-y divide-[var(--border)]">
              {items.map((item) => {
                const isActive = item.conversation_id === conversationId;
                return (
                  <li key={item.conversation_id}>
                    <Link
                      href={`/messages/${item.conversation_id}`}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        isActive
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="relative flex h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        {item.other_avatar_url ? (
                          <img
                            src={item.other_avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-lg font-medium text-zinc-500">
                            {(item.other_display_name || "?")[0]}
                          </span>
                        )}
                        {item.unread_count > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-xs font-medium text-white">
                            {item.unread_count > 99 ? "99+" : item.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {item.other_display_name || "ユーザー"}
                        </p>
                        <p className="truncate text-sm text-zinc-500">
                          {item.last_message_content || "メッセージがありません"}
                        </p>
                      </div>
                      {item.last_message_at && (
                        <span className="text-xs text-zinc-400">
                          {formatRelative(item.last_message_at)}
                        </span>
                      )}
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
