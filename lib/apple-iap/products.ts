/**
 * 主催者プランの App 内課金（自動更新サブスク）の商品 ID。
 * App Store Connect のサブスクリプショングループ「主催者プラン」に同じ ID で登録する。
 * クライアント（アプリ内のプラン画面）とサーバー（購入の検証）の両方で使う。
 */

export type OrganizerPaidPlan = "standard" | "game" | "team";

export const APPLE_ORGANIZER_PRODUCT_IDS: Record<OrganizerPaidPlan, string> = {
  standard: "jp.machiglyph.app.organizer.standard.monthly",
  game: "jp.machiglyph.app.organizer.game.monthly",
  // 2026-11-15 に App Store Connect で作成（グループ「主催者プラン」・¥5,980）。審査で承認されるまでアプリには出ない
  team: "jp.machiglyph.app.organizer.team.monthly",
};

export const APPLE_ORGANIZER_PRODUCT_ID_LIST = Object.values(APPLE_ORGANIZER_PRODUCT_IDS);

export function appleProductIdToPlan(productId: string | null | undefined): OrganizerPaidPlan | null {
  if (productId === APPLE_ORGANIZER_PRODUCT_IDS.team) return "team";
  if (productId === APPLE_ORGANIZER_PRODUCT_IDS.game) return "game";
  if (productId === APPLE_ORGANIZER_PRODUCT_IDS.standard) return "standard";
  return null;
}

/** organizers.plan に入れる値（Stripe と同じく STANDARD は "starter"） */
export function planColumnForAppleProduct(productId: string | null | undefined): "team" | "game" | "starter" | null {
  const plan = appleProductIdToPlan(productId);
  if (plan === "team") return "team";
  if (plan === "game") return "game";
  if (plan === "standard") return "starter";
  return null;
}
