"use client";

import { ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJstHm } from "@/lib/organizer/day-ops";
import type { DayOpsStaffMember, DayOpsStaffStatus } from "@/lib/organizer/day-ops-types";

type Props = {
  emptyMode?: boolean;
  loading?: boolean;
  error?: string | null;
  members: DayOpsStaffMember[];
  onRefresh?: () => void;
  onViewAll?: () => void;
};

function statusChip(status: DayOpsStaffStatus) {
  const map: Record<DayOpsStaffStatus, { label: string; className: string }> = {
    on_duty: { label: "出勤中", className: "bg-[#EAF4ED] text-[#2D7A4F]" },
    break: { label: "休憩中", className: "bg-[#FDF6E3] text-[#CF9010]" },
    absent: { label: "未出勤", className: "bg-[#f0f0f0] text-[#566358]" },
    busy: { label: "対応中", className: "bg-[#E3F2FD] text-[#1976D2]" },
  };
  const s = map[status];
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-none", s.className)}>
      {s.label}
    </span>
  );
}

function avatarTone(status: DayOpsStaffStatus) {
  if (status === "break") return "bg-[#FDF6E3] text-[#CF9010]";
  if (status === "busy") return "bg-[#E3F2FD] text-[#1976D2]";
  if (status === "absent") return "bg-[#f0f0f0] text-[#566358]";
  return "bg-[#EAF4ED] text-[#2D7A4F]";
}

export function StaffStatusCard({
  emptyMode = false,
  loading = false,
  error = null,
  members,
  onRefresh,
  onViewAll,
}: Props) {
  return (
    <div className="mg-day-mgmt-pc__panel mg-day-mgmt-pc__panel--compact flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2">
        <h2 className="mg-day-mgmt-pc__panel-title shrink-0">スタッフステータス</h2>
        {onViewAll && !emptyMode ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-[#2D7A4F]"
          >
            スタッフ一覧を見る
            <ChevronRight size={12} />
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#EAF4ED]" />
          ))}
        </div>
      ) : error ? (
        <div className="mg-day-mgmt-pc__empty-inline flex-1">
          <p className="mg-day-mgmt-pc__empty-text">{error}</p>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#2D7A4F]"
            >
              <RefreshCw size={12} />
              再読み込み
            </button>
          ) : null}
        </div>
      ) : emptyMode ? (
        <div className="mt-1.5 flex-1">
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
          <p className="mg-day-mgmt-pc__empty-text mt-1.5">
            イベントを選択すると運営状況が表示されます
          </p>
        </div>
      ) : (
        <div className="mt-2 grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto min-[520px]:grid-cols-3">
          {members.slice(0, 3).map((staff) => (
            <div
              key={staff.id}
              className="flex flex-col rounded-xl border border-[#EAF4ED] bg-[#F8FBF8] px-2.5 py-2.5"
            >
              <div className="flex items-start gap-2">
                {staff.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={staff.avatarUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                      avatarTone(staff.status)
                    )}
                  >
                    {staff.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <p className="truncate text-[12px] font-semibold leading-tight text-[#1A2214]">
                      {staff.name}
                    </p>
                    {statusChip(staff.status)}
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-[#566358]">{staff.role}</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-[#566358]">更新 {formatJstHm(staff.updatedAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
