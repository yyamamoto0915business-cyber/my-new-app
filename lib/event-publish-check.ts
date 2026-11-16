import { validateOnlineEventFormFields } from "@/lib/event-online-validation";
import { needsVenueFields, normalizeEventFormat } from "@/lib/event-online";

/**
 * 下書きは「イベント名・開催日・開始時刻」だけで保存できる。
 * そのため、公開するときに足りない項目がないかをここで確かめる（サーバー側の最後の確認）。
 */
export type PublishCheckInput = {
  title?: unknown;
  description?: unknown;
  date?: unknown;
  startTime?: unknown;
  location?: unknown;
  address?: unknown;
  prefecture?: unknown;
  eventFormat?: unknown;
  onlineService?: unknown;
  onlineJoinUrl?: unknown;
  onlineGuideMessage?: unknown;
  onlineLinkDisplayTiming?: unknown;
};

const ONLINE_LABEL: Record<string, string> = {
  startTime: "開始時刻",
  location: "開催場所",
  address: "住所",
  onlineJoinUrl: "参加URL",
  onlineService: "配信サービス",
  onlineGuideMessage: "参加案内メッセージ",
};

const s = (v: unknown) => String(v ?? "").trim();

/** 公開に足りない項目の呼び名（なければ空の配列） */
export function missingForPublish(event: PublishCheckInput): string[] {
  const missing: string[] = [];
  if (!s(event.title)) missing.push("イベント名");
  if (!s(event.description)) missing.push("イベント概要");
  if (!s(event.date)) missing.push("開催日");
  if (!s(event.startTime)) missing.push("開始時刻");
  const format = normalizeEventFormat(event.eventFormat);
  const online = validateOnlineEventFormFields({
    eventFormat: format,
    onlineService: event.onlineService,
    onlineJoinUrl: event.onlineJoinUrl,
    onlineGuideMessage: event.onlineGuideMessage,
    onlineLinkDisplayTiming: event.onlineLinkDisplayTiming,
    location: event.location,
    address: event.address,
    startTime: event.startTime || "00:00",
  });
  for (const key of Object.keys(online)) {
    const label = ONLINE_LABEL[key] ?? key;
    if (!missing.includes(label)) missing.push(label);
  }
  if (needsVenueFields(format) && !s(event.prefecture)) missing.push("都道府県");
  return missing;
}

export function missingForPublishMessage(missing: string[]): string {
  return `公開する前に、次の項目を入れてください：${missing.join("・")}`;
}
