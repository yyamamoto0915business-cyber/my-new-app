/**
 * Stripe クライアント・共通ユーティリティ
 * Checkout 用の base URL を環境に応じて返す
 */
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function getStripe(): Stripe | null {
  return stripeKey ? new Stripe(stripeKey) : null;
}

export function getAppUrl(): string {
  return appUrl.replace(/\/$/, "");
}
