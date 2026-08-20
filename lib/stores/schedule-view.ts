/**
 * 出店スケジュールの表示用ヘルパ
 */
import {
  STORE_SCHEDULE_STATUS_LABEL,
  formatStoreDateJa,
  type StoreScheduleRecord,
} from "@/lib/stores/types";

export function todayIsoDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** 公開ページに出すステータス（中止は出さない） */
export function isPublicScheduleStatus(
  status: StoreScheduleRecord["status"],
): boolean {
  return status === "scheduled" || status === "adjusting";
}

export function formatScheduleTimeRange(
  start: string | null,
  end: string | null,
): string | null {
  if (!start && !end) return null;
  if (start && end) return `${start}～${end}`;
  return start || end;
}

export function formatSchedulePlace(item: StoreScheduleRecord): string {
  const parts = [item.eventName];
  if (item.location?.trim()) parts.push(item.location.trim());
  if (item.stallArea?.trim()) parts.push(item.stallArea.trim());
  return parts.join(" / ");
}

/** 場所表示（イベント名なし。地図・サイド用） */
export function formatScheduleLocationOnly(item: StoreScheduleRecord): string {
  const parts = [
    item.location?.trim(),
    item.stallArea?.trim(),
  ].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(" ");
  return item.eventName;
}

/** 今日以降（日付昇順）。公開向けは中止を除外 */
export function listUpcomingSchedules(
  schedules: StoreScheduleRecord[],
  options?: { includeCancelled?: boolean; limit?: number; today?: string },
): StoreScheduleRecord[] {
  const today = options?.today ?? todayIsoDate();

  let list = schedules
    .filter((s) => s.eventDate >= today)
    .slice()
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  if (!options?.includeCancelled) {
    list = list.filter((s) => isPublicScheduleStatus(s.status));
  }

  if (options?.limit != null) {
    list = list.slice(0, options.limit);
  }
  return list;
}

/** 本日の公開出店（なければ null） */
export function findTodaySchedule(
  schedules: StoreScheduleRecord[],
  today = todayIsoDate(),
): StoreScheduleRecord | null {
  return (
    schedules.find(
      (s) => s.eventDate === today && isPublicScheduleStatus(s.status),
    ) ?? null
  );
}

export type KitchenPublicStatus = {
  badge: string;
  /** ヒーロー横の時間表示 */
  hoursText: string | null;
  tone: "open" | "upcoming" | "closed";
};

export function resolveKitchenPublicStatus(opts: {
  storeStatus: "draft" | "public" | "private";
  hoursLabel: string | null;
  todaySchedule: StoreScheduleRecord | null;
  nextSchedule: StoreScheduleRecord | null;
}): KitchenPublicStatus {
  if (opts.storeStatus !== "public") {
    return {
      badge: opts.storeStatus === "draft" ? "下書き" : "非公開",
      hoursText: opts.hoursLabel,
      tone: "closed",
    };
  }
  if (opts.todaySchedule) {
    return {
      badge: "本日出店中",
      hoursText:
        formatScheduleTimeRange(
          opts.todaySchedule.startTime,
          opts.todaySchedule.endTime,
        ) ?? opts.hoursLabel,
      tone: "open",
    };
  }
  if (opts.nextSchedule) {
    return {
      badge: "近日出店予定",
      hoursText:
        formatScheduleTimeRange(
          opts.nextSchedule.startTime,
          opts.nextSchedule.endTime,
        ) ?? opts.hoursLabel,
      tone: "upcoming",
    };
  }
  return {
    badge: "出店予定なし",
    hoursText: opts.hoursLabel,
    tone: "closed",
  };
}

export function scheduleStatusLabel(
  status: StoreScheduleRecord["status"],
): string {
  return STORE_SCHEDULE_STATUS_LABEL[status];
}

export function scheduleDateLabel(eventDate: string): string {
  return formatStoreDateJa(eventDate);
}

/** 出店リスト用の短い日付（例: 8/8（土）） */
export function scheduleDateShortLabel(eventDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate);
  if (!m) return formatStoreDateJa(eventDate);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (Number.isNaN(date.getTime())) return formatStoreDateJa(eventDate);
  const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()] ?? "";
  return `${mo}/${d}（${week}）`;
}
