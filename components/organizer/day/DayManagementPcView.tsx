"use client";

import type { ReactNode } from "react";
import {
  UserCheck,
  Users,
  Calendar,
  Bell,
  ChevronRight,
  Clock,
  Plus,
  QrCode,
  Megaphone,
  MessageCircle,
  AlertTriangle,
  FileText,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardEvent } from "@/app/api/organizer/dashboard/route";
import {
  MOCK_CHECKIN,
  MOCK_STAFF,
  MOCK_SCHEDULE,
  MOCK_NOTICES,
  DonutChart,
  staffChip,
  scheduleChip,
  noticeBadge,
  countStaffPresent,
  countScheduleProgress,
  EMPTY_CHECKIN,
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
    <div className={cn("mt-2 h-1.5 w-full overflow-hidden rounded-full", track)}>
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
  onOpenModal,
}: Props) {
  const isPast = dayPhase === "past";
  const isLive = dayPhase === "live";
  const showHero = emptyMode || !isPast;
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
  const unreadNotices = emptyMode ? 0 : MOCK_NOTICES.length;
  const checkinPct = checkin.total > 0 ? Math.round((checkin.checkedIn / checkin.total) * 100) : 0;
  const staffPct = staffTotal > 0 ? Math.round((staffPresent / staffTotal) * 100) : 0;

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
    cardClass?: string;
  }[] = [
    {
      key: "qr",
      label: "受付QRコード表示",
      icon: <QrCode size={18} className="text-[#2D7A4F]" />,
      iconBg: "bg-[#EAF4ED]",
    },
    {
      key: "announce",
      label: "アナウンス送信",
      icon: <Megaphone size={18} className="text-[#2D7A4F]" />,
      iconBg: "bg-[#EAF4ED]",
    },
    {
      key: "message",
      label: "来場者にメッセージ",
      icon: <MessageCircle size={18} className="text-[#1976D2]" />,
      iconBg: "bg-[#E3F2FD]",
    },
    {
      key: "emergency",
      label: "緊急連絡",
      icon: <AlertTriangle size={18} className="text-[#E53935]" />,
      iconBg: "bg-[#FFCDD2]",
      cardClass: "border-[#FFCDD2] bg-[#FFEBEE] hover:border-[#E53935] hover:bg-[#FFCDD2]",
    },
    {
      key: "memo",
      label: "記録・メモ",
      icon: <FileText size={18} className="text-[#CF9010]" />,
      iconBg: "bg-[#FDF6E3]",
    },
  ];

  return (
    <div className={cn("mg-day-mgmt-pc", emptyMode ? "mg-day-mgmt-pc--compact" : "mg-day-mgmt-pc--selected")}>
      {showHero ? (
        <section
          className={cn(
            "mg-day-mgmt-pc__hero",
            emptyMode ? "mg-day-mgmt-pc__hero--compact" : "mg-day-mgmt-pc__hero--selected"
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mg-day-mgmt-pc__title">ダッシュボード</h1>
            <span className="rounded-full bg-[#EAF4ED] px-2.5 py-0.5 text-[10px] font-bold text-[#2D7A4F]">
              本日の運営
            </span>
            {emptyMode ? (
              <span className="rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-bold text-[#566358]">
                本日の開催なし
              </span>
            ) : null}
          </div>
          {emptyMode ? <p className="mg-day-mgmt-pc__desc mt-1.5">{descText}</p> : null}
        </section>
      ) : null}

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
        className={showHero ? "mt-2" : undefined}
      />

      {/* KPI */}
      <div className="mg-day-mgmt-pc__kpi-grid grid grid-cols-4 gap-3">
        <div className="mg-day-mgmt-pc__kpi">
          <div className="flex items-center gap-2">
            <span className="mg-day-mgmt-pc__kpi-icon mg-day-mgmt-pc__kpi-icon--green">
              <UserCheck size={15} className="text-[#2D7A4F]" />
            </span>
            <span className="mg-day-mgmt-pc__kpi-label">来場者チェックイン</span>
          </div>
          <p className="mg-day-mgmt-pc__kpi-value mt-1.5">
            {checkin.checkedIn}
            <span className="mg-day-mgmt-pc__kpi-unit">/ {checkin.total}人</span>
          </p>
          <KpiProgressBar pct={checkinPct} tone="green" />
          {!emptyMode ? (
            <p className="mt-0.5 text-right text-[10px] text-[#566358]">{checkinPct}%</p>
          ) : null}
        </div>

        <div className="mg-day-mgmt-pc__kpi">
          <div className="flex items-center gap-2">
            <span className="mg-day-mgmt-pc__kpi-icon mg-day-mgmt-pc__kpi-icon--blue">
              <Users size={15} className="text-[#1976D2]" />
            </span>
            <span className="mg-day-mgmt-pc__kpi-label">スタッフ出勤</span>
          </div>
          <p className="mg-day-mgmt-pc__kpi-value mt-1.5">
            {staffPresent}
            <span className="mg-day-mgmt-pc__kpi-unit">/ {staffTotal}名</span>
          </p>
          <KpiProgressBar pct={staffPct} tone="blue" />
          {!emptyMode ? (
            <p className="mt-0.5 text-right text-[10px] text-[#566358]">{staffPct}%</p>
          ) : null}
        </div>

        <div className="mg-day-mgmt-pc__kpi">
          <div className="flex items-center gap-2">
            <span className="mg-day-mgmt-pc__kpi-icon mg-day-mgmt-pc__kpi-icon--amber">
              <Clock size={15} className="text-[#CF9010]" />
            </span>
            <span className="mg-day-mgmt-pc__kpi-label">プログラム進行</span>
          </div>
          <p className="mg-day-mgmt-pc__kpi-value mt-1.5">
            {schedDone}
            <span className="mg-day-mgmt-pc__kpi-unit">/ {schedTotal}</span>
          </p>
          <div className="mt-2 flex justify-end">
            {!emptyMode ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isPast
                  ? "bg-[#f0f0f0] text-[#566358]"
                  : isLive
                    ? "bg-[#EAF4ED] text-[#2D7A4F]"
                    : "bg-[#E3F2FD] text-[#1976D2]"
              }`}
            >
              {isPast ? "終了" : isLive ? "進行中" : "開催前"}
            </span>
            ) : (
              <span className="rounded-full bg-[#f0f0f0] px-2.5 py-0.5 text-[11px] font-semibold text-[#566358]">
                —
              </span>
            )}
          </div>
        </div>

        <div className="mg-day-mgmt-pc__kpi">
          <div className="flex items-center gap-2">
            <span className="mg-day-mgmt-pc__kpi-icon mg-day-mgmt-pc__kpi-icon--danger">
              <Bell size={15} className="text-[#E53935]" />
            </span>
            <span className="mg-day-mgmt-pc__kpi-label">お知らせ未読</span>
          </div>
          <p className="mg-day-mgmt-pc__kpi-value mt-1.5">
            {unreadNotices}
            <span className="mg-day-mgmt-pc__kpi-unit">件</span>
          </p>
          <p className="mt-2 text-[10px] leading-snug text-[#566358]">
            {emptyMode
              ? "未読はありません"
              : isPast
                ? "当日のお知らせ履歴"
                : "未読のお知らせがあります"}
          </p>
        </div>
      </div>

      <div className="mg-day-mgmt-pc__sections">
        {/* Reception + Schedule */}
        <div className="grid grid-cols-2 gap-3">
          <div className="mg-day-mgmt-pc__panel mg-day-mgmt-pc__panel--compact">
            <h2 className="mg-day-mgmt-pc__panel-title">受付状況</h2>
            {emptyMode ? (
              <div className="mg-day-mgmt-pc__empty-inline">
                <div className="mg-day-mgmt-pc__empty-ring">—</div>
                <p className="mg-day-mgmt-pc__empty-text">イベントを選択すると受付状況が表示されます</p>
              </div>
            ) : (
            <div className="mt-3 flex items-center gap-6">
              <div className="relative shrink-0">
                <DonutChart segments={donutSegments} total={checkin.total} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold text-[#1A2214]">{checkin.checkedIn}</span>
                  <span className="text-[10px] text-[#566358]">入場</span>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3 text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#4CAF50]" />
                  <span className="text-[#566358]">チェックイン済</span>
                  <span className="ml-auto font-semibold text-[#1A2214]">{checkin.checkedIn}人</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#e0e0e0]" />
                  <span className="text-[#566358]">未チェックイン</span>
                  <span className="ml-auto font-semibold text-[#1A2214]">{checkin.notChecked}人</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#ef9a9a]" />
                  <span className="text-[#566358]">キャンセル</span>
                  <span className="ml-auto font-semibold text-[#1A2214]">{checkin.cancelled}人</span>
                </div>
              </div>
            </div>
            )}
            <button
              type="button"
              onClick={() => onOpenModal("qr")}
              disabled={emptyMode}
              className="mg-day-mgmt-pc__btn-list mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              受付リストを開く
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mg-day-mgmt-pc__panel mg-day-mgmt-pc__panel--compact">
            <h2 className="mg-day-mgmt-pc__panel-title">{scheduleTitle}</h2>
            {emptyMode ? (
              <div className="mg-day-mgmt-pc__empty-inline">
                <Calendar size={22} className="shrink-0 text-[#DDE8DF]" aria-hidden />
                <p className="mg-day-mgmt-pc__empty-text">
                  開催予定のイベントを選択すると、スケジュールがここに表示されます。
                </p>
              </div>
            ) : (
            <ul className="mt-3 space-y-1.5">
              {MOCK_SCHEDULE.map((item, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3",
                    item.status === "live"
                      ? "border-l-[3px] border-[#2D7A4F] bg-[#EAF4ED]"
                      : "border-l-[3px] border-transparent bg-[#F5F8F5]"
                  )}
                >
                  <Clock
                    size={13}
                    className={cn(
                      "shrink-0",
                      item.status === "live" ? "text-[#2D7A4F]" : "text-[#566358]"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-[#566358]">{item.time}</span>
                    <p
                      className={cn(
                        "truncate text-[13px] font-medium leading-snug",
                        item.status === "live" ? "text-[#2D7A4F]" : "text-[#1A2214]"
                      )}
                    >
                      {item.name}
                    </p>
                  </div>
                  {scheduleChip(item.status)}
                </li>
              ))}
            </ul>
            )}
          </div>
        </div>

        {/* Staff + Notices */}
        <div className="grid grid-cols-2 gap-3">
          <div className="mg-day-mgmt-pc__panel mg-day-mgmt-pc__panel--compact">
            <h2 className="mg-day-mgmt-pc__panel-title">スタッフステータス</h2>
            {emptyMode ? (
              <div className="mt-2">
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[#DDE8DF] bg-[#F5F8F5]"
                    >
                      <div className="h-7 w-7 rounded-full bg-[#e8e6e0]" />
                    </div>
                  ))}
                </div>
                <p className="mg-day-mgmt-pc__empty-text mt-2">
                  イベントを選択するとスタッフが表示されます。
                </p>
              </div>
            ) : (
            <div className="mg-day-mgmt-pc__staff-row mt-3">
              {MOCK_STAFF.map((staff, i) => (
                <div key={i} className="mg-day-mgmt-pc__staff-card">
                  <div className="mg-day-mgmt-pc__staff-avatar">{staff.name.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-[#1A2214]">{staff.name}</p>
                    <p className="text-[10px] text-[#566358]">{staff.role}</p>
                  </div>
                  {staffChip(staff.status)}
                </div>
              ))}
              <button
                type="button"
                className="mg-day-mgmt-pc__staff-add"
                aria-label="スタッフを追加"
              >
                <Plus size={16} />
                <span>スタッフ追加</span>
              </button>
            </div>
            )}
          </div>

          <div className="mg-day-mgmt-pc__panel mg-day-mgmt-pc__panel--compact">
            <h2 className="mg-day-mgmt-pc__panel-title">お知らせ</h2>
            {emptyMode ? (
              <div className="mg-day-mgmt-pc__empty-inline">
                <Inbox size={22} className="shrink-0 text-[#DDE8DF]" aria-hidden />
                <p className="mg-day-mgmt-pc__empty-text">
                  お知らせはまだありません。配信するとここに表示されます。
                </p>
              </div>
            ) : (
            <ul className="mt-3 space-y-2">
              {MOCK_NOTICES.map((notice, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl p-3",
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
          </div>
        </div>

        {/* Quick actions */}
        <div className="mg-day-mgmt-pc__quick-actions">
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
                  "text-[12px] font-medium leading-tight",
                  action.key === "emergency" ? "text-[#E53935]" : "text-[#1A2214]"
                )}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
