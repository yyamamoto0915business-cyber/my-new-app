"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Ticket,
  ClipboardList,
  CircleDollarSign,
  User,
  ShoppingCart,
  Check,
  ChevronRight,
  BarChart3,
  List,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDayOpsSummary } from "@/hooks/use-day-ops-summary";
import { DonutChart } from "@/components/organizer/day/day-management-shared";
import {
  formatCheckedInRatio,
  formatLastUpdatedLabel,
  formatSoldTickets,
  formatYen,
} from "@/lib/organizer/day-ops-format";
import type { DayOpsTicketSalesSummary } from "@/lib/organizer/day-ops-types";

type Props = {
  eventId: string;
  emptyMode?: boolean;
  compact?: boolean;
  onOpenCheckinList?: () => void;
  className?: string;
  /** 親で取得済みの場合は渡す（重複fetch防止） */
  summary?: DayOpsTicketSalesSummary | null;
  summaryLoading?: boolean;
  summaryError?: string | null;
  summaryRefreshing?: boolean;
  onRefreshSummary?: (opts?: { silent?: boolean }) => void;
};

const EMPTY_SUMMARY: DayOpsTicketSalesSummary = {
  updatedAt: new Date(0).toISOString(),
  salesMode: "free",
  attendance: { checkedIn: 0, notCheckedIn: 0, cancelled: 0 },
  sales: null,
  flow: { purchased: 0, attended: 0, receptionComplete: 0 },
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-[#EAF4ED]", className)} />;
}

export function TicketSalesAttendanceCard({
  eventId,
  emptyMode = false,
  compact = false,
  onOpenCheckinList,
  className,
  summary: summaryProp,
  summaryLoading,
  summaryError,
  summaryRefreshing,
  onRefreshSummary,
}: Props) {
  const controlled = typeof onRefreshSummary === "function";
  const internal = useDayOpsSummary({
    eventId,
    emptyMode: emptyMode || controlled,
    pollMs: controlled ? 0 : 20_000,
  });

  const data = controlled ? (summaryProp ?? null) : internal.data;
  const loading = controlled ? Boolean(summaryLoading) : internal.loading;
  const error = controlled ? (summaryError ?? null) : internal.error;
  const refreshing = controlled ? Boolean(summaryRefreshing) : internal.refreshing;
  const load = controlled
    ? (opts?: { silent?: boolean }) => {
        onRefreshSummary?.(opts);
      }
    : internal.reload;

  const summary = data ?? EMPTY_SUMMARY;
  const isFree = summary.salesMode === "free";
  const isOffline = summary.salesMode === "offline";
  const title = isFree ? "来場状況" : "チケット販売・来場状況";
  const showSalesGrid = !isFree;
  const donutTotal =
    summary.attendance.checkedIn +
    summary.attendance.notCheckedIn +
    summary.attendance.cancelled;
  const donutSegments = [
    { color: "#4CAF50", value: summary.attendance.checkedIn },
    { color: "#e0e0e0", value: summary.attendance.notCheckedIn },
    { color: "#E53935", value: summary.attendance.cancelled },
  ];
  const reportHref = eventId
    ? `/organizer/events/${encodeURIComponent(eventId)}/ticket-sales`
    : "#";

  return (
    <section
      className={cn(
        "mg-ticket-sales-card flex min-h-0 flex-col",
        compact && "mg-ticket-sales-card--compact",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="mg-ticket-sales-card__title">{title}</h2>
        {!emptyMode && eventId ? (
          <button
            type="button"
            onClick={() => void load({ silent: true })}
            disabled={loading || refreshing}
            className="mg-ticket-sales-card__updated inline-flex shrink-0 items-center gap-1"
            aria-label="データを更新"
          >
            <span>
              {data ? formatLastUpdatedLabel(data.updatedAt) : "最終更新 —"}
            </span>
            <RefreshCw
              size={12}
              className={cn("text-[#2D7A4F]", (loading || refreshing) && "animate-spin")}
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      {emptyMode ? (
        <div className="mg-ticket-sales-card__empty mt-3 flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-[#e8e6e0] text-[11px] text-[#566358]">
            —
          </div>
          <p className="mt-2 text-[11px] leading-snug text-[#566358]">
            イベントを選択すると来場状況が表示されます
          </p>
        </div>
      ) : loading && !data ? (
        <div className="mt-3 flex flex-1 flex-col gap-3">
          <div className="flex gap-3">
            <SkeletonBlock className="h-24 w-24 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-4 w-16" />
            </div>
          </div>
          <SkeletonBlock className="h-16 w-full" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SkeletonBlock className="h-9" />
            <SkeletonBlock className="h-9" />
          </div>
        </div>
      ) : error ? (
        <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-[12px] text-[#566358]">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1 rounded-lg border border-[#2D7A4F] bg-white px-3 py-1.5 text-[11px] font-medium text-[#2D7A4F] hover:bg-[#EAF4ED]"
          >
            <RefreshCw size={12} />
            再読み込み
          </button>
        </div>
      ) : (
        <>
          {/* 上段: グラフ + サマリー */}
          <div
            className={cn(
              "mg-ticket-sales-card__top",
              compact ? "mt-1" : "mt-3",
              showSalesGrid && "mg-ticket-sales-card__top--with-sales"
            )}
          >
            <div className="mg-ticket-sales-card__chart-block">
              <div className="relative shrink-0">
                <DonutChart
                  segments={donutSegments}
                  total={Math.max(donutTotal, 1)}
                  size={compact ? 64 : 108}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      "font-bold leading-none text-[#1A2214]",
                      compact ? "text-[14px]" : "text-[18px] sm:text-[20px]"
                    )}
                  >
                    {summary.attendance.checkedIn}
                  </span>
                  <span className={cn("text-[#566358]", compact ? "text-[8px]" : "mt-0.5 text-[10px]")}>
                    入場
                  </span>
                </div>
              </div>
              <ul className="mg-ticket-sales-card__legend">
                <li>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#4CAF50]" />
                  <span>チェックイン済</span>
                </li>
                <li>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#e0e0e0]" />
                  <span>未チェックイン</span>
                </li>
                <li>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#E53935]" />
                  <span>キャンセル</span>
                </li>
              </ul>
            </div>

            {showSalesGrid ? (
              isOffline ? (
                <div className="mg-ticket-sales-card__offline">
                  <p>このイベントではオンラインチケット販売を利用していません</p>
                </div>
              ) : summary.sales ? (
                <div className="mg-ticket-sales-card__summary" role="list">
                  <div className="mg-ticket-sales-card__summary-item" role="listitem">
                    <span className="mg-ticket-sales-card__summary-icon">
                      <Ticket size={compact ? 12 : 14} className="text-[#2D7A4F]" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="mg-ticket-sales-card__summary-label">販売枚数</p>
                      <p className="mg-ticket-sales-card__summary-value">
                        {formatSoldTickets(summary.sales.soldTickets, summary.sales.capacity)}
                      </p>
                    </div>
                  </div>
                  <div className="mg-ticket-sales-card__summary-item" role="listitem">
                    <span className="mg-ticket-sales-card__summary-icon">
                      <ClipboardList size={compact ? 12 : 14} className="text-[#2D7A4F]" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="mg-ticket-sales-card__summary-label">注文数</p>
                      <p className="mg-ticket-sales-card__summary-value">
                        {summary.sales.orderCount}
                        <span className="mg-ticket-sales-card__summary-unit">件</span>
                      </p>
                    </div>
                  </div>
                  <div className="mg-ticket-sales-card__summary-item" role="listitem">
                    <span className="mg-ticket-sales-card__summary-icon">
                      <CircleDollarSign size={compact ? 12 : 14} className="text-[#2D7A4F]" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="mg-ticket-sales-card__summary-label">総売上</p>
                      <p className="mg-ticket-sales-card__summary-value">
                        {formatYen(summary.sales.grossSalesYen)}
                      </p>
                    </div>
                  </div>
                  <div className="mg-ticket-sales-card__summary-item" role="listitem">
                    <span className="mg-ticket-sales-card__summary-icon">
                      <User size={compact ? 12 : 14} className="text-[#2D7A4F]" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="mg-ticket-sales-card__summary-label">チェックイン済み</p>
                      <p className="mg-ticket-sales-card__summary-value">
                        {formatCheckedInRatio(
                          summary.sales.checkedIn,
                          summary.sales.validHolders || summary.sales.soldTickets
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null
            ) : null}
          </div>

          {/* 中段: 参加フロー */}
          <div className={cn("mg-ticket-sales-card__flow", compact ? "mt-1" : "mt-3")}>
            <FlowStep
              compact={compact}
              icon={<ShoppingCart size={compact ? 12 : 14} className="text-[#2D7A4F]" />}
              label={isFree ? "申込" : "購入"}
              value={`${summary.flow.purchased} 件`}
            />
            <ArrowRight
              size={compact ? 12 : 14}
              className="mg-ticket-sales-card__flow-arrow shrink-0"
              aria-hidden
            />
            <FlowStep
              compact={compact}
              icon={<User size={compact ? 12 : 14} className="text-[#2D7A4F]" />}
              label="来場"
              value={`${summary.flow.attended} 人`}
            />
            <ArrowRight
              size={compact ? 12 : 14}
              className="mg-ticket-sales-card__flow-arrow shrink-0"
              aria-hidden
            />
            <FlowStep
              compact={compact}
              icon={<Check size={compact ? 12 : 14} className="text-[#2D7A4F]" />}
              label="受付完了"
              value={`${summary.flow.receptionComplete} 人`}
            />
          </div>

          {/* 下段: ボタン */}
          <div
            className={cn(
              "mg-ticket-sales-card__actions",
              compact ? "mt-1" : "mt-3",
              isFree && "mg-ticket-sales-card__actions--single"
            )}
          >
            <button
              type="button"
              onClick={onOpenCheckinList}
              disabled={!onOpenCheckinList}
              className="mg-ticket-sales-card__btn"
            >
              <List size={compact ? 12 : 14} aria-hidden />
              <span className="min-w-0 flex-1 text-left">受付リストを開く</span>
              <ChevronRight size={compact ? 12 : 14} aria-hidden />
            </button>
            {!isFree ? (
              <Link href={reportHref} className="mg-ticket-sales-card__btn">
                <BarChart3 size={compact ? 12 : 14} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-left">
                  チケット販売レポートを表示
                </span>
                <ChevronRight size={compact ? 12 : 14} aria-hidden />
              </Link>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}

function FlowStep({
  icon,
  label,
  value,
  compact = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="mg-ticket-sales-card__flow-step">
      <span className="mg-ticket-sales-card__flow-icon">{icon}</span>
      <div className="min-w-0 text-center">
        <p
          className={cn(
            "leading-tight text-[#566358]",
            compact ? "text-[9px]" : "text-[10px]"
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "font-bold leading-tight text-[#1A2214]",
            compact ? "text-[11px]" : "text-[12px]"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
