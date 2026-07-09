"use client";

import type { ReactNode } from "react";
import {
  UserCheck,
  Users,
  Calendar,
  Bell,
  ClipboardList,
  Megaphone,
  Plus,
  Clock,
  ChevronRight,
  QrCode,
  MessageCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardEvent } from "@/app/api/organizer/dashboard/route";
import {
  MOCK_CHECKIN,
  MOCK_STAFF,
  MOCK_SCHEDULE,
  DonutChart,
  staffChip,
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

type Props = {
  event: EventInfo;
  eventId: string;
  dayPhase: EventDayPhase;
  allEvents: DashboardEvent[];
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
  const isPast = dayPhase === "past";
  const isUpcoming = dayPhase === "upcoming";
  const scheduleTitle = emptyMode ? "本日のスケジュール" : isPast ? "スケジュール" : "本日のスケジュール";
  const descText = emptyMode
    ? "イベント当日の受付・進行状況をリアルタイムで確認できます。"
    : isPast
      ? "イベント当日の受付・進行状況を振り返れます。"
      : "イベント当日の受付・進行状況をリアルタイムで確認できます。";

  const checkin = emptyMode ? EMPTY_CHECKIN : MOCK_CHECKIN;
  const staffPresent = emptyMode ? 0 : countStaffPresent(MOCK_STAFF);
  const staffTotal = emptyMode ? 0 : MOCK_STAFF.length;
  const schedDone = emptyMode ? 0 : countScheduleProgress(MOCK_SCHEDULE);
  const schedTotal = emptyMode ? 0 : MOCK_SCHEDULE.length;
  const unreadNotices = emptyMode ? 0 : notices.length;
  const checkinPct = checkin.total > 0 ? Math.round((checkin.checkedIn / checkin.total) * 100) : 0;
  const staffPct = staffTotal > 0 ? Math.round((staffPresent / staffTotal) * 100) : 0;
  const schedPct = schedTotal > 0 ? Math.round((schedDone / schedTotal) * 100) : 0;

  const donutSegments = [
    { color: "#4CAF50", value: checkin.checkedIn },
    { color: "#e0e0e0", value: checkin.notChecked },
    { color: "#ef9a9a", value: checkin.cancelled },
  ];

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
      key: "announce",
      label: "アナウンス送信",
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

      <div className="grid grid-cols-2 gap-1.5">
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

        <section className="mg-day-mgmt-m__panel">
          <PanelHeader
            title="受付状況"
            subtitle={emptyMode ? undefined : "リアルタイムのチェックイン状況"}
          />
          {emptyMode ? (
            <div className="mt-2 flex flex-col items-center py-1.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[5px] border-[#e8e6e0] text-[8px] text-[#566358]">
                —
              </div>
              <p className="mt-1.5 text-center text-[8px] text-[#566358]">受付状況が表示されます</p>
            </div>
          ) : (
            <>
              <div className="mt-1 flex justify-center">
                <div className="relative shrink-0 scale-[0.58] origin-top">
                  <DonutChart segments={donutSegments} total={checkin.total} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[15px] font-bold text-[#1A2214]">{checkin.checkedIn}</span>
                    <span className="text-[7px] text-[#566358]">入場</span>
                  </div>
                </div>
              </div>
              <div className="-mt-1 space-y-0.5 text-[8px]">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4CAF50]" />
                  <span className="text-[#566358]">済</span>
                  <span className="ml-auto font-semibold">{checkin.checkedIn}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e0e0e0]" />
                  <span className="text-[#566358]">未</span>
                  <span className="ml-auto font-semibold">{checkin.notChecked}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ef9a9a]" />
                  <span className="text-[#566358]">取消</span>
                  <span className="ml-auto font-semibold">{checkin.cancelled}</span>
                </div>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => onOpenModal("checkin_list")}
            disabled={emptyMode}
            className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[#DDE8DF] bg-[#F5F8F5] py-1 text-[9px] font-medium text-[#2D7A4F] disabled:opacity-50"
          >
            <ClipboardList size={10} />
            受付リストを見る
            <ChevronRight size={10} />
          </button>
        </section>
      </div>

      <section className="mg-day-mgmt-m__panel">
        <PanelHeader
          title="スタッフステータス"
          actionLabel={emptyMode ? undefined : "すべて見る"}
          onAction={() => onOpenModal("message")}
        />
        {emptyMode ? (
          <div className="mg-day-mgmt-m__staff-scroll mt-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mg-day-mgmt-m__staff-item">
                <div className="h-8 w-8 rounded-full bg-[#e8e6e0]" />
                <span className="text-[8px] text-[#566358]">—</span>
              </div>
            ))}
            <button
              type="button"
              disabled
              className="flex min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-[10px] border border-dashed border-[#DDE8DF] px-2 py-2 opacity-50"
              aria-label="スタッフを追加"
            >
              <Plus size={13} className="text-[#566358]" />
              <span className="text-[8px] text-[#566358]">追加</span>
            </button>
          </div>
        ) : (
          <div className="mg-day-mgmt-m__staff-scroll mt-1.5">
            {MOCK_STAFF.map((staff, i) => (
              <div key={i} className="mg-day-mgmt-m__staff-item">
                <div className="mg-day-mgmt-m__staff-avatar">{staff.name.charAt(0)}</div>
                <p className="max-w-[68px] truncate text-[9px] font-semibold text-[#1A2214]">{staff.name}</p>
                <div className="scale-[0.82]">{staffChip(staff.status)}</div>
              </div>
            ))}
            <button
              type="button"
              className="flex min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-[10px] border border-dashed border-[#DDE8DF] bg-white px-2 py-2"
              aria-label="スタッフを追加"
            >
              <Plus size={13} className="text-[#566358]" />
              <span className="text-[8px] font-medium text-[#566358]">追加</span>
            </button>
          </div>
        )}
      </section>

      <section className="mg-day-mgmt-m__panel">
        <PanelHeader
          title="お知らせ"
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
