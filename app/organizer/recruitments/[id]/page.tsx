"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
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
    "【集合場所変更】大変お手数ですが、集合場所が変更になりました。最新のお知らせをご確認ください。",
  thanks: "【お礼】本日はお疲れさまでした。ご協力ありがとうございました。",
};

export default function OrganizerRecruitmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--mg-paper)]">
          <p className="text-zinc-500">読み込み中...</p>
        </div>
      }
    >
      <OrganizerRecruitmentDetailContent params={params} />
    </Suspense>
  );
}

function OrganizerRecruitmentDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkResult, setBulkResult] = useState<BulkMessageResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [detailApp, setDetailApp] = useState<Application | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setResolvedId(p.id));
  }, [params]);

  useEffect(() => {
    if (searchParams?.get("edit") === "1" && resolvedId) {
      router.replace(`/organizer/recruitments/new?editId=${resolvedId}`);
    }
  }, [searchParams, resolvedId, router]);

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
    const nextPending = applications.find(
      (a) =>
        a.id !== appId && (a.status === "pending" || a.status === "on_hold")
    );
    const res = await fetchWithTimeout(
      `/api/recruitments/${resolvedId}/applications/${appId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      }
    );
    if (res.ok) {
      if (nextPending) setSelectedAppId(nextPending.id);
      load();
    }
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

  const handleHold = async (appId: string) => {
    const res = await fetchWithTimeout(
      `/api/recruitments/${resolvedId}/applications/${appId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "on_hold" }),
      }
    );
    if (res.ok) load();
  };

  const handleSaveMemo = async (appId: string, memo: string) => {
    const res = await fetchWithTimeout(
      `/api/recruitments/${resolvedId}/applications/${appId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizer_memo: memo }),
      }
    );
    if (res.ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, organizer_memo: memo } : a))
      );
    }
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

  const handleBulkMessage = async (
    contentOrTargetIds?: string | string[],
    targetUserIds?: string[]
  ): Promise<boolean> => {
    if (!resolvedId) return false;
    const contentOverride = typeof contentOrTargetIds === "string" ? contentOrTargetIds : undefined;
    const targets =
      typeof contentOrTargetIds === "object" && Array.isArray(contentOrTargetIds)
        ? contentOrTargetIds
        : targetUserIds;
    const content =
      (contentOverride ?? bulkMessage).trim() || BULK_TEMPLATE_TEXTS[bulkTemplate] || "";
    if (!content) {
      alert("送信するメッセージを入力してください");
      return false;
    }
    const targetCount =
      Array.isArray(targets) && targets.length > 0 ? targets.length : acceptedCount;
    const confirmed = window.confirm(
      `承認済みスタッフ ${targetCount} 名へ通知を送信します。\n（ダッシュボードのお知らせと同じ経路です）\nこの操作を実行しますか？`
    );
    if (!confirmed) return false;
    setBulkSending(true);
    try {
      const res = await fetchWithTimeout(
        `/api/recruitments/${resolvedId}/bulk-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template: contentOverride ? undefined : bulkTemplate || undefined,
            content,
            targetUserIds: targets && targets.length > 0 ? targets : undefined,
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.sent != null) {
        const total = Number(data.total ?? acceptedCount);
        const sent = Number(data.sent ?? 0);
        const failed = Number(data.failed ?? Math.max(0, total - sent));
        if (failed > 0) {
          alert(`通知送信が完了しました\n成功: ${sent}件 / 失敗: ${failed}件`);
        } else {
          alert(data.message ?? `${sent}件のスタッフに通知を送信しました`);
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
        return true;
      } else {
        alert(data.error ?? "送信に失敗しました");
        return false;
      }
    } finally {
      setBulkSending(false);
    }
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const onHoldCount = applications.filter((a) => a.status === "on_hold").length;
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
    if (statusFilter === "pending")
      list = list.filter((a) => a.status === "pending" || a.status === "on_hold");
    else if (statusFilter === "on_hold") list = list.filter((a) => a.status === "on_hold");
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
    // 常に未確認・保留を上位に表示して、対応漏れを減らす
    sorted.sort((a, b) => {
      const rank = (s: string) => (s === "pending" || s === "on_hold" ? 0 : 1);
      return rank(a.status) - rank(b.status);
    });
    return sorted;
  }, [applications, statusFilter, searchQuery, sortBy]);

  useEffect(() => {
    if (filteredApplications.length === 0) {
      setSelectedAppId(null);
      return;
    }
    if (!selectedAppId || !filteredApplications.some((a) => a.id === selectedAppId)) {
      setSelectedAppId(filteredApplications[0].id);
    }
  }, [filteredApplications, selectedAppId]);

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== "all" || sortBy !== "created_desc";

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("created_desc");
  }, []);

  const handleStatusSelect = useCallback((nextStatus: StatusFilter) => {
    setStatusFilter(nextStatus);
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

  return (
    <>
      <OrganizerPageShell
        className="hidden min-h-0 min-[900px]:flex min-[900px]:flex-1 min-[900px]:flex-col"
        contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden pb-0"
      >
        <ApplicationsManagementPcView
          recruitmentId={resolvedId}
          recruitmentTitle={recruitment.title}
          recruitmentDescription={recruitment.description}
          eventTitle={(recruitment as { events?: { title?: string } | null }).events?.title ?? null}
          startAt={recruitment.start_at}
          endAt={recruitment.end_at}
          capacity={recruitment.capacity}
          roles={recruitment.roles}
          filteredApplications={filteredApplications}
          total={applications.length}
          pendingCount={pendingCount}
          acceptedCount={acceptedCount}
          rejectedCount={rejectedCount}
          onHoldCount={onHoldCount}
          statusFilter={statusFilter}
          onStatusSelect={handleStatusSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedId={selectedAppId}
          onSelect={(app) => setSelectedAppId(app.id)}
          onEdit={() => router.push(`/organizer/recruitments/new?editId=${resolvedId}`)}
          onAccept={handleAccept}
          onReject={handleReject}
          onHold={handleHold}
          onChat={handleOpenChat}
          onSaveMemo={handleSaveMemo}
          bulkSending={bulkSending}
          onBulkSend={(content, targetUserIds) => handleBulkMessage(content, targetUserIds)}
          bulkResult={bulkResult}
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
        onEdit={() => router.push(`/organizer/recruitments/new?editId=${resolvedId}`)}
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
