"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Edit3,
  Eye,
  FileText,
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

const BILLING_HREF = "/organizer/settings/billing";

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
  const [publishAgreed, setPublishAgreed] = useState(false);

  const nav = (href: string) => {
    router.push(href);
  };

  const mainRecruitmentId = event.recruitmentIds?.[0];
  const recruitmentHref = mainRecruitmentId
    ? `/organizer/recruitments/${mainRecruitmentId}`
    : `/organizer/recruitments/new?eventId=${event.id}`;
  const chargesEnabled = billingSummary?.stripeAccountChargesEnabled ?? false;
  const billingTag = getBillingTag(event, chargesEnabled);
  const hasPaidContent =
    event.price > 0 || (event.sponsorTicketPrices?.length ?? 0) > 0;

  const handlePublish = async () => {
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
        return;
      }
      onRefresh?.();
    } catch {
      setPublishError("公開に失敗しました");
    } finally {
      setPublishLoading(false);
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
            <DropdownMenu>
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
              <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    nav(`/events/${event.id}`);
                  }}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  詳細を見る
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    nav(`/organizer/events/${event.id}`);
                  }}
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    nav(`/organizer/stories/new?eventId=${event.id}`);
                  }}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  ストーリーを書く
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    nav(`/organizer/events/${event.id}/sponsors`);
                  }}
                  className="gap-2"
                >
                  スポンサー管理
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    nav(`/organizer/events/${event.id}&section=status`);
                  }}
                  className="gap-2"
                >
                  公開/非公開切替
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    nav(`/organizer/events/new?copyFrom=${event.id}`);
                  }}
                  className="gap-2"
                >
                  複製
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    nav(`/organizer/events/${event.id}&section=archive`);
                  }}
                  className="gap-2"
                >
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

          <div className="flex flex-wrap items-center gap-2">
            {event.status === "draft" && (
              <button
                type="button"
                onClick={() => setShowPublishConfirm(true)}
                disabled={publishLoading}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {publishLoading ? "公開中..." : "公開する"}
              </button>
            )}
            {publishError && (
              <span className="text-xs text-red-600">{publishError}</span>
            )}
            <Link
              href={recruitmentHref}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              <Users className="h-4 w-4" aria-hidden />
              募集管理
            </Link>
            <Link
              href={
                hasPaidContent && chargesEnabled
                  ? `/organizer/events/${event.id}/sponsors`
                  : BILLING_HREF
              }
              className={`inline-flex rounded-xl px-4 py-2 text-sm font-medium transition ${
                !chargesEnabled
                  ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {!chargesEnabled
                ? "決済設定"
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
              <DropdownMenu>
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
                <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      nav(`/events/${event.id}`);
                    }}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    詳細を見る
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      nav(`/organizer/events/${event.id}`);
                    }}
                    className="gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      nav(`/organizer/stories/new?eventId=${event.id}`);
                    }}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    ストーリーを書く
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      nav(`/organizer/events/${event.id}/sponsors`);
                    }}
                    className="gap-2"
                  >
                    スポンサー管理
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      nav(`/organizer/events/${event.id}`);
                    }}
                    className="gap-2"
                  >
                    公開/非公開切替
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      nav(`/organizer/events/new?copyFrom=${event.id}`);
                    }}
                    className="gap-2"
                  >
                    複製
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      nav(`/organizer/events/${event.id}`);
                    }}
                    className="gap-2"
                  >
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
                  handlePublish();
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
                href="/organizer/settings/billing"
                className="rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                onClick={() => setShowBillingModal(false)}
              >
                課金設定へ
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
