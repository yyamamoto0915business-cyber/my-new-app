/**
 * Stripe クライアント・共通ユーティリティ
 * Checkout 用の base URL を環境に応じて返す
 */
import Stripe from "stripe";

/** 前後空白のみの誤設定でも無効扱いにする */
export function getStripeSecretKey(): string | undefined {
  const raw = process.env.STRIPE_SECRET_KEY;
  if (typeof raw !== "string") return undefined;
  const k = raw.trim();
  return k.length > 0 ? k : undefined;
}

export function isStripeServerConfigured(): boolean {
  return !!getStripeSecretKey();
}

export function getStripe(): Stripe | null {
  const stripeKey = getStripeSecretKey();
  return stripeKey ? new Stripe(stripeKey) : null;
}

/**
 * Checkout / Connect の戻り先などに使う公開 URL。
 * 呼び出しのたびに process.env を読む（モジュール初期化時の固定を避ける）。
 * Stripe ライブモードはリダイレクト先が HTTPS 必須のため、本番ドメインの http:// は https:// に上げる。
 */
export function getAppUrl(): string {
  const vercelHost = process.env.VERCEL_URL?.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const configured =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (vercelHost ? `https://${vercelHost}` : "");

  let base = (configured || "http://localhost:3000").replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  } else if (/^http:\/\//i.test(base)) {
    const isLoopback =
      /^http:\/\/localhost\b/i.test(base) || /^http:\/\/127\.0\.0\.1\b/i.test(base);
    if (!isLoopback) {
      base = base.replace(/^http:\/\//i, "https://");
    }
  }
  return base;
}
