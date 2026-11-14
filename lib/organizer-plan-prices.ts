/**
 * 主催者サブスクの Stripe Price ID（サーバー専用）
 * STANDARD: STRIPE_PRICE_ORGANIZER_980（旧 STRIPE_PRICE_STARTER_980）
 * GAME:     STRIPE_PRICE_ORGANIZER_GAME_2980
 * TEAM:     STRIPE_PRICE_ORGANIZER_TEAM_5980（Web だけ。App Store の商品はまだない）
 */

export type OrganizerPaidPlan = "standard" | "game" | "team";

function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const raw = process.env[name];
    if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  }
  return undefined;
}

export function getOrganizerPlanPriceId(plan: OrganizerPaidPlan): string | undefined {
  if (plan === "team") return readEnv("STRIPE_PRICE_ORGANIZER_TEAM_5980");
  return plan === "game"
    ? readEnv("STRIPE_PRICE_ORGANIZER_GAME_2980")
    : readEnv("STRIPE_PRICE_ORGANIZER_980", "STRIPE_PRICE_STARTER_980");
}

/** Stripe の Price ID から organizers.plan に保存する値を決める */
export function organizerPlanColumnForPrice(priceId: string | null): "team" | "game" | "starter" {
  const teamPriceId = getOrganizerPlanPriceId("team");
  if (teamPriceId && priceId === teamPriceId) return "team";
  const gamePriceId = getOrganizerPlanPriceId("game");
  return gamePriceId && priceId === gamePriceId ? "game" : "starter";
}
