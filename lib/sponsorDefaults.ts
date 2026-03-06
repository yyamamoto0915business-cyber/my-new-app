/**
 * イベント作成時に自動生成する SponsorTier のデフォルト定義
 */

export type SponsorTierInput = {
  type: "individual" | "company";
  price: number;
  name: string;
  description: string;
  benefits: string[];
  sortOrder: number;
};

/** 個人応援プラン 3件（500円 / 1,000円 / 3,000円） */
export const DEFAULT_INDIVIDUAL_TIERS: SponsorTierInput[] = [
  {
    type: "individual",
    price: 500,
    name: "応援",
    description: "会場費や備品代の支援",
    benefits: [],
    sortOrder: 1,
  },
  {
    type: "individual",
    price: 1000,
    name: "応援",
    description: "開催の支援",
    benefits: [],
    sortOrder: 2,
  },
  {
    type: "individual",
    price: 3000,
    name: "応援",
    description: "開催の支援",
    benefits: [],
    sortOrder: 3,
  },
];

/** 企業スポンサープラン 3件（1万 / 3万 / 5万） */
export const DEFAULT_COMPANY_TIERS: SponsorTierInput[] = [
  {
    type: "company",
    price: 10000,
    name: "企業協賛（ライト）",
    description: "まずは小さく応援",
    benefits: [
      "イベントページに企業名掲載（テキスト）",
      "リンク掲載（任意）",
      "開催後のお礼投稿/レポートで企業名紹介（1回）",
    ],
    sortOrder: 1,
  },
  {
    type: "company",
    price: 30000,
    name: "企業協賛（スタンダード）",
    description: "しっかり協賛（見える形で）",
    benefits: [
      "イベントページにロゴ掲載（小）＋リンク",
      "公式SNSでご紹介 1回（投稿orストーリー）",
      "開催後レポートでロゴ/企業名掲載",
    ],
    sortOrder: 2,
  },
  {
    type: "company",
    price: 50000,
    name: "企業協賛（メイン）",
    description: "メイン協賛（最優先でご紹介）",
    benefits: [
      "イベントページにロゴ掲載（中・上部優先）＋リンク",
      "公式SNSでご紹介 2回（告知＋お礼）",
      "会場A4掲示（スポンサー一覧）またはチラシ設置（任意）",
    ],
    sortOrder: 3,
  },
];

/** 全デフォルトTier（個人3+企業3） */
export const DEFAULT_SPONSOR_TIERS: SponsorTierInput[] = [
  ...DEFAULT_INDIVIDUAL_TIERS,
  ...DEFAULT_COMPANY_TIERS,
];
