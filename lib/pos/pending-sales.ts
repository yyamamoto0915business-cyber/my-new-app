import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPosSaleByStripeRef,
  listStalePendingPointSales,
  markPosSaleCancelledIfPending,
  markPosSalePaidByPaymentIntent,
  markPosSalePaidBySession,
} from "@/lib/db/pos";
import { restorePosPoints } from "@/lib/points/pos-points";
import type { PosSale } from "@/lib/pos/types";

/**
 * スマホ払い・カードタッチの「支払い待ち」の会計を終わらせる。
 * ポイントを使う会計は、QRを出したときにポイントを預かっている（使った記録を先に入れている）。
 * やめたとき・払われないまま時間がたったときは、先に Stripe 側でその支払いを止めて（あとから払えないように）、
 * それから会計を取り消してポイントを戻す。Stripe 側で払い終わっていたら、支払い済みにする。
 */

/** スマホ払いの決済ページが切れるまで（Stripe の最短は30分）。これより古い支払い待ちは片づける */
export const POS_PENDING_POINTS_TTL_MS = 31 * 60 * 1000;

export type SettleOutcome =
  /** 取り消して、ポイントを戻した */
  | "cancelled"
  /** Stripe 側で払い終わっていた */
  | "paid"
  /** 支払いの途中（カードの処理中など）。今は止められない */
  | "busy"
  /** もう支払い待ちではない */
  | "not_pending";

/** 会計でポイントを預かっていたら戻す（何度呼んでも二重には戻さない） */
export async function restoreSalePoints(sale: PosSale): Promise<boolean> {
  if (!sale.pointsUsed || !sale.pointsUserId || !sale.eventId) return true;
  return restorePosPoints({ userId: sale.pointsUserId, eventId: sale.eventId, saleId: sale.id });
}

/** 会計を取り消しにして、預かっていたポイントを戻す（Stripe 側はもう止まっている前提） */
export async function cancelPendingSaleAndRestore(db: SupabaseClient, sale: PosSale): Promise<void> {
  const cancelled = await markPosSaleCancelledIfPending(db, sale.id);
  if (cancelled || sale.status === "cancelled") await restoreSalePoints(sale);
}

function isStripeError(e: unknown): e is { message?: string; code?: string } {
  return typeof e === "object" && e !== null && "message" in e;
}

/** 支払い待ちの会計を、Stripe の状態に合わせて終わらせる */
export async function settlePendingPosSale(
  db: SupabaseClient,
  stripe: Stripe | null,
  sale: PosSale
): Promise<SettleOutcome> {
  if (sale.status === "paid") return "paid";
  if (sale.status !== "pending") {
    // 前に取り消したときにポイントを戻せていなかったら、もう一度戻す
    if (sale.status === "cancelled") await restoreSalePoints(sale);
    return "not_pending";
  }

  // スマホ払い（Checkout）
  if (sale.stripeCheckoutSessionId) {
    if (!stripe) return "busy";
    let session = await stripe.checkout.sessions.retrieve(sale.stripeCheckoutSessionId);
    if (session.status === "open") {
      try {
        session = await stripe.checkout.sessions.expire(session.id);
      } catch (e) {
        // ちょうど払われた・もう切れていた → 状態を読み直す
        console.warn("pos checkout expire:", isStripeError(e) ? e.message : e);
        session = await stripe.checkout.sessions.retrieve(session.id);
      }
    }
    if (session.status === "complete") {
      if (session.payment_status !== "paid") return "busy";
      const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
      await markPosSalePaidBySession(db, session.id, piId, session.amount_total ?? sale.totalYen);
      return "paid";
    }
    if (session.status !== "expired") return "busy";
    await cancelPendingSaleAndRestore(db, sale);
    return "cancelled";
  }

  // カードタッチ（PaymentIntent）
  if (sale.stripePaymentIntentId) {
    if (!stripe) return "busy";
    let pi = await stripe.paymentIntents.retrieve(sale.stripePaymentIntentId);
    if (pi.status === "succeeded") {
      await markPosSalePaidByPaymentIntent(db, pi.id, pi.amount_received || pi.amount);
      return "paid";
    }
    if (pi.status !== "canceled") {
      try {
        pi = await stripe.paymentIntents.cancel(pi.id);
      } catch (e) {
        console.warn("pos tap cancel:", isStripeError(e) ? e.message : e);
        pi = await stripe.paymentIntents.retrieve(pi.id);
        if (pi.status === "succeeded") {
          await markPosSalePaidByPaymentIntent(db, pi.id, pi.amount_received || pi.amount);
          return "paid";
        }
      }
    }
    if (pi.status !== "canceled") return "busy";
    await cancelPendingSaleAndRestore(db, sale);
    return "cancelled";
  }

  // Stripe の決済を作る前に止まった会計
  await cancelPendingSaleAndRestore(db, sale);
  return "cancelled";
}

/** レジを開いたときに、ポイントを預かったまま古くなった支払い待ちを片づける（失敗しても会計の画面は出す） */
export async function sweepStalePendingPointSales(
  db: SupabaseClient,
  stripe: Stripe | null,
  organizerId: string,
  now = Date.now()
): Promise<number> {
  let done = 0;
  try {
    const stale = await listStalePendingPointSales(db, organizerId, new Date(now - POS_PENDING_POINTS_TTL_MS).toISOString());
    for (const sale of stale) {
      try {
        const outcome = await settlePendingPosSale(db, stripe, sale);
        if (outcome === "cancelled" || outcome === "paid") done++;
      } catch (e) {
        console.error("pos sweep sale:", sale.id, e);
      }
    }
  } catch (e) {
    console.error("pos sweep:", e);
  }
  return done;
}

/** Stripe の知らせ：決済ページが切れた／カードタッチが取り消された → 会計を取り消してポイントを戻す */
export async function cancelPosSaleFromStripe(
  db: SupabaseClient,
  ref: { sessionId?: string | null; paymentIntentId?: string | null }
): Promise<void> {
  const sale = await getPosSaleByStripeRef(db, ref);
  if (!sale) return;
  if (sale.status === "pending" || sale.status === "cancelled") await cancelPendingSaleAndRestore(db, sale);
}

/** Stripe の知らせ：返金された → 使ったポイントを戻す */
export async function restorePointsForRefundedStripeSale(db: SupabaseClient, paymentIntentId: string): Promise<void> {
  const sale = await getPosSaleByStripeRef(db, { paymentIntentId });
  if (sale && sale.status === "refunded") await restoreSalePoints(sale);
}
