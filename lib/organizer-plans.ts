/**
 * 主催者プラン画面の表示用カタログ。
 * 課金が実際に動くのは STANDARD（既存の月額980円 Stripe）のみ。
 * GAME / TEAM の金額は表示用。Stripe Price は追加しない。
 */

export const ORGANIZER_CATALOG_PLAN_IDS = ["free", "standard", "game", "team"] as const;

export type OrganizerCatalogPlanId = (typeof ORGANIZER_CATALOG_PLAN_IDS)[number];

export type OrganizerCatalogPlanTone = "free" | "standard" | "game" | "team";

export type OrganizerCatalogPlan = {
  id: OrganizerCatalogPlanId;
  name: string;
  priceLabel: string;
  monthlyPriceLabel: string;
  tagline: string;
  description: string;
  includesLabel: string | null;
  /** カードに常時出す主要機能（3つ） */
  highlights: readonly string[];
  extraFeatures: readonly string[];
  features: readonly string[];
  ctaLabel: string;
  recommended: boolean;
  /** true のとき Checkout 可能（既存 STRIPE_PRICE_ORGANIZER_980） */
  checkoutEnabled: boolean;
  tone: OrganizerCatalogPlanTone;
};

export const ORGANIZER_CATALOG_PLANS: readonly OrganizerCatalogPlan[] = [
  {
    id: "free",
    name: "FREE",
    priceLabel: "¥0",
    monthlyPriceLabel: "月額0円",
    tagline: "はじめての掲載向け",
    description: "イベントやお店を、1件まで公開できる無料プラン。",
    includesLabel: null,
    highlights: ["掲載1件", "申込受付", "参加パス"],
    extraFeatures: ["基本的な参加者管理", "投稿・アルバム・マップ"],
    features: [
      "公開中の掲載1件",
      "参加申込受付",
      "基本的な参加者管理",
      "参加パス",
      "投稿・アルバム・マップ",
    ],
    ctaLabel: "続ける",
    recommended: false,
    checkoutEnabled: false,
    tone: "free",
  },
  {
    id: "standard",
    name: "STANDARD",
    priceLabel: "¥980 / 月",
    monthlyPriceLabel: "月額980円",
    tagline: "本格的に運営する",
    description: "掲載の制限なし。受付・パス、あとから店頭レジも使えます。",
    includesLabel: "FREEの機能に加えて",
    highlights: ["掲載無制限", "受付・参加パス", "決済・レジ（準備中）"],
    extraFeatures: ["参加者・応募者管理", "下書き・過去の活動管理"],
    features: [
      "掲載数無制限",
      "参加者・応募者管理",
      "QR受付・参加パス",
      "決済・レジ（準備中）",
      "下書き・過去の活動管理",
    ],
    ctaLabel: "これに変える",
    recommended: true,
    checkoutEnabled: true,
    tone: "standard",
  },
  {
    id: "game",
    name: "GAME",
    priceLabel: "¥2,980 / 月",
    monthlyPriceLabel: "月額2,980円",
    tagline: "イベントを盛り上げる",
    description: "スタンプラリーやクイズなど、参加型の遊びを足せるプラン（準備中）。",
    includesLabel: "STANDARDの機能に加えて",
    highlights: ["スタンプラリー", "クイズ", "チェックポイント"],
    extraFeatures: ["景品管理", "ゲーム参加者管理"],
    features: [
      "スタンプラリー",
      "クイズラリー",
      "QRチェックポイント",
      "景品管理",
      "ゲーム参加者管理",
    ],
    ctaLabel: "GAMEをはじめる",
    recommended: false,
    checkoutEnabled: false,
    tone: "game",
  },
  {
    id: "team",
    name: "TEAM",
    priceLabel: "¥5,980 / 月",
    monthlyPriceLabel: "月額5,980円",
    tagline: "複数人で運営する",
    description: "メンバー管理や権限など、チーム向けの機能（準備中）。",
    includesLabel: "GAMEの機能に加えて",
    highlights: ["5人までチーム", "権限設定", "請求書払い"],
    extraFeatures: ["CSV出力", "分析・レポート"],
    features: [
      "5名までチーム管理",
      "メンバーの権限設定",
      "請求書払い",
      "CSV出力",
      "分析・レポート",
    ],
    ctaLabel: "TEAMをはじめる",
    recommended: false,
    checkoutEnabled: false,
    tone: "team",
  },
];

export function getOrganizerCatalogPlan(
  id: OrganizerCatalogPlanId
): OrganizerCatalogPlan {
  const plan = ORGANIZER_CATALOG_PLANS.find((p) => p.id === id);
  if (!plan) return ORGANIZER_CATALOG_PLANS[0];
  return plan;
}

/** 既存課金は無料 / 有料（980円）のみ。有料は STANDARD として扱う。 */
export function getCurrentOrganizerCatalogPlanId(
  isPaid: boolean
): OrganizerCatalogPlanId {
  return isPaid ? "standard" : "free";
}
