import {
  ONLINE_GUIDE_MESSAGE_MAX,
  isOnlineCapableFormat,
  isValidHttpUrl,
  needsVenueFields,
  normalizeEventFormat,
  normalizeOnlineLinkDisplayTiming,
  normalizeOnlineService,
  type EventFormat,
  type OnlineLinkDisplayTiming,
  type OnlineService,
} from "@/lib/event-online";

export type OnlineFormValidationInput = {
  eventFormat?: unknown;
  onlineService?: unknown;
  onlineJoinUrl?: unknown;
  onlineGuideMessage?: unknown;
  onlineLinkDisplayTiming?: unknown;
  location?: unknown;
  address?: unknown;
  startTime?: unknown;
};

export type OnlineFormValidationErrors = Record<string, string>;

export function validateOnlineEventFormFields(
  data: OnlineFormValidationInput
): OnlineFormValidationErrors {
  const errors: OnlineFormValidationErrors = {};
  const format = normalizeEventFormat(data.eventFormat);

  if (!String(data.startTime ?? "").trim()) {
    errors.startTime = "開始時刻を入力してください";
  }

  if (needsVenueFields(format)) {
    if (!String(data.location ?? "").trim()) {
      errors.location = "開催場所を入力してください";
    }
    if (!String(data.address ?? "").trim()) {
      errors.address = "住所を入力してください";
    }
  }

  if (isOnlineCapableFormat(format)) {
    const service = normalizeOnlineService(data.onlineService);
    if (!service) {
      errors.onlineService = "配信サービスを選択してください";
    }
    const url = String(data.onlineJoinUrl ?? "").trim();
    if (!url) {
      errors.onlineJoinUrl = "参加URLを入力してください";
    } else if (!isValidHttpUrl(url)) {
      errors.onlineJoinUrl = "正しいURL形式で入力してください";
    }
    const guide = String(data.onlineGuideMessage ?? "");
    if (guide.length > ONLINE_GUIDE_MESSAGE_MAX) {
      errors.onlineGuideMessage = `参加案内メッセージは${ONLINE_GUIDE_MESSAGE_MAX}文字以内で入力してください`;
    }
  }

  return errors;
}

export function pickOnlineFormFields(body: Record<string, unknown>): {
  eventFormat: EventFormat;
  onlineService: OnlineService | null;
  onlineJoinUrl: string;
  onlineMeetingId: string;
  onlinePasscode: string;
  onlineGuideMessage: string;
  onlineLinkVisibility: "pass_holders_only";
  onlineLinkDisplayTiming: OnlineLinkDisplayTiming;
  publicPageLinkVisible: false;
} {
  const eventFormat = normalizeEventFormat(body.eventFormat);
  const onlineCapable = isOnlineCapableFormat(eventFormat);
  return {
    eventFormat,
    onlineService: onlineCapable
      ? normalizeOnlineService(body.onlineService)
      : null,
    onlineJoinUrl: onlineCapable
      ? String(body.onlineJoinUrl ?? "").trim()
      : "",
    onlineMeetingId: onlineCapable
      ? String(body.onlineMeetingId ?? "").trim()
      : "",
    onlinePasscode: onlineCapable
      ? String(body.onlinePasscode ?? "").trim()
      : "",
    onlineGuideMessage: onlineCapable
      ? String(body.onlineGuideMessage ?? "").trim()
      : "",
    onlineLinkVisibility: "pass_holders_only",
    onlineLinkDisplayTiming: onlineCapable
      ? normalizeOnlineLinkDisplayTiming(body.onlineLinkDisplayTiming)
      : "15_minutes_before",
    publicPageLinkVisible: false,
  };
}
