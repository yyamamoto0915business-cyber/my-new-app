"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DashboardStaffMember,
  StaffLifecycleStatus,
} from "@/lib/organizer/day-ops-types";
import type { EventDayPhase } from "./day-management-shared";

export type StaffCardViewMode = "applications" | "day_staff";

type Props = {
  emptyMode?: boolean;
  dayPhase: EventDayPhase;
  members: DashboardStaffMember[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** PC / モバイルで外枠クラスを切替 */
  variant?: "pc" | "mobile";
};

const APPLICATION_STATUSES: StaffLifecycleStatus[] = [
  "applied",
  "pending_review",
  "approved",
  "confirmed",
  "rejected",
];

const DAY_STATUSES: StaffLifecycleStatus[] = [
  "scheduled",
  "checked_in",
  "on_duty",
  "on_break",
  "absent",
  "finished",
];

const PRE_EVENT_DAY_STATUSES: StaffLifecycleStatus[] = [
  "approved",
  "confirmed",
  "scheduled",
];

function initialViewMode(dayPhase: EventDayPhase): StaffCardViewMode {
  return dayPhase === "live" ? "day_staff" : "applications";
}

function applicationStatusLabel(status: StaffLifecycleStatus): string {
  if (status === "pending_review" || status === "applied") return "審査待ち";
  if (status === "approved" || status === "confirmed") return "承認済み";
  if (status === "rejected") return "見送り";
  return "応募中";
}

function applicationBadgeClass(status: StaffLifecycleStatus): string {
  if (status === "pending_review" || status === "applied") {
    return "mg-staff-status__badge--pending";
  }
  if (status === "approved" || status === "confirmed") {
    return "mg-staff-status__badge--approved";
  }
  return "mg-staff-status__badge--rejected";
}

function dayStatusLabel(status: StaffLifecycleStatus): string {
  switch (status) {
    case "scheduled":
    case "approved":
    case "confirmed":
      return "出勤予定";
    case "checked_in":
      return "チェックイン済み";
    case "absent":
      return "未到着";
    case "on_duty":
      return "活動中";
    case "on_break":
      return "休憩中";
    case "finished":
      return "活動終了";
    default:
      return "出勤予定";
  }
}

function dayBadgeClass(status: StaffLifecycleStatus): string {
  switch (status) {
    case "checked_in":
      return "mg-staff-status__badge--checked-in";
    case "absent":
      return "mg-staff-status__badge--absent";
    case "on_duty":
      return "mg-staff-status__badge--on-duty";
    case "on_break":
      return "mg-staff-status__badge--on-break";
    default:
      return "mg-staff-status__badge--scheduled";
  }
}

function displayRole(member: DashboardStaffMember, mode: StaffCardViewMode): string {
  if (mode === "day_staff") {
    return member.role.replace(/スタッフ$/, "担当");
  }
  return member.role;
}

function StaffDetailSheet({
  member,
  mode,
  onClose,
}: {
  member: DashboardStaffMember;
  mode: StaffCardViewMode;
  onClose: () => void;
}) {
  const statusLabel =
    mode === "applications"
      ? applicationStatusLabel(member.status)
      : dayStatusLabel(member.status);
  const badgeClass =
    mode === "applications"
      ? applicationBadgeClass(member.status)
      : dayBadgeClass(member.status);
  const meta =
    mode === "applications" ? member.appliedAtLabel : member.detailLabel;

  return (
    <div className="mg-staff-status__detail" role="dialog" aria-modal="true" aria-label="スタッフ詳細">
      <div className="mg-staff-status__detail-backdrop" onClick={onClose} />
      <div className="mg-staff-status__detail-panel">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="mg-staff-status__avatar mg-staff-status__avatar--lg">
                {member.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#1A2214]">{member.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-[#566358]">
                {displayRole(member, mode)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#DDE8DF] text-[#566358] hover:bg-[#F5F8F5]"
            aria-label="閉じる"
          >
            <X size={14} />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={cn("mg-staff-status__badge", badgeClass)}>
            {statusLabel}
          </span>
          {meta ? <span className="text-[11px] text-[#566358]">{meta}</span> : null}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[#566358]">
          {mode === "applications"
            ? "応募内容の確認・承認はスタッフ募集の応募者管理から行えます。"
            : "当日の担当・連絡はスタッフ一覧から確認できます。"}
        </p>
        <Link
          href="/organizer/recruitments"
          className="mt-3 inline-flex items-center gap-0.5 text-[11px] font-medium text-[#2D7A4F] hover:underline"
          onClick={onClose}
        >
          {mode === "applications" ? "応募者管理を開く" : "スタッフ一覧を開く"}
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}

export function StaffStatusCard({
  emptyMode = false,
  dayPhase,
  members,
  loading = false,
  error = null,
  onRetry,
  variant = "pc",
}: Props) {
  const isMobile = variant === "mobile";
  const [viewMode, setViewMode] = useState<StaffCardViewMode>(() =>
    initialViewMode(dayPhase)
  );
  const [animKey, setAnimKey] = useState(0);
  const [selected, setSelected] = useState<DashboardStaffMember | null>(null);

  useEffect(() => {
    setViewMode(initialViewMode(dayPhase));
    setSelected(null);
  }, [dayPhase]);

  const isApplications = viewMode === "applications";
  const showDayHint = isApplications === false && dayPhase === "upcoming";

  const applicationCounts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const m of members) {
      if (m.status === "pending_review" || m.status === "applied") pending += 1;
      else if (m.status === "approved" || m.status === "confirmed") approved += 1;
      else if (m.status === "rejected") rejected += 1;
      else if (
        m.status === "scheduled" ||
        m.status === "checked_in" ||
        m.status === "on_duty" ||
        m.status === "on_break" ||
        m.status === "absent" ||
        m.status === "finished"
      ) {
        approved += 1;
      }
    }
    return { pending, approved, rejected };
  }, [members]);

  const dayCounts = useMemo(() => {
    let scheduled = 0;
    let checkedIn = 0;
    let absent = 0;
    let onDuty = 0;
    let onBreak = 0;
    for (const m of members) {
      if (
        m.status === "scheduled" ||
        m.status === "approved" ||
        m.status === "confirmed"
      ) {
        scheduled += 1;
      } else if (m.status === "checked_in") checkedIn += 1;
      else if (m.status === "absent") absent += 1;
      else if (m.status === "on_duty") onDuty += 1;
      else if (m.status === "on_break") onBreak += 1;
    }
    return { scheduled, checkedIn, absent, onDuty, onBreak };
  }, [members]);

  const listMembers = useMemo(() => {
    if (isApplications) {
      const pending = members.filter(
        (m) => m.status === "pending_review" || m.status === "applied"
      );
      const rest = members.filter(
        (m) =>
          APPLICATION_STATUSES.includes(m.status) &&
          m.status !== "pending_review" &&
          m.status !== "applied"
      );
      return [...pending, ...rest].slice(0, 3);
    }

    const allowed =
      dayPhase === "upcoming" ? PRE_EVENT_DAY_STATUSES : DAY_STATUSES;
    const dayList = members.filter((m) => allowed.includes(m.status));
    if (dayList.length > 0) return dayList.slice(0, 4);

    return members
      .filter((m) => PRE_EVENT_DAY_STATUSES.includes(m.status) || DAY_STATUSES.includes(m.status))
      .slice(0, 4);
  }, [isApplications, members, dayPhase]);

  const toggleView = () => {
    setViewMode((prev) => (prev === "applications" ? "day_staff" : "applications"));
    setAnimKey((k) => k + 1);
    setSelected(null);
  };

  const toggleLabel = isApplications
    ? "当日スタッフ状況に切り替える"
    : "ボランティア応募状況に戻す";

  const rootClass = cn(
    "mg-staff-status",
    isMobile
      ? "mg-day-mgmt-m__panel mg-staff-status--mobile"
      : "mg-day-mgmt-pc__panel mg-day-mgmt-pc__panel--compact mg-staff-status--pc",
    emptyMode ? "mg-staff-status--empty" : "mg-staff-status--filled",
    "flex flex-col",
    !emptyMode && "min-h-0"
  );

  const titleClass = isMobile
    ? "mg-day-mgmt-m__panel-title"
    : "mg-day-mgmt-pc__panel-title";

  if (emptyMode) {
    return (
      <div className={rootClass}>
        <h2 className={cn(titleClass, "shrink-0")}>スタッフステータス</h2>
        <div className="mt-1.5">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-[#DDE8DF] bg-[#F5F8F5]"
              >
                <div className="h-6 w-6 rounded-full bg-[#e8e6e0]" />
              </div>
            ))}
          </div>
          <p
            className={cn(
              isMobile ? "mt-1.5 text-[9px] text-[#566358]" : "mg-day-mgmt-pc__empty-text mt-1.5"
            )}
          >
            イベントを選択するとスタッフが表示されます。
          </p>
        </div>
      </div>
    );
  }

  if (loading && members.length === 0) {
    return (
      <div className={rootClass}>
        <h2 className={cn(titleClass, "shrink-0")}>スタッフステータス</h2>
        <div className="mt-2 grid gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-[#EAF4ED]" />
          ))}
        </div>
      </div>
    );
  }

  if (error && members.length === 0) {
    return (
      <div className={rootClass}>
        <h2 className={cn(titleClass, "shrink-0")}>スタッフステータス</h2>
        <p className="mt-2 text-[11px] text-[#566358]">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-[11px] font-medium text-[#2D7A4F] hover:underline"
          >
            再読み込み
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className={titleClass}>
          {isApplications ? "ボランティア応募状況" : "当日スタッフ状況"}
        </h2>
        <button
          type="button"
          onClick={toggleView}
          className="mg-staff-status__toggle"
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          <ArrowLeftRight size={isMobile ? 13 : 14} aria-hidden />
        </button>
      </div>

      <div key={animKey} className="mg-staff-status__body">
        {isApplications ? (
          <div className="mg-staff-status__summary">
            <span className="mg-staff-status__pill mg-staff-status__pill--pending">
              審査待ち {applicationCounts.pending}名
            </span>
            <span className="mg-staff-status__pill mg-staff-status__pill--approved">
              承認済み {applicationCounts.approved}名
            </span>
            <span className="mg-staff-status__pill mg-staff-status__pill--rejected">
              見送り {applicationCounts.rejected}名
            </span>
          </div>
        ) : (
          <div className="mg-staff-status__summary">
            <span className="mg-staff-status__pill mg-staff-status__pill--scheduled">
              出勤予定 {dayCounts.scheduled}名
            </span>
            <span className="mg-staff-status__pill mg-staff-status__pill--checked-in">
              チェックイン済み {dayCounts.checkedIn}名
            </span>
            <span className="mg-staff-status__pill mg-staff-status__pill--absent">
              未到着 {dayCounts.absent}名
            </span>
            <span className="mg-staff-status__pill mg-staff-status__pill--on-duty">
              活動中 {dayCounts.onDuty}名
            </span>
            <span className="mg-staff-status__pill mg-staff-status__pill--on-break">
              休憩中 {dayCounts.onBreak}名
            </span>
          </div>
        )}

        {showDayHint ? (
          <p className="mg-staff-status__hint">当日管理は開催日に利用できます</p>
        ) : null}

        {listMembers.length === 0 ? (
          <p className="mg-staff-status__hint mt-2">
            {isApplications
              ? "応募者はまだいません。"
              : "出勤予定のスタッフはまだいません。"}
          </p>
        ) : (
          <ul className="mg-staff-status__list">
            {listMembers.map((member) => {
              const statusLabel = isApplications
                ? applicationStatusLabel(member.status)
                : dayStatusLabel(member.status);
              const badgeClass = isApplications
                ? applicationBadgeClass(member.status)
                : dayBadgeClass(member.status);
              const meta = isApplications ? member.appliedAtLabel : member.detailLabel;

              return (
                <li key={member.id}>
                  <button
                    type="button"
                    className="mg-staff-status__row"
                    onClick={() => setSelected(member)}
                  >
                    {member.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.avatarUrl}
                        alt=""
                        className="mg-staff-status__avatar-img"
                      />
                    ) : (
                      <div className="mg-staff-status__avatar">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div className="mg-staff-status__row-main">
                      <div className="mg-staff-status__row-top">
                        <span className="mg-staff-status__name">{member.name}</span>
                        <span className={cn("mg-staff-status__badge", badgeClass)}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="mg-staff-status__row-meta">
                        <span className="truncate">{displayRole(member, viewMode)}</span>
                        {meta ? (
                          <>
                            <span className="mg-staff-status__dot" aria-hidden>
                              ·
                            </span>
                            <span className="shrink-0">{meta}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-[#B8C4BA]"
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mg-staff-status__footer">
          <Link href="/organizer/recruitments" className="mg-staff-status__footer-link">
            {isApplications ? "応募者一覧を見る" : "スタッフ一覧を見る"}
            <span aria-hidden> →</span>
          </Link>
        </div>
      </div>

      {selected ? (
        <StaffDetailSheet
          member={selected}
          mode={viewMode}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
