/**
 * 主催者プラン画面の表示用カタログ。
 * 課金が動くのは STANDARD（月額980円）と GAME（月額2,980円）。TEAM は準備中で表示のみ。
 * 機能の出し分けは lib/billing.ts の canUseOrganizerFeature。
 */
import type { OrganizerPlanTier } from "@/lib/billing";

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
  /** true のとき Checkout 可能（STRIPE_PRICE_ORGANIZER_980 / STRIPE_PRICE_ORGANIZER_GAME_2980） */
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
    highlights: ["掲載無制限", "受付・参加パス", "決済・レジ"],
    extraFeatures: ["参加者・応募者管理", "下書き・過去の活動管理"],
    features: [
      "掲載数無制限",
      "参加者・応募者管理",
      "QR受付・参加パス",
      "決済・レジ",
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
    description: "スタンプラリーやクイズ、謎解きなど、参加型のゲームを作れるプラン。",
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
    checkoutEnabled: true,
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

/** プランの段階とカタログの ID は同じ値 */
export function getCurrentOrganizerCatalogPlanId(
  tier: OrganizerPlanTier
): OrganizerCatalogPlanId {
  return tier;
}

export function getOrganizerCatalogPlanName(tier: OrganizerPlanTier): string {
  return getOrganizerCatalogPlan(getCurrentOrganizerCatalogPlanId(tier)).name;
}
