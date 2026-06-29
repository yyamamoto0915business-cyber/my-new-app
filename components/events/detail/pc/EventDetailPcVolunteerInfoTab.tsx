"use client";

import {
  CalendarDays,
  MapPin,
  Users,
  ClipboardList,
  Package,
  FileText,
} from "lucide-react";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import type { Event } from "@/lib/db/types";
import {
  useEventVolunteerRecruitment,
  type EventVolunteerRecruitment,
} from "@/hooks/use-event-volunteer-recruitment";

type Props = {
  eventId: string;
  event: Event;
  recruitment?: EventVolunteerRecruitment | null;
};

function formatPeriod(start: string | null, end: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });
  if (start && end) return `${fmt(start)} 〜 ${fmt(end)}`;
  if (start) return `${fmt(start)} 〜`;
  return "随時";
}

function formatRoles(roles: { name: string; count: number }[], capacity: number | null) {
  if (roles.length > 0) {
    const total = roles.reduce((s, r) => s + r.count, 0);
    const names = roles.map((r) => r.name).join("・");
    return `${total}名（${names}）`;
  }
  if (capacity != null) return `${capacity}名`;
  return "未定";
}

const rowClass =
  "flex gap-3 border-b border-[#eef2ea] py-3.5 last:border-b-0";
const iconClass = "mt-0.5 h-[17px] w-[17px] shrink-0 stroke-[2] text-[#348b38]";
const labelClass = "min-w-[88px] shrink-0 text-[12px] font-medium text-[#8a9e80]";
const valueClass = "text-[13.5px] leading-[1.6] text-[#2c3c2a]";

export function EventDetailPcVolunteerInfoTab({
  eventId,
  event,
  recruitment: recruitmentProp,
}: Props) {
  const fetched = useEventVolunteerRecruitment(eventId);
  const recruitment = recruitmentProp !== undefined ? recruitmentProp : fetched.recruitment;
  const loading = recruitmentProp !== undefined ? false : fetched.loading;

  const dateLine = formatEventScheduleLabel(
    event.date,
    event.startTime,
    event.endTime,
    event.recurrence ?? "none",
    event.recurrenceCount
  );

  const rows = [
    {
      icon: CalendarDays,
      label: "募集期間",
      value: recruitment
        ? formatPeriod(recruitment.start_at, recruitment.end_at)
        : "随時",
    },
    {
      icon: CalendarDays,
      label: "活動日時",
      value: dateLine,
    },
    {
      icon: MapPin,
      label: "活動場所",
      value: recruitment?.meeting_place ?? event.location,
    },
    {
      icon: Users,
      label: "募集人数",
      value: recruitment
        ? formatRoles(recruitment.roles ?? [], recruitment.capacity)
        : "3〜4名",
    },
    {
      icon: ClipboardList,
      label: "主な活動内容",
      value:
        recruitment?.description ??
        "受付・会場設営・片付けなど、イベント運営のサポートをお願いします。",
    },
    {
      icon: FileText,
      label: "応募条件",
      value: recruitment?.provisions ?? "特になし（初めての方も歓迎）",
    },
    {
      icon: Package,
      label: "持ち物",
      value:
        recruitment?.items_to_bring ??
        (event.itemsToBring?.length
          ? event.itemsToBring.join("、")
          : "動きやすい服装、飲み物"),
    },
    {
      icon: FileText,
      label: "備考",
      value: recruitment?.notes ?? event.registrationNote ?? "—",
    },
  ] as const;

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e8edd8] bg-white p-6 text-[13px] text-[#8a9e80]">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e8edd8] bg-white px-5 py-1">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className={rowClass}>
          <Icon className={iconClass} aria-hidden />
          <span className={labelClass}>{label}</span>
          <p className={valueClass}>{value}</p>
        </div>
      ))}
    </div>
  );
}
