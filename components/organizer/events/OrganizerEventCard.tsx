"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ChevronDown,
  Copy,
  Edit3,
  Eye,
  FileText,
  Globe,
  GlobeLock,
  Loader2,
  MoreHorizontal,
  Users,
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
};

const STATUS_STYLES: Record<string, string> = {
  public: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  draft: "bg-amber-50 text-amber-700 border-amber-200/80",
  ended: "bg-slate-100 text-slate-600 border-slate-200/80",
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
};

export function OrganizerEventCard({
  event,
  billingSummary,
  onRefresh,
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
  const [actionLoading, setActionLoading] = useState<null | "toggle" | "archive">(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
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
  const isVisible = event.visibilityStatus === "published";
  const hasPaidContent =
    event.price > 0 || (event.sponsorTicketPrices?.length ?? 0) > 0;
  const nextActions: Array<{ label: string; href: string }> = [];
  if (hasPaidContent && !chargesEnabled) {
    nextActions.push({ label: "売上受取を設定する", href: PAYOUTS_HREF });
  }
  if (!hasRecruitment) {
    nextActions.push({
      label: "スタッフ募集を作る",
      href: `/organizer/recruitments/new?eventId=${event.id}`,
    });
  }
  if (event.status === "draft") {
    nextActions.push({ label: "公開設定を完了する", href: `/organizer/events/${event.id}` });
  }
  nextActions.push({ label: "ストーリーを書く", href: `/organizer/stories/new?eventId=${event.id}` });

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
      showToast("success", "アーカイブしました");
      onRefresh?.();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "アーカイブに失敗しました";
      showToast("error", message);
    } finally {
      setActionLoading(null);
    }
  };

  const dateTimeStr = `${event.date} ${event.startTime}${
    event.endTime ? `〜${event.endTime}` : ""
  }`;

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-4 sm:p-5">
        {/* 上段: タイトル + ステータス */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href={`/events/${event.id}`}
              className="text-base font-semibold text-slate-900 hover:underline sm:text-lg"
            >
              {event.title}
            </Link>
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`inline-flex shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                  STATUS_STYLES[event.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {STATUS_LABELS[event.status] ?? event.status}
              </span>
              <span
                className={`inline-flex shrink-0 rounded-lg border px-2.5 py-1 text-xs ${billingTag.className}`}
              >
                {billingTag.label}
              </span>
              <span className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-xs text-slate-600">
                {event.price === 0 ? "無料" : `¥${event.price}`}
              </span>
            </div>
          </div>
          {/* PC: メニューボタン */}
          <div className="hidden shrink-0 sm:block">
            <DropdownMenu open={menuOpenDesktop} onOpenChange={setMenuOpenDesktop}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
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
                  className="min-h-10 cursor-pointer gap-2 px-3 py-2"
                >
                  <Eye className="h-4 w-4" />
                  詳細を見る
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 中段: 日時・場所 */}
        <p className="mt-3 text-sm text-slate-600">
          {dateTimeStr}
          <span className="mx-2 opacity-50">・</span>
          {event.location}
        </p>

        {/* 下段: 補助情報 + アクション */}
        <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {event.capacity != null && (
                <span>
                  参加 {event.participantCount ?? 0}/{event.capacity}
                </span>
              )}
              {((event.plannedCount ?? 0) > 0 || (event.interestedCount ?? 0) > 0) && (
                <span>
                  参加予定 {event.plannedCount ?? 0} ・ 関心あり {event.interestedCount ?? 0}
                </span>
              )}
              <span>応募 {event.applicationCount ?? 0}</span>
              {(event.unreadCount ?? 0) > 0 && (
                <span className="font-medium text-amber-600">
                  未読 {event.unreadCount}
                </span>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="font-medium text-slate-700">次にやること:</span>
              {nextActions.slice(0, 3).map((action) => (
                <Link
                  key={`${event.id}-${action.label}`}
                  href={action.href}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  {action.label}
                </Link>
              ))}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {event.visibilityStatus === "draft" && (
              <button
                type="button"
                onClick={() => {
                  setShowPublishConfirm(true);
                }}
                disabled={publishLoading}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {publishLoading ? "公開中..." : "公開する"}
              </button>
            )}
            {isVisible && (
              <button
                type="button"
                onClick={() => {
                  setShowUnpublishConfirm(true);
                }}
                disabled={actionLoading === "toggle" || publishLoading}
                className="rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                非公開にする
              </button>
            )}
            {toast && (
              <span
                className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                  toast.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
                role="status"
              >
                {toast.message}
              </span>
            )}
            {publishError && (
              <span className="text-xs text-red-600">{publishError}</span>
            )}
            <Link
              href={recruitmentHref}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              <Users className="h-4 w-4" aria-hidden />
              スタッフ募集を管理
            </Link>
            <Link
              href={
                hasPaidContent && chargesEnabled
                  ? `/organizer/events/${event.id}/sponsors`
                  : PAYOUTS_HREF
              }
              className={`inline-flex rounded-xl px-4 py-2 text-sm font-medium transition ${
                !chargesEnabled
                  ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {!chargesEnabled
                ? "売上受取設定"
                : hasPaidContent
                  ? "売上確認"
                  : "売上"}
            </Link>
            <Link
              href={`/events/${event.id}/chat`}
              className="relative inline-flex items-center rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              チャット
              {(event.unreadCount ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                  {event.unreadCount > 99 ? "99+" : event.unreadCount}
                </span>
              )}
            </Link>
            {/* スマホ: メニューボタン */}
            <div className="sm:hidden">
              <DropdownMenu open={menuOpenMobile} onOpenChange={setMenuOpenMobile}>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600"
                      aria-label="その他メニュー"
                    >
                      <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
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
                    {isVisible ? "公開中 → 非公開にする" : "非公開 → 公開する"}
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
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
            <p className="font-medium text-slate-900">このイベントをアーカイブしますか？</p>
            <p className="mt-2 text-sm text-slate-600">
              アーカイブ後は公開一覧に表示されなくなります。
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
