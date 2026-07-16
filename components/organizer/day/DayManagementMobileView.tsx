"use client";

import type { ReactNode } from "react";
import {
  UserCheck,
  Users,
  Calendar,
  Bell,
  Megaphone,
  Clock,
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
  MOCK_STAFF,
  MOCK_SCHEDULE,
  scheduleChip,
  noticeBadge,
  countStaffPresent,
  countScheduleProgress,
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
            className="inline-flex shrink-0 items-center gap-0.5 text-[9px] font-medium text-[#2D7A4F]"
          >
            {actionLabel}
            <ChevronRight size={10} aria-hidden />
          </button>
        ) : null}
      </div>
      {subtitle ? <p className="mt-0.5 text-[8px] leading-snug text-[#566358]">{subtitle}</p> : null}
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
        <span className="text-[9px] font-medium leading-tight text-[#566358]">{label}</span>
      </div>
      <div className="mt-1 leading-none">
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
  const isUpcoming = dayPhase === "upcoming";
  const scheduleTitle = emptyMode ? "本日のスケジュール" : isPast ? "スケジュール" : "本日のスケジュール";
  const descText = emptyMode
    ? "イベント当日の受付・進行状況をリアルタイムで確認できます。"
    : isPast
      ? "イベント当日の受付・進行状況を振り返れます。"
      : "イベント当日の受付・進行状況をリアルタイムで確認できます。";

  const checkin = emptyMode ? EMPTY_CHECKIN : attendanceToCheckinKpi(dayOps);
  const staffPresent = emptyMode ? 0 : countStaffPresent(MOCK_STAFF);
  const staffTotal = emptyMode ? 0 : MOCK_STAFF.length;
  const schedDone = emptyMode ? 0 : countScheduleProgress(MOCK_SCHEDULE);
  const schedTotal = emptyMode ? 0 : MOCK_SCHEDULE.length;
  const unreadNotices = emptyMode ? 0 : notices.length;
  const checkinPct = checkin.total > 0 ? Math.round((checkin.checkedIn / checkin.total) * 100) : 0;
  const staffPct = staffTotal > 0 ? Math.round((staffPresent / staffTotal) * 100) : 0;
  const schedPct = schedTotal > 0 ? Math.round((schedDone / schedTotal) * 100) : 0;

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
    <div className="mg-day-mgmt-m -mx-4 flex flex-col gap-1.5 px-4 pb-20 sm:-mx-6 sm:px-6">
      <DayManagementEventSwitcher
        currentEventId={eventId}
        currentTitle={event.title}
        currentDate={emptyMode ? undefined : event.date}
        currentVenue={emptyMode ? undefined : event.venue}
        currentStatus={emptyMode ? undefined : event.status}
        currentDayPhase={emptyMode ? undefined : dayPhase}
        events={allEvents}
        loading={eventsLoading}
        variant={emptyMode ? "empty" : "current"}
        compact
      />

      {emptyMode ? (
        <header className="mg-day-mgmt-m__hero relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="mg-day-mgmt-m__title">ダッシュボード</h1>
              <span className="inline-flex rounded-full bg-[#EAF4ED] px-2 py-0.5 text-[9px] font-bold text-[#2D7A4F]">
                本日の運営
              </span>
            </div>
            <p className="mg-day-mgmt-m__desc mt-0.5">{descText}</p>
            <div className="mg-day-mgmt-m__event-card mt-2">
              <p className="text-[11px] font-semibold leading-snug text-[#1A2214]">本日の開催はありません</p>
              <p className="mt-1 text-[9px] leading-snug text-[#566358]">
                開催予定のイベントを選択してください
              </p>
            </div>
          </div>
        </header>
      ) : null}

      <section className="grid grid-cols-2 gap-1.5">
        <KpiCard
          icon={
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF4ED]">
              <UserCheck size={11} className="text-[#2D7A4F]" />
            </span>
          }
          label="来場者チェックイン"
          value={<span className="text-[16px] font-bold text-[#1A2214]">{checkin.checkedIn}</span>}
          sub={
            <span className="ml-0.5 text-[10px] text-[#566358]">
              / {checkin.total}人
            </span>
          }
          progress={emptyMode ? 0 : checkinPct}
          footer={
            !emptyMode ? (
              <p className="text-right text-[9px] text-[#566358]">{checkinPct}%</p>
            ) : null
          }
        />
        <KpiCard
          icon={
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E3F2FD]">
              <Users size={11} className="text-[#1976D2]" />
            </span>
          }
          label="スタッフ出勤"
          value={<span className="text-[16px] font-bold text-[#1A2214]">{staffPresent}</span>}
          sub={
            <span className="ml-0.5 text-[10px] text-[#566358]">
              / {staffTotal}名
            </span>
          }
          progress={emptyMode ? 0 : staffPct}
          footer={
            !emptyMode ? (
              <p className="text-right text-[9px] text-[#566358]">{staffPct}%</p>
            ) : null
          }
        />
        <KpiCard
          icon={
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FDF6E3]">
              <Clock size={11} className="text-[#CF9010]" />
            </span>
          }
          label="プログラム進行"
          value={<span className="text-[16px] font-bold text-[#1A2214]">{schedDone}</span>}
          sub={
            <span className="ml-0.5 text-[10px] text-[#566358]">
              / {schedTotal}件
            </span>
          }
          footer={
            emptyMode || isUpcoming ? (
              <span className="inline-flex rounded-full bg-[#FDF6E3] px-2 py-0.5 text-[9px] font-semibold text-[#CF9010]">
                未開始
              </span>
            ) : (
              <div className="h-1 w-full overflow-hidden rounded-full bg-[#FDF6E3]">
                <div className="h-full rounded-full bg-[#CF9010]" style={{ width: `${schedPct}%` }} />
              </div>
            )
          }
        />
        <KpiCard
          icon={
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFEBEE]">
              <Bell size={11} className="text-[#E53935]" />
            </span>
          }
          label="お知らせ未読"
          value={<span className="text-[16px] font-bold text-[#1A2214]">{unreadNotices}</span>}
          sub={<span className="ml-0.5 text-[10px] text-[#566358]">件</span>}
          footer={
            <p className="text-[9px] text-[#566358]">
              {emptyMode || unreadNotices === 0 ? "未読はありません" : "未読のお知らせがあります"}
            </p>
          }
        />
      </section>

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

      <section className="mg-day-mgmt-m__panel">
        <PanelHeader
          title={scheduleTitle}
          actionLabel={emptyMode ? undefined : "すべて見る"}
          onAction={() => onOpenModal("memo")}
        />
        {emptyMode ? (
          <div className="mt-2 flex flex-col items-center py-2 text-center">
            <Calendar size={18} className="text-[#DDE8DF]" aria-hidden />
            <p className="mt-1.5 text-[9px] leading-snug text-[#566358]">
              イベントを選択すると表示されます
            </p>
          </div>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {MOCK_SCHEDULE.map((item, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-1.5 py-1",
                  item.status === "live" ? "bg-[#EAF4ED]" : "bg-[#F5F8F5]"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[7px] leading-none text-[#566358]">{item.time}</p>
                  <p className="truncate text-[9px] font-medium leading-tight text-[#1A2214]">{item.name}</p>
                </div>
                <div className="shrink-0 scale-[0.82] origin-right">{scheduleChip(item.status)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

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
            <p className="mt-1.5 text-[9px] text-[#566358]">現在、お知らせはありません</p>
          </div>
        ) : (
          <ul className="mt-1.5 space-y-1.5">
            {notices.map((notice, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-1.5 rounded-lg p-1.5",
                  notice.type === "urg" ? "bg-[#FFEBEE]" : "bg-[#E3F2FD]"
                )}
              >
                {noticeBadge(notice.type)}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] leading-snug text-[#1A2214]">{notice.text}</p>
                  <p className="mt-0.5 text-[8px] text-[#566358]">{notice.time}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mg-day-mgmt-m__panel py-2">
        <div className="mg-day-mgmt-m__quick-scroll -mx-0.5 px-0.5">
          {quickActions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => onOpenModal(action.key)}
              className={cn("mg-day-mgmt-m__quick-btn shrink-0", action.btnClass)}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full",
                  action.iconBg
                )}
              >
                {action.icon}
              </span>
              <span
                className={cn(
                  "text-[8px] font-medium leading-tight text-[#1A2214]",
                  action.labelClass
                )}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
