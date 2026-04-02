"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { RecruitmentForm } from "@/components/recruitment-form";
import { ChatRoom } from "@/components/chat/chat-room";
import { ApplicationSummaryCards } from "@/components/organizer/applications/ApplicationSummaryCards";
import {
  ApplicationToolbar,
  type StatusFilter,
  type SortOption,
} from "@/components/organizer/applications/ApplicationToolbar";
import {
  ApplicationCard,
  type Application,
} from "@/components/organizer/applications/ApplicationCard";
import { ApplicationsEmptyState } from "@/components/organizer/applications/ApplicationsEmptyState";
import { ApplicationDetailSheet } from "@/components/organizer/applications/ApplicationDetailSheet";

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

const RECRUITMENT_STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  public: "募集中",
  closed: "終了",
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [detailApp, setDetailApp] = useState<Application | null>(null);
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
    let list = applications;
    if (statusFilter === "pending") list = list.filter((a) => a.status === "pending");
    else if (statusFilter === "accepted")
      list = list.filter((a) => a.status === "accepted" || a.status === "confirmed");
    else if (statusFilter === "rejected") list = list.filter((a) => a.status === "rejected");

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          (a.user?.display_name ?? "").toLowerCase().includes(q) ||
          (a.user?.email ?? "").toLowerCase().includes(q) ||
          (a.message ?? "").toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    if (sortBy === "created_asc") sorted.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    else if (sortBy === "created_desc") sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    else if (sortBy === "name_asc")
      sorted.sort((a, b) =>
        (a.user?.display_name ?? "").localeCompare(b.user?.display_name ?? "", "ja")
      );
    return sorted;
  }, [applications, statusFilter, searchQuery, sortBy]);

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
              ← スタッフ募集管理へ
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
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/organizer/recruitments"
            className="text-sm text-slate-500 hover:underline"
          >
            ← スタッフ募集管理へ
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-slate-800">応募管理</h1>
          <p className="mt-1 text-base font-medium text-slate-900">{recruitment.title}</p>
          <p className="mt-0.5 text-sm text-slate-500">
            参加者情報や応募状況を確認・対応できます
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              編集
            </button>
            <Link
              href={`/organizer/recruitments/${resolvedId}/day-of`}
              className="rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
            >
              当日管理へ
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24 space-y-6">
        {/* (2) 募集概要（コンパクト） */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="sr-only">募集概要</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${statusBadgeClass}`}
            >
              {RECRUITMENT_STATUS_LABELS[recruitment.status] ?? recruitment.status}
            </span>
            <span className="text-sm text-slate-600">
              {formatDateTime(recruitment.start_at)}
              {recruitment.end_at && ` ～ ${formatDateTime(recruitment.end_at)}`}
            </span>
            {recruitment.capacity != null && recruitment.capacity > 0 && (
              <span className="text-sm text-slate-500">定員 {recruitment.capacity}名</span>
            )}
          </div>
        </section>

        {/* (3) サマリーカード */}
        <ApplicationSummaryCards
          total={applications.length}
          pendingCount={pendingCount}
          acceptedCount={acceptedCount}
          rejectedCount={rejectedCount}
          capacity={recruitment.capacity ?? null}
        />

        {/* (4) 一斉送信（承認済みがある場合） */}
        {acceptedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <select
              value={bulkTemplate}
              onChange={(e) => setBulkTemplate(e.target.value)}
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
              aria-label="メッセージテンプレート"
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
              className="rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {bulkSending ? "送信中..." : `一斉送信（${acceptedCount}名）`}
            </button>
          </div>
        )}

        {/* (5) 検索・絞り込み・並び替え */}
        <ApplicationToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* (6) 応募者一覧 */}
        <section>
          {filteredApplications.length === 0 ? (
            <ApplicationsEmptyState
              hasFilter={!!searchQuery.trim() || statusFilter !== "all"}
              recruitmentId={resolvedId!}
            />
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onChat={setChatParticipantId}
                  onDetail={setDetailApp}
                />
              ))}
            </div>
          )}
        </section>

        {/* (7) 募集内容（折りたたみ） */}
        {recruitment.description && (
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setContentOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <h2 className="font-semibold text-slate-900">募集内容</h2>
              <span className="text-sm text-slate-500">{contentOpen ? "閉じる" : "開く"}</span>
            </button>
            {contentOpen && (
              <div className="border-t border-slate-100 px-4 py-4">
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:mb-3">
                  {recruitment.description.split(/\n\n+/).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* 応募者詳細スライドオーバー */}
      <ApplicationDetailSheet application={detailApp} onClose={() => setDetailApp(null)} />

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
