"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Copy,
  Edit3,
  Eye,
  FileText,
  Globe,
  GlobeLock,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Upload,
  Users,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardEvent, BillingSummary } from "@/app/api/organizer/dashboard/route";

const PLAN_HREF = "/organizer/settings/plan";
const PAYOUTS_HREF = "/organizer/settings/payouts";

const STATUS_LABELS: Record<string, string> = {
  public: "公開中",
  draft: "下書き",
  ended: "終了",
  archived: "アーカイブ",
};

const STATUS_STYLES: Record<string, string> = {
  public: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  draft: "bg-amber-50 text-amber-700 border-amber-200/80",
  ended: "bg-slate-100 text-slate-600 border-slate-200/80",
  archived: "bg-violet-50 text-violet-700 border-violet-200/80",
};

function getBillingTag(
  event: DashboardEvent,
  chargesEnabled: boolean
): { label: string; className: string } {
  const hasSponsor = (event.sponsorTicketPrices?.length ?? 0) > 0;
  if (event.price === 0) {
    return {
      label: "無料",
      className: "bg-slate-100 text-slate-600 border-slate-200/80",
    };
  }
  if (!chargesEnabled) {
    return {
      label: "決済未設定",
      className: "bg-amber-50 text-amber-700 border-amber-200/80",
    };
  }
  if (hasSponsor) {
    return {
      label: "スポンサー受付中",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    };
  }
  return {
    label: "有料",
    className: "bg-slate-100 text-slate-600 border-slate-200/80",
  };
}

type OrganizerEventCardProps = {
  event: DashboardEvent;
  billingSummary: BillingSummary | null;
  onRefresh?: () => void;
  /** アーカイブボックス表示中 */
  archiveBoxMode?: boolean;
  /** アーカイブ完了後（一覧タブ切替など） */
  onArchived?: () => void;
};

export function OrganizerEventCard({
  event,
  billingSummary,
  onRefresh,
  archiveBoxMode = false,
  onArchived,
}: OrganizerEventCardProps) {
  const router = useRouter();
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [publishAgreed, setPublishAgreed] = useState(false);
  const [menuOpenDesktop, setMenuOpenDesktop] = useState(false);
  const [menuOpenMobile, setMenuOpenMobile] = useState(false);
  const [actionLoading, setActionLoading] = useState<null | "toggle" | "archive" | "restore" | "delete">(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<null | { type: "success" | "error"; message: string }>(
    null
  );

  const nav = (href: string) => {
    router.push(href);
  };
  const closeAllMenus = () => {
    setMenuOpenDesktop(false);
    setMenuOpenMobile(false);
  };
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2600);
  };

  const mainRecruitmentId = event.recruitmentIds?.[0];
  const hasRecruitment = (event.recruitmentIds?.length ?? 0) > 0;
  const recruitmentHref = mainRecruitmentId
    ? `/organizer/recruitments/${mainRecruitmentId}`
    : `/organizer/recruitments/new?eventId=${event.id}`;
  const chargesEnabled = billingSummary?.stripeAccountChargesEnabled ?? false;
  const billingTag = getBillingTag(event, chargesEnabled);
  const isArchived = event.visibilityStatus === "archived";
  const isVisible = event.visibilityStatus === "published";
  const displayStatus = isArchived ? "archived" : event.status;
  const hasPaidContent =
    event.price > 0 || (event.sponsorTicketPrices?.length ?? 0) > 0;

  const handlePublish = async (): Promise<boolean> => {
    setPublishError(null);
    setPublishLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/publish`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402) setShowBillingModal(true);
        else setPublishError(json.error ?? "公開に失敗しました");
        return false;
      }
      onRefresh?.();
      return true;
    } catch {
      setPublishError("公開に失敗しました");
      return false;
    } finally {
      setPublishLoading(false);
    }
  };

  const patchStatus = async (status: "draft" | "published" | "archived") => {
    const res = await fetch(`/api/events/${event.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 402) setShowBillingModal(true);
      throw new Error((json as { error?: string }).error ?? "更新に失敗しました");
    }
  };

  const handleTogglePublish = async () => {
    closeAllMenus();
    if (isVisible) {
      setShowUnpublishConfirm(true);
      return;
    }
    setShowPublishConfirm(true);
  };

  const handleConfirmUnpublish = async () => {
    setShowUnpublishConfirm(false);
    setActionLoading("toggle");
    setPublishError(null);
    try {
      await patchStatus("draft");
      showToast("success", "非公開にしました");
      onRefresh?.();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "更新に失敗しました";
      setPublishError(message);
      showToast("error", message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async () => {
    closeAllMenus();
    setActionLoading("archive");
    setShowArchiveConfirm(false);
    try {
      await patchStatus("archived");
      showToast("success", "アーカイブボックスに移動しました");
      await onRefresh?.();
      onArchived?.();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "アーカイブに失敗しました";
      showToast("error", message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async () => {
    closeAllMenus();
    setActionLoading("restore");
    try {
      await patchStatus("draft");
      showToast("success", "下書きに戻しました");
      onRefresh?.();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "復元に失敗しました";
      showToast("error", message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    closeAllMenus();
    setActionLoading("delete");
    setShowDeleteConfirm(false);
    try {
      const res = await fetch(`/api/organizer/events/${event.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error ?? "削除に失敗しました");
      }
      showToast("success", "イベントを削除しました");
      onRefresh?.();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "削除に失敗しました";
      showToast("error", message);
    } finally {
      setActionLoading(null);
    }
  };

  const dateTimeStr = `${event.date} ${event.startTime}${
    event.endTime ? `〜${event.endTime}` : ""
  }`;

  const statusPillClass =
    displayStatus === "public"
      ? "bg-[#EAF6DE] text-[#4A7A38]"
      : displayStatus === "archived"
        ? "bg-violet-50 text-violet-700"
        : displayStatus === "ended"
          ? "bg-[#EDE8E0] text-[#7a6a58]"
          : "bg-[#FFF8E8] text-[#9a7b20]";

  const payoutsHref =
    hasPaidContent && chargesEnabled
      ? `/organizer/events/${event.id}/sponsors`
      : PAYOUTS_HREF;
  const payoutsLabel = !chargesEnabled ? "売上受取設定" : hasPaidContent ? "売上確認" : "売上";
  const staffSlots = event.recruitmentIds?.length ?? 0;
  const thumbSrc = event.imageUrl || "/events/pc-hero-landscape.jpg";

  return (
    <article className="org-event-row-card">
      {/* ── PC: 横並びカード（コンパクト行） ── */}
      <div className="org-event-row-card__pc-row hidden min-[900px]:flex">
        <Link
          href={`/organizer/events/${event.id}`}
          className="org-event-row-card__thumb shrink-0"
          aria-label={`${event.title}の詳細`}
        >
          <Image
            src={thumbSrc}
            alt=""
            width={68}
            height={48}
            className="h-full w-full object-cover"
            unoptimized
          />
        </Link>

        <div className="org-event-row-card__body">
          <div className="org-event-row-card__title-row">
            <Link
              href={`/organizer/events/${event.id}`}
              className="org-event-row-card__title"
            >
              {event.title}
            </Link>
            <span
              className={`org-event-row-card__badge ${
                STATUS_STYLES[displayStatus] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {STATUS_LABELS[displayStatus] ?? displayStatus}
            </span>
            <span className={`org-event-row-card__badge ${billingTag.className}`}>
              {billingTag.label}
            </span>
          </div>

          <p className="org-event-row-card__meta">
            <span>{dateTimeStr}</span>
            {event.location ? (
              <>
                <span className="org-event-row-card__meta-sep" aria-hidden>
                  ·
                </span>
                <span className="truncate">{event.location}</span>
              </>
            ) : null}
            <span className="org-event-row-card__meta-sep" aria-hidden>
              ·
            </span>
            <span>
              応募 <strong>{event.applicationCount ?? 0}</strong>
            </span>
            <span className="org-event-row-card__meta-sep" aria-hidden>
              ·
            </span>
            <span>
              募集 <strong>{staffSlots}</strong>
              {event.capacity != null ? (
                <span className="text-[#9aa89c]"> / {event.capacity}</span>
              ) : null}
            </span>
          </p>
        </div>

        <div className="org-event-row-card__actions">
          {archiveBoxMode ? (
            <>
              <button
                type="button"
                onClick={handleRestore}
                disabled={actionLoading === "restore"}
                className="org-event-row-card__btn-primary"
              >
                {actionLoading === "restore" ? "復元中..." : "復元する"}
              </button>
              <Link href={`/organizer/events/${event.id}`} className="org-event-row-card__btn-outline">
                詳細
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={actionLoading === "delete"}
                className="org-event-row-card__btn-danger"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
                {actionLoading === "delete" ? "削除中..." : "削除"}
              </button>
            </>
          ) : (
            <>
              {event.visibilityStatus === "draft" ? (
                <button
                  type="button"
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={publishLoading}
                  className="org-event-row-card__btn-primary"
                >
                  <Upload className="h-3 w-3" aria-hidden />
                  {publishLoading ? "公開中..." : "公開する"}
                </button>
              ) : (
                <Link href={`/organizer/events/${event.id}`} className="org-event-row-card__btn-outline">
                  詳細
                </Link>
              )}

              <Link href={recruitmentHref} className="org-event-row-card__btn-recruit">
                <Users className="h-3 w-3" aria-hidden />
                募集
              </Link>
            </>
          )}

          <DropdownMenu open={menuOpenDesktop} onOpenChange={setMenuOpenDesktop}>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="org-event-row-card__btn-menu relative"
                  aria-label="その他メニュー"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  {(event.unreadCount ?? 0) > 0 ? (
                    <span
                      className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#E53935]"
                      aria-hidden
                    />
                  ) : null}
                </button>
              }
            />
            <DropdownMenuContent align="end" className="z-[70] w-56" sideOffset={8}>
              <DropdownMenuItem
                onClick={() => {
                  closeAllMenus();
                  nav(payoutsHref);
                }}
                className="min-h-10 cursor-pointer gap-2 px-3 py-2"
              >
                <FileText className="h-4 w-4" />
                {payoutsLabel}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  closeAllMenus();
                  nav(`/events/${event.id}/chat`);
                }}
                className="min-h-10 cursor-pointer gap-2 px-3 py-2"
              >
                <MessageCircle className="h-4 w-4" />
                チャット
                {(event.unreadCount ?? 0) > 0 ? ` (${event.unreadCount})` : ""}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  closeAllMenus();
                  nav(`/events/${event.id}`);
                }}
                className="min-h-10 cursor-pointer gap-2 px-3 py-2"
              >
                <Eye className="h-4 w-4" />
                公開ページを見る
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  closeAllMenus();
                  nav(`/organizer/events/${event.id}`);
                }}
                className="min-h-10 cursor-pointer gap-2 px-3 py-2"
              >
                <Edit3 className="h-4 w-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  closeAllMenus();
                  nav(`/organizer/stories/new?eventId=${event.id}`);
                }}
                className="min-h-10 cursor-pointer gap-2 px-3 py-2"
              >
                <FileText className="h-4 w-4" />
                ストーリーを書く
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  closeAllMenus();
                  nav(`/organizer/events/${event.id}/sponsors`);
                }}
                className="min-h-10 cursor-pointer gap-2 px-3 py-2"
              >
                <Users className="h-4 w-4" />
                スポンサー管理
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleTogglePublish}
                disabled={actionLoading === "toggle" || publishLoading}
                className="min-h-10 cursor-pointer gap-2 px-3 py-2"
              >
                {actionLoading === "toggle" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isVisible ? (
                  <GlobeLock className="h-4 w-4" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                {isVisible ? "公開中 → 非公開にする" : "非公開 → 公開する"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  closeAllMenus();
                  nav(`/organizer/events/new?copyFrom=${event.id}`);
                }}
                className="min-h-10 cursor-pointer gap-2 px-3 py-2"
              >
                <Copy className="h-4 w-4" />
                複製
              </DropdownMenuItem>
              {!isArchived && !archiveBoxMode ? (
                <DropdownMenuItem
                  onClick={() => {
                    closeAllMenus();
                    setShowArchiveConfirm(true);
                  }}
                  disabled={actionLoading === "archive"}
                  variant="destructive"
                  className="min-h-10 cursor-pointer gap-2 px-3 py-2"
                >
                  <Archive className="h-4 w-4" />
                  アーカイブ
                </DropdownMenuItem>
              ) : null}
              {archiveBoxMode ? (
                <>
                  <DropdownMenuItem
                    onClick={handleRestore}
                    disabled={actionLoading === "restore"}
                    className="min-h-10 cursor-pointer gap-2 px-3 py-2"
                  >
                    <Archive className="h-4 w-4" />
                    下書きに復元
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      closeAllMenus();
                      setShowDeleteConfirm(true);
                    }}
                    disabled={actionLoading === "delete"}
                    variant="destructive"
                    className="min-h-10 cursor-pointer gap-2 px-3 py-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    完全に削除
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {toast ? (
          <p
            className={`absolute bottom-2 right-4 rounded-lg border px-3 py-1 text-xs font-medium ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
            role="status"
          >
            {toast.message}
          </p>
        ) : null}
        {publishError ? (
          <p className="absolute bottom-2 left-4 text-xs text-red-600">{publishError}</p>
        ) : null}
      </div>

      {/* ── モバイル ── */}
      <div className="p-2.5 min-[900px]:hidden">
        {/* 上段: タイトル + ステータス */}
        <div className="flex items-start gap-1.5 min-[900px]:gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5 min-[900px]:block">
              <Link
                href={`/events/${event.id}`}
                className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-[#1a1a1a] hover:underline min-[900px]:text-[15px] min-[900px]:font-semibold min-[900px]:text-slate-900"
              >
                {event.title}
              </Link>
              <span
                className={`shrink-0 rounded-md px-1.5 py-px text-[9px] font-medium min-[900px]:hidden ${statusPillClass}`}
              >
                {STATUS_LABELS[displayStatus] ?? displayStatus}
              </span>
            </div>
            <div className="mt-1 hidden flex-wrap gap-1 min-[900px]:mt-1.5 min-[900px]:flex min-[900px]:gap-1.5">
              <span
                className={`inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs ${
                  STATUS_STYLES[displayStatus] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {STATUS_LABELS[displayStatus] ?? displayStatus}
              </span>
              <span
                className={`inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[11px] sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs ${billingTag.className}`}
              >
                {billingTag.label}
              </span>
              {event.price > 0 && (
                <span className="rounded-md border border-slate-200/80 bg-slate-50/80 px-2 py-0.5 text-[11px] text-slate-600 min-[900px]:rounded-lg min-[900px]:px-2.5 min-[900px]:py-1 min-[900px]:text-xs">
                  ¥{event.price}
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] leading-snug text-[#888] min-[900px]:hidden">
              <span>{dateTimeStr}</span>
              {event.location ? (
                <>
                  <span className="text-[#ddd]"> · </span>
                  <span className="text-[#666]">{event.location}</span>
                </>
              ) : null}
              <span className="text-[#ddd]"> · </span>
              <span className="font-medium text-[#666]">{billingTag.label}</span>
            </p>
          </div>
          {/* モバイル: メニュー */}
          <div className="shrink-0 min-[900px]:hidden">
            <DropdownMenu open={menuOpenMobile} onOpenChange={setMenuOpenMobile}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e8e6e0] bg-[#faf8f5] text-slate-600"
                    aria-label="その他メニュー"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="z-[70] w-56" sideOffset={8}>
                <DropdownMenuItem
                  onClick={() => {
                    closeAllMenus();
                    nav(`/events/${event.id}`);
                  }}
                  className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                >
                  <Eye className="h-4 w-4" />
                  詳細を見る
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    closeAllMenus();
                    nav(`/organizer/events/${event.id}`);
                  }}
                  className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                >
                  <Edit3 className="h-4 w-4" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    closeAllMenus();
                    nav(`/organizer/stories/new?eventId=${event.id}`);
                  }}
                  className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                >
                  <FileText className="h-4 w-4" />
                  ストーリーを書く
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    closeAllMenus();
                    nav(`/organizer/events/${event.id}/sponsors`);
                  }}
                  className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                >
                  <Users className="h-4 w-4" />
                  スポンサー管理
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleTogglePublish}
                  disabled={actionLoading === "toggle" || publishLoading}
                  className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                >
                  {actionLoading === "toggle" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isVisible ? (
                    <GlobeLock className="h-4 w-4" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  {isVisible ? "非公開にする" : "公開する"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    closeAllMenus();
                    nav(`/organizer/events/new?copyFrom=${event.id}`);
                  }}
                  className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                >
                  <Copy className="h-4 w-4" />
                  複製
                </DropdownMenuItem>
                {!isArchived && !archiveBoxMode ? (
                  <DropdownMenuItem
                    onClick={() => {
                      closeAllMenus();
                      setShowArchiveConfirm(true);
                    }}
                    disabled={actionLoading === "archive"}
                    variant="destructive"
                    className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                  >
                    <Archive className="h-4 w-4" />
                    アーカイブ
                  </DropdownMenuItem>
                ) : null}
                {archiveBoxMode ? (
                  <>
                    <DropdownMenuItem
                      onClick={handleRestore}
                      disabled={actionLoading === "restore"}
                      className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                    >
                      <Archive className="h-4 w-4" />
                      下書きに復元
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        closeAllMenus();
                        setShowDeleteConfirm(true);
                      }}
                      disabled={actionLoading === "delete"}
                      variant="destructive"
                      className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      完全に削除
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* モバイル: アクション（2×2） */}
        <div className="mt-2 min-[900px]:hidden">
          {archiveBoxMode ? (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleRestore}
                disabled={actionLoading === "restore"}
                className="flex items-center justify-center gap-0.5 rounded-md bg-[#6BBF3E] py-2 text-[11px] font-medium text-white transition-opacity active:opacity-90 disabled:opacity-50"
              >
                {actionLoading === "restore" ? "復元中..." : "復元する"}
              </button>
              <Link
                href={`/organizer/events/${event.id}`}
                className="flex items-center justify-center gap-0.5 rounded-md border border-[#e8e6e0] bg-white py-2 text-[11px] font-medium text-[#666] active:bg-[#f5f4f0]"
              >
                <Edit3 className="h-3 w-3 shrink-0" aria-hidden />
                詳細
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={actionLoading === "delete"}
                className="col-span-2 flex items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 py-2 text-[11px] font-medium text-red-700 active:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3 shrink-0" aria-hidden />
                {actionLoading === "delete" ? "削除中..." : "完全に削除する"}
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {event.visibilityStatus === "draft" ? (
              <button
                type="button"
                onClick={() => setShowPublishConfirm(true)}
                disabled={publishLoading}
                className="flex items-center justify-center gap-0.5 rounded-md bg-[#6BBF3E] py-2 text-[11px] font-medium text-white transition-opacity active:opacity-90 disabled:opacity-50"
              >
                <Upload className="h-3 w-3 shrink-0" aria-hidden />
                {publishLoading ? "公開中..." : "公開する"}
              </button>
            ) : isVisible ? (
              <button
                type="button"
                onClick={() => setShowUnpublishConfirm(true)}
                disabled={actionLoading === "toggle" || publishLoading}
                className="flex items-center justify-center gap-0.5 rounded-md border border-[#e8e6e0] bg-white py-2 text-[11px] font-medium text-[#666] transition-colors active:bg-[#f5f4f0] disabled:opacity-50"
              >
                <GlobeLock className="h-3 w-3 shrink-0" aria-hidden />
                非公開にする
              </button>
            ) : (
              <Link
                href={`/organizer/events/${event.id}`}
                className="flex items-center justify-center gap-0.5 rounded-md border border-[#e8e6e0] bg-white py-2 text-[11px] font-medium text-[#666] active:bg-[#f5f4f0]"
              >
                <Edit3 className="h-3 w-3 shrink-0" aria-hidden />
                編集
              </Link>
            )}
            <Link
              href={recruitmentHref}
              className="inline-flex items-center justify-center gap-0.5 rounded-md bg-[#2B3A6B] py-2 text-[11px] font-medium text-white active:opacity-90"
            >
              <Users className="h-3 w-3 shrink-0" aria-hidden />
              スタッフ募集
            </Link>
            <Link
              href={payoutsHref}
              className="flex items-center justify-center gap-0.5 rounded-md border border-[#e8e6e0] bg-white py-2 text-[11px] font-medium text-[#666] active:bg-[#f5f4f0]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2"/>
              </svg>
              {payoutsLabel}
            </Link>
            <Link
              href={`/events/${event.id}/chat`}
              className="relative flex items-center justify-center gap-0.5 rounded-md border border-[#e8e6e0] bg-white py-2 text-[11px] font-medium text-[#666] active:bg-[#f5f4f0]"
            >
              <MessageCircle className="h-3 w-3 shrink-0" aria-hidden />
              チャット
              {(event.unreadCount ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E8708A] px-1 text-[10px] font-medium text-white">
                  {event.unreadCount > 99 ? "99+" : event.unreadCount}
                </span>
              )}
            </Link>
          </div>
          )}
          {toast && (
            <p
              className={`mt-2 rounded-lg border px-3 py-1.5 text-center text-xs font-medium ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
              role="status"
            >
              {toast.message}
            </p>
          )}
          {publishError && (
            <p className="mt-2 text-center text-xs text-red-600">{publishError}</p>
          )}
        </div>
      </div>

      {showPublishConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => {
              setShowPublishConfirm(false);
              setPublishAgreed(false);
            }}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl">
            <p className="font-medium text-slate-900">イベントを公開しますか？</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              公開にあたり、掲載内容の責任は主催者が負うものとします。
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={publishAgreed}
                onChange={(e) => setPublishAgreed(e.target.checked)}
                className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-slate-300"
              />
              <span className="text-[13px] leading-relaxed text-slate-700">
                掲載内容の責任を理解し、
                <Link href="/terms" target="_blank" className="font-medium text-slate-800 underline underline-offset-2 hover:text-[var(--mg-accent)]">利用規約</Link>
                に同意する
              </span>
            </label>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPublishConfirm(false);
                  setPublishAgreed(false);
                  handlePublish().then((ok) => {
                    if (ok) showToast("success", "公開しました");
                  });
                }}
                disabled={!publishAgreed || publishLoading}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {publishLoading ? "公開中..." : "公開する"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPublishConfirm(false);
                  setPublishAgreed(false);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                キャンセル
              </button>
            </div>
          </div>
        </>
      )}

      {showUnpublishConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowUnpublishConfirm(false)}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl">
            <p className="font-medium text-slate-900">イベントを非公開にしますか？</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              非公開にすると、イベント一覧（探す）から見えなくなります。内容は下書きとして残ります。
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleConfirmUnpublish}
                disabled={actionLoading === "toggle" || publishLoading}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {actionLoading === "toggle" ? "処理中..." : "非公開にする"}
              </button>
              <button
                type="button"
                onClick={() => setShowUnpublishConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                キャンセル
              </button>
            </div>
          </div>
        </>
      )}

      {showArchiveConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowArchiveConfirm(false)}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl">
            <p className="font-medium text-slate-900">アーカイブボックスに移動しますか？</p>
            <p className="mt-2 text-sm text-slate-600">
              通常の一覧から非表示になり、「アーカイブ」タブで保管されます。いつでも復元できます。
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleArchive}
                disabled={actionLoading === "archive"}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === "archive" ? "処理中..." : "アーカイブする"}
              </button>
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                キャンセル
              </button>
            </div>
          </div>
        </>
      )}

      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl">
            <p className="font-medium text-slate-900">イベントを完全に削除しますか？</p>
            <p className="mt-2 text-sm text-slate-600">
              この操作は取り消せません。募集や参加情報もあわせて削除されます。
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading === "delete"}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === "delete" ? "削除中..." : "削除する"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                キャンセル
              </button>
            </div>
          </div>
        </>
      )}

      {showBillingModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowBillingModal(false)}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl">
            <p className="font-medium text-slate-900">
              今月の公開枠を超えています
            </p>
            <p className="mt-2 text-sm text-slate-600">
              月980円のStarterプランで無制限に公開できます。
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href={PLAN_HREF}
                className="rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                onClick={() => setShowBillingModal(false)}
              >
                プラン変更へ
              </Link>
              <button
                type="button"
                onClick={() => setShowBillingModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
