/** 個人応援購入の一時ストア（Supabase未接続・tier未登録時用） */
import type { SponsorPurchase } from "./db/types";

const purchases: SponsorPurchase[] = [];

export function addSponsorPurchase(data: Omit<SponsorPurchase, "id" | "createdAt">): SponsorPurchase {
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const purchase: SponsorPurchase = { ...data, id, createdAt: new Date().toISOString() };
  purchases.push(purchase);
  return purchase;
}

export function getSponsorPurchasesByEvent(eventId: string): SponsorPurchase[] {
  return purchases.filter((p) => p.eventId === eventId && p.status === "paid");
}

export function getTotalAmountByEvent(eventId: string): number {
  return getSponsorPurchasesByEvent(eventId).reduce(
    (sum, p) => sum + p.amount * (p.quantity ?? 1),
    0
  );
}
