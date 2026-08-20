// フィルタ・検索ユーティリティ（Event[] に対して適用）
import type { Event } from "./db/types";
import { mockEvents } from "./events-mock";
import { getCreatedEvents } from "./created-events-store";
import { getJstTodayYmd } from "./jst-date";

export type { Event, EventFormData } from "./db/types";

function getAllEvents(): Event[] {
  // 本番環境ではモック/ストアイベントは絶対に公開面に出さない
  if (process.env.NODE_ENV === "production") return [];
  return [...mockEvents, ...getCreatedEvents()];
}

export function getEvents(): Event[] {
  return getAllEvents();
}

export function getEventById(id: string): Event | null {
  return getAllEvents().find((e) => e.id === id) ?? null;
}

export type DateRangeFilter = "all" | "today" | "week" | "weekend" | "month" | "3months";

export function getEventsByDateRange(
  events: Event[],
  range: DateRangeFilter,
  specificDate?: string | null
): Event[] {
  const today = new Date();
  const todayStr = getJstTodayYmd(today);

  if (specificDate) {
    return events.filter((e) => e.date === specificDate);
  }

  if (range === "all") return events;
  if (range === "today") {
    return events.filter((e) => e.date === todayStr);
  }

  if (range === "weekend") {
    return events.filter((e) => {
      if (e.date < todayStr) return false;
      const d = new Date(e.date + "T12:00:00");
      const day = d.getDay();
      return day === 0 || day === 6;
    });
  }

  const getEndDate = (days: number) => {
    const end = new Date(today.getTime());
    end.setDate(end.getDate() + days);
    return getJstTodayYmd(end);
  };

  const endStr =
    range === "week"
      ? getEndDate(7)
      : range === "month"
        ? getEndDate(30)
        : range === "3months"
          ? getEndDate(90)
          : getEndDate(7);

  return events.filter((e) => e.date >= todayStr && e.date <= endStr);
}

export type EventStatus = "available" | "full" | "ended";

export function getEventStatus(e: Event): EventStatus {
  const todayStr = getJstTodayYmd();
  if (e.date < todayStr) return "ended";
  if (e.capacity != null && e.capacity <= 0) return "full";
  return "available";
}

export function filterEventsByAvailableOnly(
  events: Event[],
  availableOnly: boolean
): Event[] {
  if (!availableOnly) return events;
  return events.filter((e) => getEventStatus(e) === "available");
}

export type EventSort = "date_asc" | "date_desc" | "newest";

export function sortEvents(
  events: Event[],
  sort: EventSort
): Event[] {
  const copy = [...events];
  if (sort === "date_asc") {
    return copy.sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || ""));
  }
  if (sort === "date_desc") {
    return copy.sort((a, b) => b.date.localeCompare(a.date) || (b.startTime || "").localeCompare(a.startTime || ""));
  }
  if (sort === "newest") {
    return copy.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
  return copy;
}

/** 直近 N 日以内に終了したイベントの下限日（YYYY-MM-DD） */
function getPastCutoffYmd(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getJstTodayYmd(d);
}

/** JST の曜日（0=日 … 6=土） */
function getJstDayOfWeek(ymd: string): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  }).format(new Date(`${ymd}T12:00:00+09:00`));
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

/** JST カレンダー日を days 加算した YYYY-MM-DD */
function addJstDays(ymd: string, days: number): string {
  const ms = Date.parse(`${ymd}T12:00:00+09:00`) + days * 24 * 60 * 60 * 1000;
  return getJstTodayYmd(new Date(ms));
}

/**
 * 今週末（土・日）の日付範囲。
 * 月〜金 → 次の土日 / 土 → 今日と明日 / 日 → 昨日土〜今日（表示は今日以降で絞る）
 */
export function getThisWeekendYmdBounds(baseDate: Date = new Date()): {
  saturday: string;
  sunday: string;
} {
  const today = getJstTodayYmd(baseDate);
  const day = getJstDayOfWeek(today);
  let daysToSat: number;
  if (day === 6) daysToSat = 0;
  else if (day === 0) daysToSat = -1;
  else daysToSat = 6 - day;
  const saturday = addJstDays(today, daysToSat);
  const sunday = addJstDays(saturday, 1);
  return { saturday, sunday };
}

/**
 * ホーム「今週末のイベント」用。今週末（土日）かつ今日以降の開催を日付昇順で返す。
 */
export function getThisWeekendEvents(events: Event[], limit = 8): Event[] {
  const todayStr = getJstTodayYmd();
  const { saturday, sunday } = getThisWeekendYmdBounds();
  return events
    .filter((e) => getEventStatus(e) !== "ended")
    .filter((e) => e.date >= todayStr && e.date >= saturday && e.date <= sunday)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.startTime || "").localeCompare(b.startTime || "")
    )
    .slice(0, limit);
}

/**
 * ホーム「過去のイベント」用。直近に終了したイベントを日付降順で返す。
 */
export function getPastEvents(
  events: Event[],
  limit = 5,
  pastDays = 180
): Event[] {
  const pastCutoff = getPastCutoffYmd(pastDays);
  return events
    .filter((e) => getEventStatus(e) === "ended")
    .filter((e) => e.date >= pastCutoff)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (b.startTime || "").localeCompare(a.startTime || "")
    )
    .slice(0, limit);
}

export type BackfillEndedOptions = {
  /** この件数未満の開催予定なら終了イベントを補完する */
  minUpcoming?: number;
  /** 補完する終了イベントの最大件数 */
  maxEnded?: number;
  /** 何日以内に終了したイベントを対象にするか */
  pastDays?: number;
};

/**
 * 開催予定が少ないとき、日付フィルタ以外の同一条件で絞った直近の終了イベントを補完する。
 */
export function backfillWithRecentEndedEvents(
  filtered: Event[],
  source: Event[],
  options?: BackfillEndedOptions
): Event[] {
  const minUpcoming = options?.minUpcoming ?? 5;
  const maxEnded = options?.maxEnded ?? 10;
  const pastDays = options?.pastDays ?? 365;

  const todayStr = getJstTodayYmd();
  const pastCutoff = getPastCutoffYmd(pastDays);
  const upcoming = filtered.filter((e) => getEventStatus(e) !== "ended");
  if (upcoming.length >= minUpcoming) return filtered;

  const existingIds = new Set(filtered.map((e) => e.id));
  const endedBackfill = source
    .filter((e) => getEventStatus(e) === "ended")
    .filter((e) => e.date >= pastCutoff && e.date < todayStr)
    .filter((e) => !existingIds.has(e.id))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (b.startTime || "").localeCompare(a.startTime || "")
    )
    .slice(0, maxEnded);

  return [...filtered, ...endedBackfill];
}

/** 一覧向け: 開催予定を先に（日付昇順）、終了を後に（日付降順） */
export function sortEventsForDiscover(events: Event[]): Event[] {
  const upcoming = events.filter((e) => getEventStatus(e) !== "ended");
  const ended = events.filter((e) => getEventStatus(e) === "ended");
  return [
    ...sortEvents(upcoming, "date_asc"),
    ...sortEvents(ended, "date_desc"),
  ];
}

export function filterEventsByPrice(
  events: Event[],
  filter: "all" | "free" | "paid"
): Event[] {
  if (filter === "all") return events;
  if (filter === "free") return events.filter((e) => e.price === 0);
  return events.filter((e) => e.price > 0);
}

export function filterEventsByChildFriendly(
  events: Event[],
  childFriendly: boolean
): Event[] {
  if (!childFriendly) return events;
  return events.filter((e) => e.childFriendly);
}

export function searchEvents(events: Event[], query: string): Event[] {
  if (!query.trim()) return events;
  const q = query.toLowerCase();
  return events.filter((e) => {
    const fields = [
      e.title,
      e.description,
      e.organizerName,
      e.location,
      e.prefecture,
      e.city,
    ];
    return fields.some((f) => f?.toLowerCase().includes(q));
  });
}

export function filterEventsByRegion(
  events: Event[],
  prefecture?: string,
  city?: string
): Event[] {
  let result = events;
  if (prefecture?.trim()) {
    result = result.filter((e) => e.prefecture === prefecture);
  }
  if (city?.trim()) {
    result = result.filter((e) => e.city === city);
  }
  return result;
}

export function filterEventsByTags(
  events: Event[],
  tags: string[]
): Event[] {
  if (!tags.length) return events;
  return events.filter((e) => {
    const eventTags = e.tags ?? [];
    return tags.every((t) => eventTags.includes(t));
  });
}

export type RankingType = "newest" | "popular" | "satisfaction";

/**
 * おすすめイベント（最大3件）
 * 優先順位: 1) 開催中（今日） 2) 近日（startが近い） 3) isFeatured（あれば）
 */
export function getRecommendedEvents(events: Event[], limit = 3): Event[] {
  const todayStr = getJstTodayYmd();
  const futureOrToday = events.filter((e) => e.date >= todayStr);
  const copy = [...futureOrToday];
  copy.sort((a, b) => {
    const aToday = a.date === todayStr ? 1 : 0;
    const bToday = b.date === todayStr ? 1 : 0;
    if (aToday !== bToday) return bToday - aToday;
    return a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || "");
  });
  return copy.slice(0, limit);
}

export function getRankedEvents(
  events: Event[],
  type: RankingType,
  limit = 10
): Event[] {
  const todayStr = getJstTodayYmd();
  const futureOrToday = events.filter((e) => e.date >= todayStr);
  const copy = [...futureOrToday];

  if (type === "newest") {
    copy.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } else if (type === "popular") {
    copy.sort((a, b) => (b.participantCount ?? 0) - (a.participantCount ?? 0));
  } else {
    copy.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  }

  return copy.slice(0, limit);
}

// 2点間の距離（km）概算（Haversine 簡易版）
export function calcDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
