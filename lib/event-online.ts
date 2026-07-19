import { toJstTimestamp } from "@/lib/jst-date";

export type EventFormat = "onsite" | "online" | "hybrid";

export type OnlineService =
  | "zoom"
  | "google_meet"
  | "microsoft_teams"
  | "youtube_live"
  | "other";

export type OnlineLinkDisplayTiming =
  | "immediately"
  | "60_minutes_before"
  | "30_minutes_before"
  | "15_minutes_before"
  | "5_minutes_before";

export type OnlineLinkVisibility = "pass_holders_only";

export const EVENT_FORMAT_OPTIONS: {
  value: EventFormat;
  label: string;
  description: string;
}[] = [
  { value: "onsite", label: "現地開催", description: "会場で開催するイベント" },
  { value: "online", label: "オンライン開催", description: "オンラインで参加するイベント" },
  { value: "hybrid", label: "ハイブリッド開催", description: "現地とオンラインの両方" },
];

export const EVENT_FORMAT_LABEL: Record<EventFormat, string> = {
  onsite: "現地開催",
  online: "オンライン開催",
  hybrid: "ハイブリッド開催",
};

export const ONLINE_SERVICE_OPTIONS: { value: OnlineService; label: string }[] = [
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "microsoft_teams", label: "Microsoft Teams" },
  { value: "youtube_live", label: "YouTube Live" },
  { value: "other", label: "その他" },
];

export const ONLINE_SERVICE_LABEL: Record<OnlineService, string> = Object.fromEntries(
  ONLINE_SERVICE_OPTIONS.map((o) => [o.value, o.label])
) as Record<OnlineService, string>;

export const ONLINE_LINK_DISPLAY_TIMING_OPTIONS: {
  value: OnlineLinkDisplayTiming;
  label: string;
  minutesBefore: number | null;
  recommended?: boolean;
}[] = [
  { value: "immediately", label: "参加パス発行後すぐ", minutesBefore: null },
  { value: "60_minutes_before", label: "開始60分前", minutesBefore: 60 },
  { value: "30_minutes_before", label: "開始30分前", minutesBefore: 30 },
  {
    value: "15_minutes_before",
    label: "開始15分前",
    minutesBefore: 15,
    recommended: true,
  },
  { value: "5_minutes_before", label: "開始5分前", minutesBefore: 5 },
];

export const DEFAULT_EVENT_FORMAT: EventFormat = "onsite";
export const DEFAULT_ONLINE_LINK_DISPLAY_TIMING: OnlineLinkDisplayTiming =
  "15_minutes_before";
export const DEFAULT_ONLINE_LINK_VISIBILITY: OnlineLinkVisibility = "pass_holders_only";
export const ONLINE_LOCATION_PLACEHOLDER = "オンライン開催";
export const ONLINE_GUIDE_MESSAGE_MAX = 500;
export const REMINDER_MINUTES_BEFORE = 30;

export function normalizeEventFormat(value: unknown): EventFormat {
  if (value === "online" || value === "hybrid" || value === "onsite") return value;
  return DEFAULT_EVENT_FORMAT;
}

export function normalizeOnlineService(value: unknown): OnlineService | null {
  if (
    value === "zoom" ||
    value === "google_meet" ||
    value === "microsoft_teams" ||
    value === "youtube_live" ||
    value === "other"
  ) {
    return value;
  }
  return null;
}

export function normalizeOnlineLinkDisplayTiming(
  value: unknown
): OnlineLinkDisplayTiming {
  if (
    value === "immediately" ||
    value === "60_minutes_before" ||
    value === "30_minutes_before" ||
    value === "15_minutes_before" ||
    value === "5_minutes_before"
  ) {
    return value;
  }
  return DEFAULT_ONLINE_LINK_DISPLAY_TIMING;
}

export function isOnlineCapableFormat(format: EventFormat): boolean {
  return format === "online" || format === "hybrid";
}

export function needsVenueFields(format: EventFormat): boolean {
  return format === "onsite" || format === "hybrid";
}

export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function timingMinutesBefore(
  timing: OnlineLinkDisplayTiming
): number | null {
  return (
    ONLINE_LINK_DISPLAY_TIMING_OPTIONS.find((o) => o.value === timing)
      ?.minutesBefore ?? null
  );
}

/** 参加リンクの表示開始時刻（ミリ秒）。immediately は null（パス発行済みなら即時） */
export function resolveOnlineLinkAvailableAtMs(
  dateYmd: string,
  startTimeHm: string,
  timing: OnlineLinkDisplayTiming
): number | null {
  const startTs = toJstTimestamp(dateYmd, startTimeHm);
  if (startTs == null) return null;
  const minutes = timingMinutesBefore(timing);
  if (minutes == null) return null;
  return startTs - minutes * 60 * 1000;
}

export function isOnlineLinkVisibleNow(input: {
  date: string;
  startTime: string;
  timing: OnlineLinkDisplayTiming;
  nowMs?: number;
}): boolean {
  if (input.timing === "immediately") return true;
  const availableAt = resolveOnlineLinkAvailableAtMs(
    input.date,
    input.startTime,
    input.timing
  );
  if (availableAt == null) return false;
  return (input.nowMs ?? Date.now()) >= availableAt;
}

export function onlineLinkWaitingMessage(timing: OnlineLinkDisplayTiming): string {
  const minutes = timingMinutesBefore(timing);
  if (minutes == null) {
    return "オンライン参加リンクは、参加パス発行後すぐに表示されます";
  }
  return `オンライン参加リンクは、開始${minutes}分前に表示されます`;
}

export function formatJstHmFromMs(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

export function resolveReminderAtIso(
  dateYmd: string,
  startTimeHm: string,
  minutesBefore = REMINDER_MINUTES_BEFORE
): string | null {
  const startTs = toJstTimestamp(dateYmd, startTimeHm);
  if (startTs == null) return null;
  return new Date(startTs - minutesBefore * 60 * 1000).toISOString();
}

/** 機密を含まない主催者向け以外の公開メタ */
export type EventOnlinePublicMeta = {
  eventFormat: EventFormat;
};

export type EventOnlineSecrets = {
  onlineService: OnlineService | null;
  onlineJoinUrl: string | null;
  onlineMeetingId: string | null;
  onlinePasscode: string | null;
  onlineGuideMessage: string | null;
  onlineLinkVisibility: OnlineLinkVisibility;
  onlineLinkDisplayTiming: OnlineLinkDisplayTiming;
  publicPageLinkVisible: boolean;
};

export type EventOnlineAccessResponse = {
  eventFormat: EventFormat;
  linkVisible: boolean;
  waitingMessage: string | null;
  joinAvailableAt: string | null;
  eventStartAt: string | null;
  onlineService: OnlineService | null;
  onlineServiceLabel: string | null;
  onlineJoinUrl: string | null;
  onlineMeetingId: string | null;
  onlinePasscode: string | null;
  onlineGuideMessage: string | null;
  passIssued: boolean;
};
