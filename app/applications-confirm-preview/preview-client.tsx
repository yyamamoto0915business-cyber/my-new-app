"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ApplicationsManagementPcView } from "@/components/organizer/applications/ApplicationsManagementPcView";
import { ApplicationsManagementMobileView } from "@/components/organizer/applications/ApplicationsManagementMobileView";
import { ApplicationDetailSheet } from "@/components/organizer/applications/ApplicationDetailSheet";
import type { Application } from "@/components/organizer/applications/ApplicationCard";
import type { StatusFilter, SortOption } from "@/components/organizer/applications/ApplicationToolbar";
import { buildApplicationsConfirmPreview } from "@/lib/applications-management-preview";
import { cn } from "@/lib/utils";

/**
 * ログイン不要の応募確認プレビュー（PC / モバイル切替）。
 * 全項目入力済みの応募者を含むモック。操作はローカルのみ。
 */
export function ApplicationsConfirmPreviewClient() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view") === "mobile" ? "mobile" : "pc";
  const [view, setView] = useState<"pc" | "mobile">(viewParam);
  const preview = useMemo(() => buildApplicationsConfirmPreview(), []);

  const [applications, setApplications] = useState(preview.applications);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [selectedId, setSelectedId] = useState<string | null>(
    preview.applications[0]?.id ?? null
  );
  const [detailApp, setDetailApp] = useState<Application | null>(null);
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setView(viewParam);
  }, [viewParam]);

  const filtered = useMemo(() => {
    let list = [...applications];
    if (statusFilter === "pending") {
      list = list.filter((a) => a.status === "pending" || a.status === "on_hold");
    } else if (statusFilter === "accepted") {
      list = list.filter(
        (a) =>
          a.status === "accepted" || a.status === "confirmed" || a.status === "checked_in"
      );
    } else if (statusFilter === "rejected") {
      list = list.filter((a) => a.status === "rejected");
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        const name = a.user?.display_name?.toLowerCase() ?? "";
        const email = a.user?.email?.toLowerCase() ?? "";
        const msg = a.message?.toLowerCase() ?? "";
        return name.includes(q) || email.includes(q) || msg.includes(q);
      });
    }
    list.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortBy === "created_asc" ? ta - tb : tb - ta;
    });
    return list;
  }, [applications, statusFilter, searchQuery, sortBy]);

  const pendingCount = applications.filter(
    (a) => a.status === "pending" || a.status === "on_hold"
  ).length;
  const acceptedCount = applications.filter(
    (a) =>
      a.status === "accepted" || a.status === "confirmed" || a.status === "checked_in"
  ).length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;
  const onHoldCount = applications.filter((a) => a.status === "on_hold").length;

  const updateStatus = (appId: string, status: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a))
    );
    setToast(`ステータスを更新しました（プレビュー）`);
  };

  const markArrived = (appId: string) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              checked_in_at: new Date().toISOString(),
              status: "checked_in",
            }
          : a
      )
    );
    setToast("到着を記録しました（プレビュー）");
  };

  const noopToast = (msg: string) => () => setToast(msg);

  return (
    <div className="flex h-[calc(100dvh-var(--mg-pc-top-nav-h,52px))] flex-col overflow-hidden bg-[var(--mg-paper,#f7f8f4)]">
      <div className="flex shrink-0 items-center justify-center gap-3 border-b border-[#d8ecd0] bg-[#f3faf0] px-4 py-1.5">
        <p className="text-[11px] font-medium text-[#3a633d]">
          {view === "mobile" ? "プレビュー：モバイル応募確認" : preview.bannerLabel}
        </p>
        <div className="flex rounded-md border border-[#c5d9bc] bg-white p-0.5 text-[11px]">
          <Link
            href="/applications-confirm-preview"
            className={cn(
              "rounded px-2.5 py-0.5 font-medium",
              view === "pc" ? "bg-[#3a633d] text-white" : "text-[#3a633d] hover:bg-[#f3faf0]"
            )}
          >
            PC
          </Link>
          <Link
            href="/applications-confirm-preview?view=mobile"
            className={cn(
              "rounded px-2.5 py-0.5 font-medium",
              view === "mobile" ? "bg-[#3a633d] text-white" : "text-[#3a633d] hover:bg-[#f3faf0]"
            )}
          >
            モバイル
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "pc" ? (
          <div className="flex h-full min-h-0 flex-col overflow-hidden px-3 pb-2 pt-2">
            <ApplicationsManagementPcView
              recruitmentId={preview.recruitmentId}
              recruitmentTitle={preview.recruitmentTitle}
              recruitmentDescription={preview.recruitmentDescription}
              eventTitle={preview.eventTitle}
              startAt={preview.startAt}
              endAt={preview.endAt}
              capacity={preview.capacity}
              roles={preview.roles}
              formConfig={preview.formConfig}
              filteredApplications={filtered}
              total={applications.length}
              pendingCount={pendingCount}
              acceptedCount={acceptedCount}
              rejectedCount={rejectedCount}
              onHoldCount={onHoldCount}
              statusFilter={statusFilter}
              onStatusSelect={setStatusFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedId={selectedId}
              onSelect={(app) => setSelectedId(app.id)}
              onEdit={noopToast("プレビューのため編集は無効です")}
              onAccept={(id) => updateStatus(id, "accepted")}
              onReject={(id) => updateStatus(id, "rejected")}
              onHold={(id) => updateStatus(id, "on_hold")}
              onChat={noopToast("プレビューのためチャットは無効です")}
              onCheckIn={markArrived}
              onSaveMemo={async (appId, memo) => {
                setApplications((prev) =>
                  prev.map((a) => (a.id === appId ? { ...a, organizer_memo: memo } : a))
                );
              }}
              bulkSending={false}
              onBulkSend={() => {
                setToast("一斉通知を送信しました（プレビュー・送信なし）");
              }}
              bulkResult={null}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto bg-white">
            <ApplicationsManagementMobileView
              recruitmentId={preview.recruitmentId}
              recruitmentTitle={preview.recruitmentTitle}
              recruitmentDescription={preview.recruitmentDescription}
              filteredApplications={filtered}
              total={applications.length}
              pendingCount={pendingCount}
              acceptedCount={acceptedCount}
              rejectedCount={rejectedCount}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onStatusSelect={setStatusFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onResetFilters={() => {
                setStatusFilter("all");
                setSearchQuery("");
                setSortBy("created_desc");
              }}
              hasActiveFilters={
                statusFilter !== "all" || searchQuery.trim().length > 0 || sortBy !== "created_desc"
              }
              bulkTemplate={bulkTemplate}
              onBulkTemplateChange={setBulkTemplate}
              bulkMessage={bulkMessage}
              onBulkMessageChange={setBulkMessage}
              bulkSending={false}
              onBulkSend={() => setToast("一斉通知を送信しました（プレビュー・送信なし）")}
              bulkResult={null}
              onEdit={noopToast("プレビューのため編集は無効です")}
              onAccept={(id) => updateStatus(id, "accepted")}
              onReject={(id) => updateStatus(id, "rejected")}
              onChat={noopToast("プレビューのためチャットは無効です")}
              onDetail={setDetailApp}
            />
            <ApplicationDetailSheet
              application={
                detailApp
                  ? (applications.find((a) => a.id === detailApp.id) ?? detailApp)
                  : null
              }
              formConfig={preview.formConfig}
              recruitmentTimeLabel={(() => {
                const start =
                  preview.startAt.length > 10 ? preview.startAt.slice(11, 16) : "";
                const end =
                  preview.endAt.length > 10 ? preview.endAt.slice(11, 16) : "";
                if (start && end) return `${start} - ${end}`;
                return start || "—";
              })()}
              onClose={() => setDetailApp(null)}
              onAccept={(id) => updateStatus(id, "accepted")}
              onReject={(id) => updateStatus(id, "rejected")}
              onHold={(id) => updateStatus(id, "on_hold")}
              onChat={noopToast("プレビューのためチャットは無効です")}
              onCheckIn={markArrived}
              onSaveMemo={async (appId, memo) => {
                setApplications((prev) =>
                  prev.map((a) => (a.id === appId ? { ...a, organizer_memo: memo } : a))
                );
              }}
            />
          </div>
        )}
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-[#d8e0d4] bg-white px-4 py-2.5 text-[13px] text-[#1a2818] shadow-lg"
        >
          {toast}
          <button
            type="button"
            className="ml-3 text-[12px] font-medium text-[#2B3A6B] underline"
            onClick={() => setToast(null)}
          >
            閉じる
          </button>
        </div>
      ) : null}
    </div>
  );
}
