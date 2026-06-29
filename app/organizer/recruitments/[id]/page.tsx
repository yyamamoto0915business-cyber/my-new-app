"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { RecruitmentForm } from "@/components/recruitment-form";
import {
  type StatusFilter,
  type SortOption,
} from "@/components/organizer/applications/ApplicationToolbar";
import { type Application } from "@/components/organizer/applications/ApplicationCard";
import { ApplicationDetailSheet } from "@/components/organizer/applications/ApplicationDetailSheet";
import { ApplicationsManagementPcView } from "@/components/organizer/applications/ApplicationsManagementPcView";
import { ApplicationsManagementMobileView } from "@/components/organizer/applications/ApplicationsManagementMobileView";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";

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

const BULK_TEMPLATE_TEXTS: Record<string, string> = {
  reminder:
    "【前日リマインド】明日の集合をお忘れなく。集合時刻・場所を再度確認の上、余裕を持ってお越しください。",
  venue_change:
    "【集合場所変更】大変お手数ですが、集合場所が変更になりました。このチャットの最新メッセージでご確認ください。",
  thanks: "【お礼】本日はお疲れさまでした。ご協力ありがとうございました。",
};

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

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("created_desc");
  }, []);

  const handleStatusSelect = useCallback((nextStatus: StatusFilter) => {
    setStatusFilter((prev) => (prev === nextStatus ? "all" : nextStatus));
  }, []);

  const handleBulkTemplateChange = useCallback((nextTemplate: string) => {
    setBulkTemplate(nextTemplate);
    setBulkMessage((prev) => {
      if (nextTemplate && !prev.trim()) {
        return BULK_TEMPLATE_TEXTS[nextTemplate] ?? "";
      }
      return prev;
    });
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

  return (
    <>
      <OrganizerPageShell
        className="hidden min-[900px]:block"
        contentClassName="space-y-0 pb-8 min-[900px]:pb-4"
      >
        <ApplicationsManagementPcView
          recruitmentId={resolvedId}
          recruitmentTitle={recruitment.title}
          recruitmentDescription={recruitment.description}
          filteredApplications={filteredApplications}
          total={applications.length}
          pendingCount={pendingCount}
          acceptedCount={acceptedCount}
          rejectedCount={rejectedCount}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onStatusSelect={handleStatusSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          bulkTemplate={bulkTemplate}
          onBulkTemplateChange={handleBulkTemplateChange}
          bulkMessage={bulkMessage}
          onBulkMessageChange={setBulkMessage}
          bulkSending={bulkSending}
          onBulkSend={() => handleBulkMessage()}
          bulkResult={bulkResult}
          onEdit={() => setEditing(true)}
          onAccept={handleAccept}
          onReject={handleReject}
          onChat={handleOpenChat}
          onDetail={setDetailApp}
        />
      </OrganizerPageShell>

    <div className="min-[900px]:hidden">
      <ApplicationsManagementMobileView
        recruitmentId={resolvedId}
        recruitmentTitle={recruitment.title}
        recruitmentDescription={recruitment.description}
        filteredApplications={filteredApplications}
        total={applications.length}
        pendingCount={pendingCount}
        acceptedCount={acceptedCount}
        rejectedCount={rejectedCount}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onStatusSelect={handleStatusSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        bulkTemplate={bulkTemplate}
        onBulkTemplateChange={handleBulkTemplateChange}
        bulkMessage={bulkMessage}
        onBulkMessageChange={setBulkMessage}
        bulkSending={bulkSending}
        onBulkSend={() => handleBulkMessage()}
        bulkResult={bulkResult}
        failedApplicationNames={failedApplications.map((app) => resolveDisplayName(app))}
        onBulkRetryFailed={
          failedApplications.length > 0
            ? () => handleBulkMessage(failedApplications.map((app) => app.user_id))
            : undefined
        }
        onEdit={() => setEditing(true)}
        onAccept={handleAccept}
        onReject={handleReject}
        onChat={handleOpenChat}
        onDetail={setDetailApp}
      />
    </div>

      {/* 応募者詳細スライドオーバー */}
      <ApplicationDetailSheet application={detailApp} onClose={() => setDetailApp(null)} />
    </>
  );
}
