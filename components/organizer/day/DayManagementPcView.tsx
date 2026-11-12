"use client";

import type { ReactNode } from "react";
import {
  UserCheck,
  Users,
  QrCode,
  ScanLine,
  Megaphone,
  MessageCircle,
  AlertTriangle,
  FileText,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayManageableEvent } from "@/lib/organizer/day-manageable-events";
import {
  attendanceToCheckinKpi,
  useDayOpsSummary,
} from "@/hooks/use-day-ops-summary";
import {
  noticeBadge,
  countRealStaff,
  EMPTY_CHECKIN,
  type DayNotice,
  type EventInfo,
  type EventDayPhase,
  type ModalType,
} from "./day-management-shared";
import { DayManagementEventSwitcher } from "./DayManagementEventSwitcher";
import { TicketSalesAttendanceCard } from "./TicketSalesAttendanceCard";
import { StaffStatusCard } from "./StaffStatusCard";
import { useStaffStatus } from "@/hooks/use-staff-status";

type Props = {
  event: EventInfo;
  eventId: string;
  dayPhase: EventDayPhase;
  allEvents: DayManageableEvent[];
  eventsLoading?: boolean;
  emptyMode?: boolean;
  notices: DayNotice[];
  onOpenModal: (type: ModalType) => void;
};

function KpiProgressBar({
  pct,
  tone,
}: {
  pct: number;
  tone: "green" | "blue" | "amber" | "none";
}) {
  const track =
    tone === "green"
      ? "bg-[#EAF4ED]"
      : tone === "blue"
        ? "bg-[#E3F2FD]"
        : tone === "amber"
          ? "bg-[#FDF6E3]"
          : "bg-[#f0f0f0]";
  const fill =
    tone === "green"
      ? "bg-[#2D7A4F]"
      : tone === "blue"
        ? "bg-[#1976D2]"
        : tone === "amber"
          ? "bg-[#CF9010]"
          : "bg-transparent";

  return (
    <div className={cn("mt-1 h-1 w-full overflow-hidden rounded-full", track)}>
      <div className={cn("h-full rounded-full transition-all", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function DayManagementPcView({
  event,
  eventId,
  dayPhase,
  allEvents,
  eventsLoading = false,
  emptyMode = false,
  notices,
  onOpenModal,
}: Props) {
  const { data: dayOps, loading: dayOpsLoading, error: dayOpsError, refreshing: dayOpsRefreshing, reload: reloadDayOps } =
    useDayOpsSummary({ eventId, emptyMode });
  const {
    members: staffMembers,
    loading: staffLoading,
    error: staffError,
    reload: reloadStaff,
  } = useStaffStatus({ eventId, emptyMode });
  const isPast = dayPhase === "past";
  const showHero = emptyMode || !isPast;
  const descText = emptyMode
    ? "イベント当日の受付・進行状況をリアルタイムで確認できます。"
    : isPast
      ? "イベント当日の受付・進行状況を振り返れます。"
      : "イベント当日の受付・進行状況をリアルタイムで確認できます。";
  const checkin = emptyMode ? EMPTY_CHECKIN : attendanceToCheckinKpi(dayOps);
  // 前は仮のスタッフ（MOCK_STAFF）から数えていた。本物の応募・出勤から数える
  const realStaff = countRealStaff(staffMembers);
  const staffPresent = emptyMode ? 0 : realStaff.present;
  const staffTotal = emptyMode ? 0 : realStaff.total;
  const checkinPct = checkin.total > 0 ? Math.round((checkin.checkedIn / checkin.total) * 100) : 0;
  const staffPct = staffTotal > 0 ? Math.round((staffPresent / staffTotal) * 100) : 0;

  const quickActions: {
    key: ModalType;
    label: string;
    icon: ReactNode;
    iconBg: string;
    cardClass?: string;
  }[] = [
    {
      key: "qr",
      label: "受付QRコード表示",
      icon: <QrCode size={15} className="text-[#2D7A4F]" />,
      iconBg: "bg-[#EAF4ED]",
    },
    {
      key: "qr_scan",
      label: "受付QRコード読み取り",
      icon: <ScanLine size={15} className="text-[#2D7A4F]" />,
      iconBg: "bg-[#EAF4ED]",
    },
    {
      key: "announce",
      label: "スタッフに送信",
      icon: <Megaphone size={15} className="text-[#2D7A4F]" />,
      iconBg: "bg-[#EAF4ED]",
    },
    {
      key: "message",
      label: "来場者にメッセージ",
      icon: <MessageCircle size={15} className="text-[#1976D2]" />,
      iconBg: "bg-[#E3F2FD]",
    },
    {
      key: "emergency",
      label: "緊急連絡",
      icon: <AlertTriangle size={15} className="text-[#E53935]" />,
      iconBg: "bg-[#FFCDD2]",
      cardClass: "border-[#FFCDD2] bg-[#FFEBEE] hover:border-[#E53935] hover:bg-[#FFCDD2]",
    },
    {
      key: "memo",
      label: "記録・メモ",
      icon: <FileText size={15} className="text-[#CF9010]" />,
      iconBg: "bg-[#FDF6E3]",
    },
  ];

  return (
    <div
      className={cn(
        "mg-day-mgmt-pc",
        emptyMode ? "mg-day-mgmt-pc--compact" : "mg-day-mgmt-pc--selected"
      )}
    >
      {showHero ? (
        <section
          className={cn(
            "mg-day-mgmt-pc__hero shrink-0",
            emptyMode ? "mg-day-mgmt-pc__hero--compact" : "mg-day-mgmt-pc__hero--selected"
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mg-day-mgmt-pc__title">当日の運営</h1>
            <span className="rounded-full bg-[#EAF4ED] px-2.5 py-0.5 text-[10px] font-bold text-[#2D7A4F]">
              本日の運営
            </span>
            {emptyMode ? (
              <span className="rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-bold text-[#566358]">
                本日の開催なし
              </span>
            ) : null}
          </div>
          {emptyMode ? <p className="mg-day-mgmt-pc__desc mt-1">{descText}</p> : null}
        </section>
      ) : null}

      <DayManagementEventSwitcher
        currentEventId={eventId}
        currentTitle={event.title}
        currentDate={emptyMode ? undefined : event.date}
        currentVenue={emptyMode ? undefined : event.venue}
        currentStatus={emptyMode ? undefined : event.status}
        currentDayPhase={emptyMode ? undefined : dayPhase}
        currentEventFormat={emptyMode ? undefined : event.eventFormat}
        currentOnlineService={emptyMode ? undefined : event.onlineService}
        currentOnlineJoinUrl={emptyMode ? undefined : event.onlineJoinUrl}
        events={allEvents}
        loading={eventsLoading}
        variant={emptyMode ? "empty" : "current"}
        compact
        className="shrink-0"
      />

      {/* KPI */}
      <div className="mg-day-mgmt-pc__kpi-grid grid shrink-0 grid-cols-2">
        <div className="mg-day-mgmt-pc__kpi">
          <div className="flex items-center gap-1.5">
            <span className="mg-day-mgmt-pc__kpi-icon mg-day-mgmt-pc__kpi-icon--green">
              <UserCheck size={13} className="text-[#2D7A4F]" />
            </span>
            <span className="mg-day-mgmt-pc__kpi-label">来場者チェックイン</span>
          </div>
          <p className="mg-day-mgmt-pc__kpi-value mt-0.5">
            {checkin.checkedIn}
            <span className="mg-day-mgmt-pc__kpi-unit">/ {checkin.total}人</span>
            {!emptyMode ? (
              <span className="mg-day-mgmt-pc__kpi-unit">{checkinPct}%</span>
            ) : null}
          </p>
          <KpiProgressBar pct={checkinPct} tone="green" />
        </div>

        <div className="mg-day-mgmt-pc__kpi">
          <div className="flex items-center gap-1.5">
            <span className="mg-day-mgmt-pc__kpi-icon mg-day-mgmt-pc__kpi-icon--blue">
              <Users size={13} className="text-[#1976D2]" />
            </span>
            <span className="mg-day-mgmt-pc__kpi-label">スタッフ出勤</span>
          </div>
          <p className="mg-day-mgmt-pc__kpi-value mt-0.5">
            {staffPresent}
            <span className="mg-day-mgmt-pc__kpi-unit">/ {staffTotal}名</span>
            {!emptyMode ? (
              <span className="mg-day-mgmt-pc__kpi-unit">{staffPct}%</span>
            ) : null}
          </p>
          <KpiProgressBar pct={staffPct} tone="blue" />
        </div>

      </div>

      {/* プログラム進行は仮データ（MOCK_SCHEDULE）しかなかったので外し、上段に来場状況とスタッフ、下段にお知らせを置く */}
      <div className="mg-day-mgmt-pc__sections mg-day-mgmt-pc__sections--3">
        <TicketSalesAttendanceCard
          eventId={eventId}
          emptyMode={emptyMode}
          compact
          onOpenCheckinList={() => onOpenModal("checkin_list")}
          summary={dayOps}
          summaryLoading={dayOpsLoading}
          summaryError={dayOpsError}
          summaryRefreshing={dayOpsRefreshing}
          onRefreshSummary={reloadDayOps}
        />

        <StaffStatusCard
          emptyMode={emptyMode}
          dayPhase={dayPhase}
          members={staffMembers}
          loading={staffLoading}
          error={staffError}
          onRetry={() => void reloadStaff()}
        />

        <div
          className={cn(
            "mg-day-mgmt-pc__panel mg-day-mgmt-pc__panel--compact mg-day-mgmt-pc__panel--notices flex min-h-0 flex-col",
            emptyMode && "mg-day-mgmt-pc__panel--notices-empty"
          )}
        >
          <h2 className="mg-day-mgmt-pc__panel-title shrink-0">お知らせ</h2>
          <p className="mt-0.5 text-[9px] leading-snug text-[#566358]">
            参加者の画面にも表示されます
          </p>
          {emptyMode || notices.length === 0 ? (
            <div className="mg-day-mgmt-pc__empty-inline mt-1.5">
              <Inbox size={16} className="shrink-0 text-[#DDE8DF]" aria-hidden />
              <p className="mg-day-mgmt-pc__empty-text">
                お知らせはまだありません。配信するとここに表示されます。
              </p>
            </div>
          ) : (
            <ul className="mt-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
              {notices.map((notice, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex shrink-0 items-start gap-1.5 rounded-md px-1.5 py-1",
                    notice.type === "urg" ? "bg-[#FFEBEE]" : "bg-[#E3F2FD]"
                  )}
                >
                  {noticeBadge(notice.type, { compact: true })}
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-[11px] text-[#1A2214]">{notice.text}</p>
                    <p className="mt-0.5 text-[9px] text-[#566358]">{notice.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mg-day-mgmt-pc__quick-actions shrink-0">
        {quickActions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => onOpenModal(action.key)}
            className={cn("mg-day-mgmt-pc__quick-btn", action.cardClass)}
          >
            <span className={cn("mg-day-mgmt-pc__quick-icon", action.iconBg)}>{action.icon}</span>
            <span
              className={cn(
                "text-[11px] font-medium leading-tight",
                action.key === "emergency" ? "text-[#E53935]" : "text-[#1A2214]"
              )}
            >
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
