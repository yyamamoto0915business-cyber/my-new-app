import type { Event } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";

/** 参加パス購入判定に使うイベント情報 */
export type EventPurchaseData = {
  id: string;
  title: string;
  isPaid: boolean;
  price: number;
  capacity: number | null;
  soldCount: number;
  salesStartAt: string | null;
  salesEndAt: string | null;
  status: "draft" | "published" | "ended";
};

export type PurchaseCtaState =
  | "purchase"
  | "free_apply"
  | "sold_out"
  | "closed"
  | "purchased";

export function getRemainingCount(
  capacity: number | null,
  soldCount: number
): number | null {
  if (capacity === null) return null;
  return Math.max(capacity - soldCount, 0);
}

export function canPurchaseEvent(
  event: Pick<
    EventPurchaseData,
    "status" | "capacity" | "soldCount" | "salesStartAt" | "salesEndAt"
  >,
  now: Date = new Date()
): boolean {
  const remainingCount = getRemainingCount(event.capacity, event.soldCount);
  return (
    event.status === "published" &&
    remainingCount !== 0 &&
    (!event.salesStartAt || now >= new Date(event.salesStartAt)) &&
    (!event.salesEndAt || now <= new Date(event.salesEndAt))
  );
}

/** 仕様どおりの別名 */
export const canPurchase = canPurchaseEvent;

/** 既存 Event 型から購入用データを組み立てる */
export function toEventPurchaseData(event: Event): EventPurchaseData {
  const price = event.price ?? 0;
  const runtimeStatus = getEventStatus(event);
  let status: EventPurchaseData["status"] = "published";
  if (event.status === "draft" || event.status === "archived") {
    status = event.status === "draft" ? "draft" : "ended";
  } else if (runtimeStatus === "ended") {
    status = "ended";
  }

  return {
    id: event.id,
    title: event.title,
    isPaid: price > 0,
    price,
    capacity: event.capacity ?? null,
    soldCount: event.participantCount ?? 0,
    salesStartAt: null,
    salesEndAt: event.registrationDeadline ?? null,
    status,
  };
}

export function resolvePurchaseCtaState(options: {
  event: EventPurchaseData;
  isPurchased: boolean;
  now?: Date;
}): PurchaseCtaState {
  const { event, isPurchased, now = new Date() } = options;
  if (isPurchased) return "purchased";

  const remainingCount = getRemainingCount(event.capacity, event.soldCount);
  if (remainingCount === 0) return "sold_out";

  if (!canPurchaseEvent(event, now)) return "closed";

  return event.isPaid ? "purchase" : "free_apply";
}

export function getPurchaseCtaLabel(state: PurchaseCtaState): string {
  switch (state) {
    case "purchase":
      return "参加パスを購入する";
    case "free_apply":
      return "参加を申し込む";
    case "sold_out":
      return "参加パスは売り切れました";
    case "closed":
      return "受付は終了しました";
    case "purchased":
      return "参加パスを表示する";
  }
}

export function isPurchaseCtaDisabled(state: PurchaseCtaState): boolean {
  return state === "sold_out" || state === "closed";
}

/** マイ参加パス画面（Stripe連携後にQR表示へ拡張予定） */
export function getEventPassHref(eventId: string): string {
  return `/events/${eventId}/pass`;
}

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 申込締切表示: 4/26(日) 18:00 */
export function formatSalesDeadlineLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;
  if (!month || !day || !hour || !minute) return null;

  const w = weekday?.replace("曜日", "") ?? WEEKDAY[d.getDay()];
  return `${month}/${day}(${w}) ${hour}:${minute}`;
}
