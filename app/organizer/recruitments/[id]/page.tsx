"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { RecruitmentForm } from "@/components/recruitment-form";
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

type BulkMessageResult = {
  sent: number;
  total: number;
  failed: number;
  failedParticipantIds: string[];
};

const RECRUITMENT_STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  public: "募集中",
  closed: "終了",
};

const BULK_TEMPLATE_TEXTS: Record<string, string> = {
  reminder:
    "【前日リマインド】明日の集合をお忘れなく。集合時刻・場所を再度確認の上、余裕を持ってお越しください。",
  venue_change:
    "【集合場所変更】大変お手数ですが、集合場所が変更になりました。このチャットの最新メッセージでご確認ください。",
  thanks: "【お礼】本日はお疲れさまでした。ご協力ありがとうございました。",
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
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkResult, setBulkResult] = useState<BulkMessageResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [detailApp, setDetailApp] = useState<Application | null>(null);
  const [contentOpen, setContentOpen] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

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

  const handleOpenChat = useCallback(
    async (participantId: string) => {
      if (!resolvedId || !participantId) return;
      const organizerId = (recruitment as { organizer_id?: string } | null)?.organizer_id ?? null;
      if (!organizerId) {
        alert("主催者情報の取得に失敗しました");
        return;
      }
      try {
        const res = await fetchWithTimeout(`/api/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizerId,
            otherUserId: participantId,
            kind: "general",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.conversationId) {
          alert(data?.error ?? "チャットの準備に失敗しました");
          return;
        }
        router.push(`/messages/${data.conversationId}`);
      } catch {
        alert("チャットの準備に失敗しました");
      }
    },
    [recruitment, resolvedId, router]
  );

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

  const resolveDisplayName = useCallback((app: Application) => {
    const profileName = app.user?.display_name?.trim();
    if (profileName) return profileName;
    const email = app.user?.email?.trim();
    if (email && email.includes("@")) {
      const localPart = email.split("@")[0]?.trim();
      if (localPart) return localPart;
    }
    return "応募者";
  }, []);

  const handleBulkMessage = async (targetUserIds?: string[]) => {
    if (!resolvedId) return;
    const content = bulkMessage.trim() || BULK_TEMPLATE_TEXTS[bulkTemplate] || "";
    if (!content) {
      alert("送信するメッセージを入力してください");
      return;
    }
    const targetCount = Array.isArray(targetUserIds) && targetUserIds.length > 0 ? targetUserIds.length : acceptedCount;
    const confirmed = window.confirm(
      `承認済み参加者 ${targetCount} 名へ一斉連絡を送信します。\nこの操作を実行しますか？`
    );
    if (!confirmed) return;
    setBulkSending(true);
    try {
      const res = await fetchWithTimeout(
        `/api/recruitments/${resolvedId}/bulk-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template: bulkTemplate || undefined,
            content,
            targetUserIds: targetUserIds && targetUserIds.length > 0 ? targetUserIds : undefined,
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.sent != null) {
        const total = Number(data.total ?? acceptedCount);
        const sent = Number(data.sent ?? 0);
        const failed = Number(data.failed ?? Math.max(0, total - sent));
        if (failed > 0) {
          alert(`一斉送信が完了しました\n成功: ${sent}件 / 失敗: ${failed}件`);
        } else {
          alert(`${sent}件送信しました`);
        }
        setBulkResult({
          sent,
          total,
          failed,
          failedParticipantIds: Array.isArray(data.failedParticipantIds)
            ? data.failedParticipantIds.filter((id: unknown): id is string => typeof id === "string")
            : [],
        });
        setBulkMessage("");
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
  const failedApplications = useMemo(() => {
    if (!bulkResult || bulkResult.failedParticipantIds.length === 0) return [];
    const targetIds = new Set(bulkResult.failedParticipantIds);
    return applications.filter((app) => targetIds.has(app.user_id));
  }, [applications, bulkResult]);

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
    // 常に未確認を上位に表示して、対応漏れを減らす
    sorted.sort((a, b) => {
      const aPending = a.status === "pending" ? 0 : 1;
      const bPending = b.status === "pending" ? 0 : 1;
      return aPending - bPending;
    });
    return sorted;
  }, [applications, statusFilter, searchQuery, sortBy]);

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== "all" || sortBy !== "created_desc";
  const activeFilterLabel =
    statusFilter === "pending"
      ? "未確認のみ"
      : statusFilter === "accepted"
        ? "承認済みのみ"
        : statusFilter === "rejected"
          ? "却下のみ"
          : null;

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("created_desc");
  }, []);

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
                status: recruitment.status as "draft" | "public" | "closed",
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
  const dateRangeText = `${formatDateTime(recruitment.start_at)}${
    recruitment.end_at ? ` ～ ${formatDateTime(recruitment.end_at)}` : ""
  }`;
  const meetingPlaceText = recruitment.meeting_place?.trim() || "未設定";
  const hasCapacity = recruitment.capacity != null && recruitment.capacity > 0;
  const remainingSlots = hasCapacity ? Math.max(0, recruitment.capacity! - acceptedCount) : null;

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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <span
                className={`inline-flex shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${statusBadgeClass}`}
              >
                {RECRUITMENT_STATUS_LABELS[recruitment.status] ?? recruitment.status}
              </span>
              <p className="text-sm font-medium text-slate-800">募集の基本情報</p>
            </div>
            {hasCapacity && (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-right">
                <p className="text-[11px] text-amber-700">残り枠</p>
                <p className="text-sm font-semibold text-amber-800">
                  {remainingSlots} / {recruitment.capacity}名
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
              <p className="text-[11px] font-medium text-slate-500">日時</p>
              <p className="mt-1 text-slate-700">{dateRangeText}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
              <p className="text-[11px] font-medium text-slate-500">集合場所</p>
              <p className="mt-1 text-slate-700">{meetingPlaceText}</p>
            </div>
          </div>
        </section>

        {/* (3) サマリーカード */}
        <ApplicationSummaryCards
          total={applications.length}
          pendingCount={pendingCount}
          acceptedCount={acceptedCount}
          rejectedCount={rejectedCount}
          capacity={recruitment.capacity ?? null}
          activeStatus={statusFilter}
          onStatusSelect={(nextStatus) =>
            setStatusFilter((prev) => (prev === nextStatus ? "all" : nextStatus))
          }
        />

        {pendingCount > 0 && statusFilter !== "pending" && (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-amber-900">未確認の応募が {pendingCount} 件あります</p>
              <p className="text-xs text-amber-700">先に対応すると運営準備がスムーズです</p>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
            >
              未確認を確認する
            </button>
          </section>
        )}

        {/* (4) 一斉送信（承認済みがある場合） */}
        {acceptedCount > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">承認済み参加者へ一斉連絡</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={bulkTemplate}
              onChange={(e) => {
                const nextTemplate = e.target.value;
                setBulkTemplate(nextTemplate);
                if (nextTemplate && !bulkMessage.trim()) {
                  setBulkMessage(BULK_TEMPLATE_TEXTS[nextTemplate] ?? "");
                }
              }}
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
              aria-label="メッセージテンプレート"
            >
              <option value="">カスタム</option>
              <option value="reminder">前日リマインド</option>
              <option value="venue_change">集合場所変更</option>
              <option value="thanks">お礼メッセージ</option>
            </select>
            <textarea
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              placeholder="送信内容を入力"
              rows={3}
              className="min-h-[84px] w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50"
              aria-label="一斉送信メッセージ"
            />
            <button
              type="button"
              onClick={() => handleBulkMessage()}
              disabled={bulkSending || (!bulkMessage.trim() && !bulkTemplate)}
              className="rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {bulkSending ? "送信中..." : `一斉送信（${acceptedCount}名）`}
            </button>
            </div>
            {bulkResult && (
              <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <p className="text-xs text-slate-600">
                  直近の送信結果: 成功 {bulkResult.sent}件 / 失敗 {bulkResult.failed}件（対象 {bulkResult.total}件）
                </p>
                {failedApplications.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs font-medium text-amber-800">送信失敗の参加者</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {failedApplications.map((app) => (
                        <li
                          key={app.id}
                          className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-800"
                        >
                          {resolveDisplayName(app)}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => handleBulkMessage(failedApplications.map((app) => app.user_id))}
                      disabled={bulkSending || failedApplications.length === 0}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-50 disabled:opacity-50"
                    >
                      失敗分だけ再送する（{failedApplications.length}名）
                    </button>
                  </div>
                )}
              </div>
            )}
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
          resultCount={filteredApplications.length}
          hasFilter={hasActiveFilters}
          onReset={handleResetFilters}
        />

        {statusFilter === "pending" && (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-2.5">
            <p className="text-xs font-medium text-amber-800">
              未確認のみ表示中（{filteredApplications.length}件）
            </p>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50"
            >
              すべて表示に戻す
            </button>
          </section>
        )}

        {/* (6) 応募者一覧 */}
        <section id="applications-list">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              応募者一覧
              <span className="ml-1 text-xs font-normal text-slate-500">
                （{filteredApplications.length}件表示）
              </span>
            </h2>
            {(activeFilterLabel || searchQuery.trim()) && (
              <div className="flex items-center gap-2">
                {activeFilterLabel && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                    {activeFilterLabel}
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                    検索中
                  </span>
                )}
              </div>
            )}
          </div>
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
                  onChat={handleOpenChat}
                  onDetail={setDetailApp}
                  onFocusPending={() => setStatusFilter("pending")}
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
    </div>
  );
}
