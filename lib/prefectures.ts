/** 全国の都道府県一覧 */
export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

export type Prefecture = (typeof PREFECTURES)[number];

/** 地域（イベント作成などの絞り込み用） */
export const REGIONS = [
  { id: "hokkaido", label: "北海道", prefectures: ["北海道"] as const },
  {
    id: "tohoku",
    label: "東北",
    prefectures: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] as const,
  },
  {
    id: "kanto",
    label: "関東",
    prefectures: [
      "茨城県",
      "栃木県",
      "群馬県",
      "埼玉県",
      "千葉県",
      "東京都",
      "神奈川県",
    ] as const,
  },
  {
    id: "chubu",
    label: "中部",
    prefectures: [
      "新潟県",
      "富山県",
      "石川県",
      "福井県",
      "山梨県",
      "長野県",
      "岐阜県",
      "静岡県",
      "愛知県",
    ] as const,
  },
  {
    id: "kinki",
    label: "近畿",
    prefectures: [
      "三重県",
      "滋賀県",
      "京都府",
      "大阪府",
      "兵庫県",
      "奈良県",
      "和歌山県",
    ] as const,
  },
  {
    id: "chugoku",
    label: "中国",
    prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] as const,
  },
  {
    id: "shikoku",
    label: "四国",
    prefectures: ["徳島県", "香川県", "愛媛県", "高知県"] as const,
  },
  {
    id: "kyushu",
    label: "九州",
    prefectures: [
      "福岡県",
      "佐賀県",
      "長崎県",
      "熊本県",
      "大分県",
      "宮崎県",
      "鹿児島県",
    ] as const,
  },
  { id: "okinawa", label: "沖縄", prefectures: ["沖縄県"] as const },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

export function getRegionIdForPrefecture(prefecture: string): RegionId | "" {
  if (!prefecture) return "";
  const region = REGIONS.find((r) =>
    (r.prefectures as readonly string[]).includes(prefecture)
  );
  return region?.id ?? "";
}

export function getPrefecturesForRegion(regionId: string): readonly string[] {
  if (!regionId) return [];
  const region = REGIONS.find((r) => r.id === regionId);
  return region?.prefectures ?? [];
}

export function isPrefecture(value: string): boolean {
  return (
    value.endsWith("都") || value.endsWith("府") || value.endsWith("県")
  );
}
