/** 主催者 iPhone タッチ決済アプリの URL スキーム */
export const POS_TAP_APP_SCHEME = "machiglyph-pos";

export function posTapAppLink(saleId: string): string {
  return `${POS_TAP_APP_SCHEME}://tap?saleId=${encodeURIComponent(saleId)}`;
}

export function getStripeTerminalLocationId(): string | undefined {
  const raw = process.env.STRIPE_TERMINAL_LOCATION_ID?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

export const POS_TAP_PAYMENT_TYPE = "pos_tap";
