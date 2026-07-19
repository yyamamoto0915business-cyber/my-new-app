import type { EventFormat, EventOnlineAccessResponse } from "@/lib/event-online";
import type { ParticipationPass } from "@/lib/participation-pass";

export type PassOnlinePreviewMode =
  | "online-waiting"
  | "online-visible"
  | "hybrid-waiting"
  | "hybrid-visible";

export function parsePassOnlinePreviewMode(
  value: string | null | undefined
): PassOnlinePreviewMode | null {
  if (
    value === "online-waiting" ||
    value === "online-visible" ||
    value === "hybrid-waiting" ||
    value === "hybrid-visible"
  ) {
    return value;
  }
  // 短いエイリアス
  if (value === "online") return "online-waiting";
  if (value === "online-only") return "online-visible";
  if (value === "hybrid") return "hybrid-waiting";
  return null;
}

function buildPreviewPass(format: EventFormat): ParticipationPass {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start);
  end.setHours(21, 0, 0, 0);

  return {
    id: `preview-pass-${format}`,
    eventId: `preview-event-${format}`,
    eventTitle:
      format === "online"
        ? "オンラインまちづくりワークショップ"
        : "ハイブリッド地域マルシェ",
    eventImage:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    venueName: format === "online" ? "オンライン開催" : "市民ホール＋オンライン",
    venueAddress: format === "online" ? undefined : "東京都渋谷区〇〇町1-2-3",
    attendeeName: "デモ 太郎",
    receptionNumber: "MG-PREVIEW-001",
    paymentStatus: "free",
    receptionType: "qr",
    ticketLabel: "大人",
    quantity: 1,
    qrValue: "mg-pass:preview-online",
    expiresAt: end.toISOString(),
    status: "upcoming",
    kind: "visitor",
    eventFormat: format,
    organizerContact: "demo@example.com",
  };
}

function buildPreviewAccess(
  format: EventFormat,
  visible: boolean
): EventOnlineAccessResponse {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(19, 0, 0, 0);
  const available = new Date(start);
  available.setMinutes(available.getMinutes() - 15);

  if (!visible) {
    return {
      eventFormat: format,
      linkVisible: false,
      waitingMessage: "オンライン参加リンクは、開始15分前に表示されます",
      joinAvailableAt: available.toISOString(),
      eventStartAt: start.toISOString(),
      onlineService: "zoom",
      onlineServiceLabel: "Zoom",
      onlineJoinUrl: null,
      onlineMeetingId: null,
      onlinePasscode: null,
      onlineGuideMessage: null,
      passIssued: true,
    };
  }

  return {
    eventFormat: format,
    linkVisible: true,
    waitingMessage: null,
    joinAvailableAt: available.toISOString(),
    eventStartAt: start.toISOString(),
    onlineService: "zoom",
    onlineServiceLabel: "Zoom",
    onlineJoinUrl: "https://zoom.us/j/1234567890",
    onlineMeetingId: "123 456 7890",
    onlinePasscode: "DEMO12",
    onlineGuideMessage:
      "開始10分前から入室できます。マイクはミュートでお入りください。",
    passIssued: true,
  };
}

/** 本物の /pass 画面に差し込むプレビュー用データ */
export function buildPassOnlinePreview(mode: PassOnlinePreviewMode): {
  pass: ParticipationPass;
  access: EventOnlineAccessResponse;
  bannerLabel: string;
} {
  const format: EventFormat = mode.startsWith("hybrid") ? "hybrid" : "online";
  const visible = mode.endsWith("visible");
  const pass = buildPreviewPass(format);
  return {
    pass,
    access: buildPreviewAccess(format, visible),
    bannerLabel: visible
      ? format === "online"
        ? "オンライン開催のみ・リンク表示中（プレビュー）"
        : "ハイブリッド・リンク表示中（プレビュー）"
      : format === "online"
        ? "オンライン開催のみ・リンク表示前（プレビュー）"
        : "ハイブリッド・リンク表示前（プレビュー）",
  };
}
