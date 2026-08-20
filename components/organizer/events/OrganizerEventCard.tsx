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
  Calendar,
  MoreHorizontal,
  Upload,
  Users,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

/** 一覧向けの短い日時（例: 3/4(水) 11:11〜12:00） */
function formatEventScheduleShort(
  date: string,
  startTime?: string | null,
  endTime?: string | null
): string {
  if (!date) return "—";
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  const dateLabel = Number.isNaN(parsed.getTime())
    ? date.slice(0, 10)
    : parsed.toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      });
  const start = startTime?.slice(0, 5) ?? "";
  const end = endTime?.slice(0, 5) ?? "";
  if (start && end) return `${dateLabel} ${start}〜${end}`;
  if (start) return `${dateLabel} ${start}`;
  return dateLabel;
}

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

  const dateTimeStr = formatEventScheduleShort(
    event.date,
    event.startTime,
    event.endTime
  );

  const statusPillClass =
    displayStatus === "public"
      ? "bg-[#EAF6DE] text-[#3a7a10] border-[#B8DEB0]"
      : displayStatus === "archived"
        ? "bg-violet-50 text-violet-700 border-violet-200/80"
        : displayStatus === "ended"
          ? "bg-[#f0eeea] text-[#7a6a58] border-[#e8e6e0]"
          : "bg-[#FFF8E8] text-[#9a7b20] border-[#E8D9A8]";

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

      {/* ── モバイル（募集一覧と同系統のコンパクト行） ── */}
      <div className="org-event-row-card__mobile p-2 min-[900px]:hidden">
        <div className="flex items-start gap-1.5">
          <span
            className="org-event-row-card__mobile-icon flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#e8ede4] bg-[#f0f4ee]"
            aria-hidden
          >
            <Calendar className="h-3 w-3 text-[#7a9488]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5">
              <Link
                href={`/organizer/events/${event.id}`}
                className="org-event-row-card__mobile-title min-w-0 flex-1 truncate leading-tight hover:underline"
              >
                {event.title}
              </Link>
              <span
                className={cn(
                  "org-event-row-card__mobile-badge inline-flex shrink-0 border px-1 py-px",
                  statusPillClass
                )}
              >
                {STATUS_LABELS[displayStatus] ?? displayStatus}
              </span>
            </div>
            <div className="org-event-row-card__mobile-meta mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0">
              <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                <Calendar className="h-2.5 w-2.5 shrink-0" aria-hidden />
                {dateTimeStr}
              </span>
              <span className="whitespace-nowrap">{billingTag.label}</span>
              {event.location ? (
                <span className="max-w-[10rem] truncate">{event.location}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="org-event-row-card__mobile-actions mt-1 flex flex-wrap items-center justify-end gap-0.5">
          {archiveBoxMode ? (
            <>
              <button
                type="button"
                onClick={handleRestore}
                disabled={actionLoading === "restore"}
                className="org-event-row-card__m-btn org-event-row-card__m-btn--primary disabled:opacity-50"
              >
                {actionLoading === "restore" ? "復元中…" : "復元する"}
              </button>
              <Link
                href={`/organizer/events/${event.id}`}
                className="org-event-row-card__m-btn no-underline"
              >
                詳細
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={actionLoading === "delete"}
                className="org-event-row-card__m-btn org-event-row-card__m-btn--danger disabled:opacity-50"
              >
                {actionLoading === "delete" ? "削除中…" : "削除"}
              </button>
            </>
          ) : (
            <>
              {event.visibilityStatus === "draft" ? (
                <button
                  type="button"
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={publishLoading}
                  className="org-event-row-card__m-btn org-event-row-card__m-btn--primary disabled:opacity-50"
                >
                  {publishLoading ? "公開中…" : "公開する"}
                </button>
              ) : (
                <Link
                  href={`/organizer/events/${event.id}`}
                  className="org-event-row-card__m-btn org-event-row-card__m-btn--primary no-underline"
                >
                  詳細
                </Link>
              )}
              <Link
                href={recruitmentHref}
                className="org-event-row-card__m-btn no-underline"
              >
                {hasRecruitment ? "募集管理" : "スタッフ募集"}
              </Link>
              {event.visibilityStatus === "draft" ? (
                <Link
                  href={`/organizer/events/${event.id}`}
                  className="org-event-row-card__m-btn no-underline"
                >
                  編集
                </Link>
              ) : null}
            </>
          )}

          <DropdownMenu open={menuOpenMobile} onOpenChange={setMenuOpenMobile}>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="org-event-row-card__m-menu"
                  aria-label="その他メニュー"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="z-[70] w-56" sideOffset={8}>
              {!archiveBoxMode ? (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      closeAllMenus();
                      nav(payoutsHref);
                    }}
                    className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                  >
                    <FileText className="h-4 w-4" />
                    {payoutsLabel}
                  </DropdownMenuItem>
                  {isVisible ? (
                    <DropdownMenuItem
                      onClick={handleTogglePublish}
                      disabled={actionLoading === "toggle" || publishLoading}
                      className="min-h-11 cursor-pointer gap-2 px-3 py-2.5"
                    >
                      {actionLoading === "toggle" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <GlobeLock className="h-4 w-4" />
                      )}
                      非公開にする
                    </DropdownMenuItem>
                  ) : null}
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
                  {!isArchived ? (
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
                </>
              ) : (
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
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {toast ? (
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
        ) : null}
        {publishError ? (
          <p className="mt-2 text-center text-xs text-red-600">{publishError}</p>
        ) : null}
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
              月980円のProプランで無制限に公開できます。
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
