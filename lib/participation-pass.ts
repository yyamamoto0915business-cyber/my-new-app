export type ParticipationPass = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  startAt: string;
  endAt: string;
  venueName: string;
  venueAddress?: string;
  attendeeName: string;
  receptionNumber: string;
  paymentStatus: "paid" | "free" | "onsite";
  receptionType: "qr" | "staff";
  ticketLabel: string;
  quantity: number;
  qrValue?: string;
  expiresAt?: string;
  status: "upcoming" | "today" | "completed" | "cancelled";
};

export type PassTabId = "upcoming" | "today" | "history";

export const PASS_TABS: { id: PassTabId; label: string }[] = [
  { id: "upcoming", label: "これから参加" },
  { id: "today", label: "本日開催" },
  { id: "history", label: "参加履歴" },
];

export const PAYMENT_STATUS_LABEL: Record<ParticipationPass["paymentStatus"], string> = {
  paid: "支払い済み",
  free: "無料",
  onsite: "現地支払い",
};

export const RECEPTION_TYPE_LABEL: Record<ParticipationPass["receptionType"], string> = {
  qr: "QR受付",
  staff: "スタッフ確認",
};

/** サンプルデータの「あとN日」算出用（2025-05-24 の3日前） */
export const SAMPLE_PASS_REFERENCE_NOW = new Date("2025-05-21T12:00:00+09:00");

export const SAMPLE_PARTICIPATION_PASSES: ParticipationPass[] = [
  {
    id: "pass-midori-2025",
    eventId: "1",
    eventTitle: "みどりと暮らすマルシェ 2025",
    eventImage:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",
    startAt: "2025-05-24T10:00:00+09:00",
    endAt: "2025-05-24T16:00:00+09:00",
    venueName: "代々木公園 ケヤキ並木",
    venueAddress: "東京都渋谷区代々木神園町",
    attendeeName: "山本 雄太",
    receptionNumber: "MG-240524-018",
    paymentStatus: "paid",
    receptionType: "qr",
    ticketLabel: "大人",
    quantity: 1,
    qrValue: "MG-PASS-MIDORI-240524-018",
    expiresAt: "2025-05-24T16:00:00+09:00",
    status: "upcoming",
  },
  {
    id: "pass-patakara",
    eventId: "03574741-5042-470a-87a6-17a7738e66f4",
    eventTitle: "パタカラカフェでモヤっと対話",
    eventImage:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    startAt: "2025-04-27T11:00:00+09:00",
    endAt: "2025-04-27T13:00:00+09:00",
    venueName: "パタカラカフェ（東京都渋谷区）",
    attendeeName: "山本 雄太",
    receptionNumber: "MG-250427-003",
    paymentStatus: "free",
    receptionType: "staff",
    ticketLabel: "大人",
    quantity: 1,
    status: "upcoming",
  },
  {
    id: "pass-namioto",
    eventId: "20b4d6b1-a564-4493-8a9f-6dc8a9740830",
    eventTitle: "ナミオト SPRING CONCERT 2025",
    eventImage:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    startAt: "2025-05-16T14:00:00+09:00",
    endAt: "2025-05-16T16:00:00+09:00",
    venueName: "なみホール（東京都目黒区）",
    attendeeName: "山本 雄太",
    receptionNumber: "MG-250516-041",
    paymentStatus: "onsite",
    receptionType: "qr",
    ticketLabel: "大人",
    quantity: 1,
    qrValue: "MG-PASS-NAMIOTO-250516-041",
    expiresAt: "2025-05-16T16:00:00+09:00",
    status: "upcoming",
  },
];

/** JST のカレンダー日差（開催日 − 今日） */
export function getDaysUntil(startAt: string, now = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const startYmd = fmt.format(new Date(startAt));
  const nowYmd = fmt.format(now);
  const [sy, sm, sd] = startYmd.split("-").map(Number);
  const [ny, nm, nd] = nowYmd.split("-").map(Number);
  const startDay = Date.UTC(sy, sm - 1, sd);
  const nowDay = Date.UTC(ny, nm - 1, nd);
  return Math.round((startDay - nowDay) / (1000 * 60 * 60 * 24));
}

export function formatPassDateRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"] as const;
  const y = start.getFullYear();
  const m = start.getMonth() + 1;
  const d = start.getDate();
  const w = weekdays[start.getDay()];
  const pad = (n: number) => String(n).padStart(2, "0");
  const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  return `${y}年${m}月${d}日（${w}）${startTime}〜${endTime}`;
}

export function formatExpiresAt(expiresAt: string): string {
  const d = new Date(expiresAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}まで`;
}

export function formatDaysUntilLabel(days: number): string {
  if (days === 0) return "本日開催";
  if (days === 1) return "あと1日";
  if (days > 1) return `あと${days}日`;
  return "開催済み";
}

export function formatTicketQuantity(pass: ParticipationPass): string {
  return `${pass.ticketLabel}${pass.quantity}名`;
}

export function filterPassesByTab(
  passes: ParticipationPass[],
  tab: PassTabId
): ParticipationPass[] {
  if (tab === "upcoming") {
    return passes.filter((p) => p.status === "upcoming");
  }
  if (tab === "today") {
    return passes.filter((p) => p.status === "today");
  }
  return passes
    .filter((p) => p.status === "completed" || p.status === "cancelled")
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
}

/** 「次の参加予定」: 今日以降で最も近い upcoming */
export function getNextPass(
  passes: ParticipationPass[],
  now: Date = new Date()
): ParticipationPass | null {
  const upcoming = filterPassesByTab(passes, "upcoming");
  if (upcoming.length === 0) return null;

  const future = upcoming
    .filter((p) => getDaysUntil(p.startAt, now) >= 0)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return future[0] ?? upcoming[0] ?? null;
}

export function getOtherPasses(
  passes: ParticipationPass[],
  nextId: string | null
): ParticipationPass[] {
  return filterPassesByTab(passes, "upcoming").filter((p) => p.id !== nextId);
}
