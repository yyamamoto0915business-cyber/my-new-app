"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { RecruitmentForm } from "@/components/recruitment-form";
import { ChatRoom } from "@/components/chat/chat-room";

type Recruitment = {
  id: string;
  title: string;
  status: string;
  description?: string;
  meeting_place: string | null;
  start_at: string | null;
  end_at?: string | null;
  capacity?: number | null;
  roles: { name: string; count: number }[];
};

type Application = {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
  role_assigned: string | null;
  checked_in_at: string | null;
  created_at?: string;
  user?: { display_name: string | null; email: string | null };
};

const RECRUITMENT_STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  public: "募集中",
  closed: "終了",
};

const APP_STATUS_LABELS: Record<string, string> = {
  pending: "承認待ち",
  accepted: "承認済み",
  rejected: "却下",
  canceled: "キャンセル",
  confirmed: "承認済み",
  applied: "申請中",
  checked_in: "チェックイン済",
  completed: "完了",
};

type AppTab = "pending" | "accepted" | "rejected" | "all";

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  const time = iso.length > 10 ? iso.slice(11, 16) : "";
  return time ? `${date} ${time}` : date;
}

function formatApplicationDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrganizerRecruitmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [chatParticipantId, setChatParticipantId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [appTab, setAppTab] = useState<AppTab>("pending");
  const [contentOpen, setContentOpen] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithTimeout("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data?.user?.id ?? "dev-user"))
      .catch(() => setCurrentUserId("dev-user"));
  }, []);

  useEffect(() => {
    params.then((p) => setResolvedId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!resolvedId) return;
    setLoading(true);
    try {
      const [rRes, aRes] = await Promise.all([
        fetchWithTimeout(`/api/recruitments/${resolvedId}`),
        fetchWithTimeout(`/api/recruitments/${resolvedId}/applications`),
      ]);
      if (rRes.ok) setRecruitment(await rRes.json());
      if (aRes.ok) {
        const appData = await aRes.json();
        setApplications(Array.isArray(appData) ? appData : []);
      }
    } catch {
      setRecruitment(null);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!resolvedId || !chatParticipantId) {
      setRoomId(null);
      return;
    }
    fetchWithTimeout(
      `/api/recruitments/${resolvedId}/chat-room?participantId=${chatParticipantId}`
    )
      .then((r) => r.json())
      .then((data) => setRoomId(data.roomId ?? null))
      .catch(() => setRoomId(null));
  }, [resolvedId, chatParticipantId]);

  const handleAccept = async (appId: string) => {
    const res = await fetchWithTimeout(
      `/api/recruitments/${resolvedId}/applications/${appId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      }
    );
    if (res.ok) load();
  };

  const handleReject = async (appId: string) => {
    const res = await fetchWithTimeout(
      `/api/recruitments/${resolvedId}/applications/${appId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      }
    );
    if (res.ok) load();
  };

  const handleBulkMessage = async () => {
    if (!resolvedId) return;
    setBulkSending(true);
    try {
      const res = await fetchWithTimeout(
        `/api/recruitments/${resolvedId}/bulk-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template: bulkTemplate || undefined,
            content: bulkTemplate ? undefined : "お知らせがあります。",
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.sent != null) {
        alert(`${data.sent}件送信しました`);
      } else {
        alert(data.error ?? "送信に失敗しました");
      }
    } finally {
      setBulkSending(false);
    }
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const acceptedCount = applications.filter(
    (a) => a.status === "accepted" || a.status === "confirmed"
  ).length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  const filteredApplications = useMemo(() => {
    if (appTab === "pending") return applications.filter((a) => a.status === "pending");
    if (appTab === "accepted") return applications.filter((a) => a.status === "accepted" || a.status === "confirmed");
    if (appTab === "rejected") return applications.filter((a) => a.status === "rejected");
    return applications;
  }, [applications, appTab]);

  if (!resolvedId || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--mg-paper)]">
        <p className="text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (!recruitment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--mg-paper)]">
        <p className="text-zinc-500">募集が見つかりません</p>
        <Link href="/organizer/recruitments" className="ml-2 text-[var(--accent)] underline">
          一覧へ
        </Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-[var(--mg-paper)]">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm shadow-sm dark:bg-[var(--background)]">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <Link
              href={`/organizer/recruitments/${resolvedId}`}
              className="text-sm text-[var(--foreground-muted)] hover:underline"
            >
              ← 募集管理へ
            </Link>
            <h1 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              募集を編集
            </h1>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
            <RecruitmentForm
              recruitmentId={resolvedId}
              initialValues={{
                title: recruitment.title,
                description: recruitment.description ?? "",
                status: (recruitment.status === "closed" ? "public" : recruitment.status) as "draft" | "public",
                start_at: recruitment.start_at ?? "",
                end_at: recruitment.end_at ?? "",
                meeting_place: recruitment.meeting_place ?? "",
                meeting_lat: (recruitment as { meeting_lat?: number }).meeting_lat ?? null,
                meeting_lng: (recruitment as { meeting_lng?: number }).meeting_lng ?? null,
                roles: recruitment.roles ?? [],
                capacity: recruitment.capacity ?? null,
                items_to_bring: (recruitment as { items_to_bring?: string }).items_to_bring ?? "",
                provisions: (recruitment as { provisions?: string }).provisions ?? "",
                notes: (recruitment as { notes?: string }).notes ?? "",
              }}
              onSuccess={() => {
                setEditing(false);
                load();
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        </main>
      </div>
    );
  }

  const statusBadgeClass =
    recruitment.status === "public"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      : recruitment.status === "closed"
        ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      {/* (1) ヘッダー sticky */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm shadow-sm dark:bg-[var(--background)]">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/organizer/recruitments"
            className="text-sm text-[var(--foreground-muted)] hover:underline"
          >
            ← 募集管理へ
          </Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                  {recruitment.title}
                </h1>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass}`}
                >
                  {RECRUITMENT_STATUS_LABELS[recruitment.status] ?? recruitment.status}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/messages"
                className="text-sm text-[var(--foreground-muted)] hover:underline"
              >
                メッセージ
              </Link>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                編集
              </button>
              <Link
                href={`/organizer/recruitments/${resolvedId}/day-of`}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                当日管理へ
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24 space-y-6">
        {/* (2) サマリーカード */}
        <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <h2 className="sr-only">募集概要</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-[var(--foreground-muted)]">日時</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
                {formatDateTime(recruitment.start_at)}
                {recruitment.end_at && ` ～ ${formatDateTime(recruitment.end_at)}`}
              </dd>
            </div>
            {recruitment.meeting_place && (
              <div>
                <dt className="text-xs font-medium text-[var(--foreground-muted)]">集合場所</dt>
                <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
                  {recruitment.meeting_place}
                </dd>
              </div>
            )}
            {recruitment.capacity != null && recruitment.capacity > 0 && (
              <div>
                <dt className="text-xs font-medium text-[var(--foreground-muted)]">定員</dt>
                <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
                  {recruitment.capacity}名
                </dd>
              </div>
            )}
            {recruitment.roles?.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-[var(--foreground-muted)]">役割</dt>
                <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
                  <ul className="list-inside list-disc space-y-0.5">
                    {recruitment.roles.map((r, i) => (
                      <li key={i}>
                        {r.name} × {r.count}名
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--border)] pt-4 dark:border-zinc-700">
            <span className="text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {applications.length}
              </span>
              <span className="text-[var(--foreground-muted)]"> 応募</span>
            </span>
            <span className="text-sm">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {acceptedCount}
              </span>
              <span className="text-[var(--foreground-muted)]"> 承認済み</span>
            </span>
            <span className="text-sm">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {pendingCount}
              </span>
              <span className="text-[var(--foreground-muted)]"> 承認待ち</span>
            </span>
          </div>
        </section>

        {/* (3) 応募者パネル（主役） */}
        <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 dark:border-zinc-700">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">応募者</h2>
            {acceptedCount > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={bulkTemplate}
                  onChange={(e) => setBulkTemplate(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs dark:border-zinc-600 dark:bg-zinc-900/50"
                >
                  <option value="">カスタム</option>
                  <option value="reminder">前日リマインド</option>
                  <option value="venue_change">集合場所変更</option>
                  <option value="thanks">お礼メッセージ</option>
                </select>
                <button
                  type="button"
                  onClick={handleBulkMessage}
                  disabled={bulkSending}
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {bulkSending ? "送信中..." : `一斉送信（${acceptedCount}名）`}
                </button>
              </div>
            )}
          </div>

          {/* タブ切替 */}
          <div className="flex gap-0 border-b border-[var(--border)] dark:border-zinc-700">
            {(
              [
                ["pending", "承認待ち", pendingCount],
                ["accepted", "承認済み", acceptedCount],
                ["rejected", "却下", rejectedCount],
                ["all", "すべて", applications.length],
              ] as const
            ).map(([tab, label, count]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAppTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  appTab === tab
                    ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                    : "text-[var(--foreground-muted)] hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                      appTab === tab
                        ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="divide-y divide-[var(--border)] dark:divide-zinc-700">
            {filteredApplications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[var(--foreground-muted)]">
                  {appTab === "pending" && "承認待ちはありません"}
                  {appTab === "accepted" && "承認済みはありません"}
                  {appTab === "rejected" && "却下はありません"}
                  {appTab === "all" && "応募はまだありません"}
                </p>
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {app.user?.display_name ?? app.user_id.slice(0, 8)}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[var(--foreground-muted)]">
                        {formatApplicationDate(app.created_at)}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          app.status === "accepted" || app.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : app.status === "rejected"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        {APP_STATUS_LABELS[app.status] ?? app.status}
                      </span>
                    </div>
                    {app.message && (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--foreground-muted)]">
                        {app.message}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {app.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAccept(app.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                          承認
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(app.id)}
                          className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:hover:bg-red-950/30"
                        >
                          却下
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setChatParticipantId(app.user_id)}
                      className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                    >
                      チャット
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* (4) 募集内容（折りたたみ） */}
        {recruitment.description && (
          <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
            <button
              type="button"
              onClick={() => setContentOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">募集内容</h2>
              <span className="text-[var(--foreground-muted)]">
                {contentOpen ? "閉じる" : "開く"}
              </span>
            </button>
            {contentOpen && (
              <div className="border-t border-[var(--border)] px-4 py-4 dark:border-zinc-700">
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-3">
                  {recruitment.description.split(/\n\n+/).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* チャットモーダル */}
      {chatParticipantId && roomId && (
        <div className="fixed inset-4 top-16 z-50 rounded-xl border border-[var(--border)] bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 md:inset-8 md:top-24">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 dark:border-zinc-700">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                チャット（
                {applications.find((a) => a.user_id === chatParticipantId)?.user?.display_name ??
                  "応募者"}
                ）
              </h3>
              <button
                type="button"
                onClick={() => {
                  setChatParticipantId(null);
                  setRoomId(null);
                }}
                className="rounded-lg px-2 py-1 text-sm text-[var(--foreground-muted)] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                閉じる
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatRoom
                roomId={roomId}
                currentUserId={currentUserId || "dev-user"}
                otherPartyName={
                  applications.find((a) => a.user_id === chatParticipantId)?.user?.display_name ??
                  "応募者"
                }
                participantId={chatParticipantId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
