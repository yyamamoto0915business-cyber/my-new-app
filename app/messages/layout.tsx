"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { InboxItem } from "@/lib/inbox-queries";
import { ProfileEmptyCard } from "@/components/profile/profile-empty-card";
import { CommonAvatar } from "@/components/profile/common-avatar";
import { getLoginUrl } from "@/lib/auth-utils";
import { getModeFromCookie, type ModePreference } from "@/lib/mode-preference";
import { resolveAvatarUrlByRole } from "@/lib/profile-avatar";

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

function getDisplayName(item: InboxItem): string {
  const name = item.other_display_name?.trim();
  if (name) return name;
  const emailName = item.other_email?.split("@")[0]?.trim();
  if (emailName) return emailName;
  if (item.my_role === "organizer") {
    return item.conversation_kind === "general" ? "応募者" : "参加者";
  }
  return "主催者";
}

function getCounterpartAvatar(item: InboxItem): string | null {
  const counterpartRole = item.my_role === "organizer" ? "participant" : "organizer";
  return resolveAvatarUrlByRole(
    {
      avatar_url: item.other_avatar_url,
      participant_avatar_url: item.other_participant_avatar_url,
      organizer_avatar_url: item.other_organizer_avatar_url,
    },
    counterpartRole
  );
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
  const organizerItems = sortedItems.filter((item) => item.my_role === "organizer");
  const volunteerItems = sortedItems.filter((item) => item.my_role === "volunteer");
  const organizerSectionTitle =
    "主催者としてのやり取り（応募者・参加者）";
  const volunteerSectionTitle =
    mode === "VOLUNTEER" ? "ボランティアとしてのやり取り" : "参加者としてのやり取り";

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
    <div className="flex min-h-screen flex-col md:min-h-0 md:flex-1 md:flex-row">
      {/* 左: トーク一覧 (スマホで会話中は非表示) */}
      <aside
        className={`w-full border-b border-[#ccc4b4] bg-[#faf8f2] md:w-80 md:flex-shrink-0 md:border-b-0 md:border-r min-[900px]:w-[240px] dark:bg-zinc-900 ${
          conversationId ? "hidden md:block" : ""
        }`}
      >
        {/* スレッドリストヘッダー */}
        <div className="border-b border-[#ccc4b4] px-4 py-4">
          <h1
            className="text-[16px] font-semibold text-[#0e1610]"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            メッセージ
          </h1>
          {mode && (
            <p className="mt-0.5 whitespace-nowrap text-[10px] tracking-wide text-[#6a6258]">
              {mode === "ORGANIZER"
                ? "主催としてのやり取り"
                : mode === "VOLUNTEER"
                  ? "ボランティア関連のやり取り"
                  : "参加者としてのやり取り"}
            </p>
          )}
        </div>

        <div className="overflow-y-auto">
          {error && (
            <div className="p-4">
              <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3">
                <p className="text-[12px] font-medium text-red-700">読み込みに失敗しました</p>
                <p className="mt-0.5 text-[11px] text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="mt-2 text-[11px] font-medium text-[#2c7a88] underline underline-offset-2"
                >
                  再読み込み
                </button>
              </div>
            </div>
          )}

          {loading && !error && (
            <div className="animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-[#e8e0d4] px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-[#e4ede0]" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-2/3 rounded bg-[#e4ede0]" />
                    <div className="mt-2 h-3 w-3/4 rounded bg-[#e4ede0]" />
                  </div>
                  <div className="h-3 w-8 rounded bg-[#e4ede0]" />
                </div>
              ))}
            </div>
          )}

          {!error && !loading && sortedItems.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-[#6a6258]">まだメッセージがありません</p>
              <Link
                href="/events"
                className="mt-4 inline-flex items-center rounded-full bg-[#1e3848] px-5 py-2 text-[12px] font-medium text-[#f4f0e8] hover:opacity-90"
              >
                イベントを探す
              </Link>
            </div>
          )}

          {!error && sortedItems.length > 0 && (
            <ul>
              {organizerItems.length > 0 && volunteerItems.length > 0 && (
                <li className="border-b border-[#e8e0d4] px-4 py-1.5">
                  <span className="text-[10px] tracking-[0.12em] text-[#a8a090]">{organizerSectionTitle}</span>
                </li>
              )}
              {organizerItems.map((item) => {
                const active = item.conversation_id === conversationId;
                return (
                  <li key={item.conversation_id}>
                    <Link
                      href={`/messages/${item.conversation_id}`}
                      prefetch
                      className={`flex touch-manipulation items-center gap-3 border-b border-[#e8e0d4] px-4 py-3 transition-colors ${
                        active ? "bg-[#eef6f2]" : "bg-[#faf8f2] hover:bg-[#f0ece4]"
                      }`}
                    >
                      <CommonAvatar
                        avatarUrl={getCounterpartAvatar(item)}
                        displayName={getDisplayName(item)}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="truncate text-[13px] font-semibold text-[#0e1610]"
                            style={{ fontFamily: "'Shippori Mincho', serif" }}
                          >
                            {getDisplayName(item)}
                          </p>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {item.last_message_at && (
                              <span className="whitespace-nowrap text-[11px] text-[#a8a090]">
                                {formatRelative(item.last_message_at)}
                              </span>
                            )}
                            {item.unread_count > 0 && (
                              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#2c7a88]" />
                            )}
                          </div>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-[#6a6258]">
                          {item.last_message_content || item.event_title || "メッセージがありません"}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}

              {organizerItems.length > 0 && volunteerItems.length > 0 && (
                <li className="border-b border-[#e8e0d4] px-4 py-1.5">
                  <span className="text-[10px] tracking-[0.12em] text-[#a8a090]">{volunteerSectionTitle}</span>
                </li>
              )}
              {volunteerItems.map((item) => {
                const active = item.conversation_id === conversationId;
                return (
                  <li key={item.conversation_id}>
                    <Link
                      href={`/messages/${item.conversation_id}`}
                      prefetch
                      className={`flex touch-manipulation items-center gap-3 border-b border-[#e8e0d4] px-4 py-3 transition-colors ${
                        active ? "bg-[#eef6f2]" : "bg-[#faf8f2] hover:bg-[#f0ece4]"
                      }`}
                    >
                      <CommonAvatar
                        avatarUrl={getCounterpartAvatar(item)}
                        displayName={getDisplayName(item)}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="truncate text-[13px] font-semibold text-[#0e1610]"
                            style={{ fontFamily: "'Shippori Mincho', serif" }}
                          >
                            {getDisplayName(item)}
                          </p>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {item.last_message_at && (
                              <span className="whitespace-nowrap text-[11px] text-[#a8a090]">
                                {formatRelative(item.last_message_at)}
                              </span>
                            )}
                            {item.unread_count > 0 && (
                              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#2c7a88]" />
                            )}
                          </div>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-[#6a6258]">
                          {item.last_message_content || item.event_title || "メッセージがありません"}
                        </p>
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
      <main className="flex min-h-0 flex-1 flex-col bg-[#f4f0e8] dark:bg-zinc-950 md:min-h-screen">
        {children}
      </main>
    </div>
  );
}
