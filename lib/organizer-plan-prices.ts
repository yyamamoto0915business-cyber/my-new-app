/**
 * 主催者サブスクの Stripe Price ID（サーバー専用）
 * STANDARD: STRIPE_PRICE_ORGANIZER_980（旧 STRIPE_PRICE_STARTER_980）
 * GAME:     STRIPE_PRICE_ORGANIZER_GAME_2980
 */

export type OrganizerPaidPlan = "standard" | "game";

function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const raw = process.env[name];
    if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  }
  return undefined;
}

export function getOrganizerPlanPriceId(plan: OrganizerPaidPlan): string | undefined {
  return plan === "game"
    ? readEnv("STRIPE_PRICE_ORGANIZER_GAME_2980")
    : readEnv("STRIPE_PRICE_ORGANIZER_980", "STRIPE_PRICE_STARTER_980");
}

/** Stripe の Price ID から organizers.plan に保存する値を決める */
export function organizerPlanColumnForPrice(priceId: string | null): "game" | "starter" {
  const gamePriceId = getOrganizerPlanPriceId("game");
  return gamePriceId && priceId === gamePriceId ? "game" : "starter";
}
