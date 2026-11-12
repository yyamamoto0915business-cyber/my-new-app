"use client";

import type { ReactNode } from "react";
import {
  UserCheck,
  Users,
  Megaphone,
  ChevronRight,
  QrCode,
  ScanLine,
  MessageCircle,
  AlertTriangle,
  FileText,
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

function PanelHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-1">
        <h2 className="mg-day-mgmt-m__panel-title">{title}</h2>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex min-h-9 shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#2D7A4F]"
          >
            {actionLabel}
            <ChevronRight size={14} aria-hidden />
          </button>
        ) : null}
      </div>
      {subtitle ? <p className="mt-0.5 text-[11.5px] leading-snug text-[#566358]">{subtitle}</p> : null}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  progress,
  footer,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  progress?: number;
  footer?: ReactNode;
}) {
  return (
    <div className="mg-day-mgmt-m__kpi">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[12px] font-semibold leading-tight text-[#566358]">{label}</span>
      </div>
      <div className="mt-1.5 leading-none">
        {value}
        {sub}
      </div>
      {progress !== undefined ? (
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#EAF4ED]">
          <div className="h-full rounded-full bg-[#2D7A4F]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {footer ? <div className="mt-1">{footer}</div> : null}
    </div>
  );
}

export function DayManagementMobileView({
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
    btnClass?: string;
    labelClass?: string;
  }[] = [
    {
      key: "qr",
      label: "受付QRコード表示",
      icon: <QrCode size={14} className="text-[#2D7A4F]" />,
      iconBg: "bg-[#EAF4ED]",
    },
    {
      key: "qr_scan",
      label: "受付QRコード読み取り",
      icon: <ScanLine size={14} className="text-[#2D7A4F]" />,
      iconBg: "bg-[#EAF4ED]",
    },
    {
      key: "announce",
      label: "スタッフに送信",
      icon: <Megaphone size={14} className="text-[#2D7A4F]" />,
      iconBg: "bg-[#EAF4ED]",
    },
    {
      key: "message",
      label: "来場者にメッセージ",
      icon: <MessageCircle size={14} className="text-[#1976D2]" />,
      iconBg: "bg-[#E3F2FD]",
    },
    {
      key: "emergency",
      label: "緊急連絡",
      icon: <AlertTriangle size={14} className="text-[#E53935]" />,
      iconBg: "bg-[#FFCDD2]",
      btnClass: "border-[#FFCDD2] bg-[#FFEBEE]",
      labelClass: "text-[#E53935]",
    },
    {
      key: "memo",
      label: "記録・メモ",
      icon: <FileText size={14} className="text-[#CF9010]" />,
      iconBg: "bg-[#FDF6E3]",
    },
  ];

  return (
    <div className="mg-day-mgmt-m -mx-4 flex flex-col gap-2.5 px-4 pb-20 tablet:mx-auto tablet:w-full tablet:max-w-[860px] tablet:px-0">
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
      />

      {emptyMode ? (
        <header className="mg-day-mgmt-m__hero relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="mg-day-mgmt-m__title">当日の運営</h1>
              <span className="inline-flex rounded-full bg-[#EAF4ED] px-2 py-0.5 text-[11px] font-bold text-[#2D7A4F]">
                本日の運営
              </span>
            </div>
            <p className="mg-day-mgmt-m__desc mt-0.5">{descText}</p>
            <div className="mg-day-mgmt-m__event-card mt-2">
              <p className="text-[13px] font-semibold leading-snug text-[#1A2214]">本日の開催はありません</p>
              <p className="mt-1 text-[11.5px] leading-snug text-[#566358]">
                開催予定のイベントを選択してください
              </p>
            </div>
          </div>
        </header>
      ) : null}

      {/* 受付の操作。当日いちばん使うので、いちばん上に大きく置く（前は画面のいちばん下だった） */}
      <section aria-label="受付の操作" className="grid grid-cols-2 gap-2">
        {(["qr_scan", "qr"] as const)
          .map((key) => quickActions.find((a) => a.key === key))
          .filter((action): action is (typeof quickActions)[number] => Boolean(action))
          .map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => onOpenModal(action.key)}
              className={cn(
                "flex min-h-[64px] items-center justify-center gap-2 rounded-[14px] px-3 text-[14px] font-bold shadow-[0_3px_10px_rgba(22,56,40,0.12)] active:scale-[0.98]",
                action.key === "qr_scan"
                  ? "bg-[#2D7A4F] text-white"
                  : "border border-[#cfe3d5] bg-white text-[#1f5e3a]"
              )}
            >
              {action.key === "qr_scan" ? <ScanLine size={20} aria-hidden /> : <QrCode size={20} aria-hidden />}
              {action.key === "qr_scan" ? "QRを読み取る" : "受付QRを表示"}
            </button>
          ))}
      </section>
      <nav aria-label="連絡と記録" className="grid grid-cols-4 gap-1.5">
        {quickActions
          .filter((a) => a.key !== "qr_scan" && a.key !== "qr")
          .map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => onOpenModal(action.key)}
              className={cn(
                "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[12px] border border-[#dde8df] bg-white px-1 py-2 text-center active:bg-[#f5f8f5]",
                action.btnClass
              )}
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", action.iconBg)}>
                {action.icon}
              </span>
              <span className={cn("text-[10.5px] font-semibold leading-tight text-[#1A2214]", action.labelClass)}>
                {action.label}
              </span>
            </button>
          ))}
      </nav>

      <section className="grid grid-cols-2 gap-2">
        <KpiCard
          icon={
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF4ED]">
              <UserCheck size={13} className="text-[#2D7A4F]" />
            </span>
          }
          label="来場者チェックイン"
          value={<span className="text-[22px] font-bold text-[#1A2214]">{checkin.checkedIn}</span>}
          sub={<span className="ml-1 text-[12px] text-[#566358]">/ {checkin.total}人</span>}
          progress={emptyMode ? 0 : checkinPct}
          footer={!emptyMode ? <p className="text-right text-[11px] text-[#566358]">{checkinPct}%</p> : null}
        />
        <KpiCard
          icon={
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E3F2FD]">
              <Users size={13} className="text-[#1976D2]" />
            </span>
          }
          label="スタッフ出勤"
          value={<span className="text-[22px] font-bold text-[#1A2214]">{staffPresent}</span>}
          sub={<span className="ml-1 text-[12px] text-[#566358]">/ {staffTotal}名</span>}
          progress={emptyMode ? 0 : staffPct}
          footer={!emptyMode ? <p className="text-right text-[11px] text-[#566358]">{staffPct}%</p> : null}
        />
      </section>

      {/* タブレットでは2列：左にチケット・来場状況、右にスタッフとお知らせ */}
      <div className="flex flex-col gap-2.5 tablet:grid tablet:grid-cols-2 tablet:items-start">
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

      {/* プログラム進行は仮データ（MOCK_SCHEDULE）しかなかったので外した */}
      <div className="flex min-w-0 flex-col gap-2.5">

      <StaffStatusCard
        emptyMode={emptyMode}
        dayPhase={dayPhase}
        members={staffMembers}
        loading={staffLoading}
        error={staffError}
        onRetry={() => void reloadStaff()}
        variant="mobile"
      />

      <section className="mg-day-mgmt-m__panel">
        <PanelHeader
          title="お知らせ"
          subtitle="参加者の画面にも表示されます"
          actionLabel={emptyMode ? undefined : "すべて見る"}
          onAction={() => onOpenModal("announce")}
        />
        {emptyMode || notices.length === 0 ? (
          <div className="mt-2 flex flex-col items-center rounded-lg bg-[#F5F8F5] py-3 text-center">
            <Megaphone size={18} className="text-[#DDE8DF]" aria-hidden />
            <p className="mt-1.5 text-[12px] text-[#566358]">現在、お知らせはありません</p>
          </div>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {notices.map((notice, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-lg p-2",
                  notice.type === "urg" ? "bg-[#FFEBEE]" : "bg-[#E3F2FD]"
                )}
              >
                {noticeBadge(notice.type)}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-[#1A2214]">{notice.text}</p>
                  <p className="mt-0.5 text-[11px] text-[#566358]">{notice.time}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
      </div>
    </div>
  );
}
