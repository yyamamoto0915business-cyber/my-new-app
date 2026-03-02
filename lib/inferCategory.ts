import type { Event } from "./db/types";

export const CATEGORY_KEYS = [
  "勉強",
  "体験",
  "交流",
  "親子",
  "スポーツ",
  "音楽",
  "食",
  "ボランティア",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** カテゴリごとのキーワード（title/tags/description で照合） */
const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  勉強: ["勉強", "学習", "講座", "セミナー", "勉強会", "もくもく", "LT", "読書会", "研究"],
  体験: [
    "体験",
    "ワークショップ",
    "教室",
    "参加型",
    "作る",
    "ハンドメイド",
    "陶芸",
    "染め",
  ],
  交流: [
    "交流",
    "友達",
    "つながり",
    "ネットワーク",
    "meetup",
    "懇親",
    "飲み会",
    "交流会",
    "マッチング",
  ],
  親子: ["親子", "キッズ", "子ども", "こども", "ファミリー", "kids"],
  スポーツ: ["ラン", "ヨガ", "スポーツ", "体操", "フットサル", "ランニング", "ウォーキング"],
  音楽: ["ライブ", "音楽", "演奏", "フェス", "コンサート", "ライヴ"],
  食: ["食", "グルメ", "マルシェ", "フード", "カフェ", "料理", "クッキング", "パン"],
  ボランティア: [
    "ボランティア",
    "手伝い",
    "サポート",
    "受付",
    "設営",
    "清掃",
    "募金",
    "支援",
  ],
};

/** タグIDとカテゴリの対応 */
const TAG_TO_CATEGORY: Record<string, CategoryKey> = {
  free: "勉強",
  kids: "親子",
  beginner: "体験",
  rain_ok: "スポーツ",
  indoor: "交流",
  english: "交流",
  tourist: "交流",
  student: "勉強",
};

function matchesKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * イベントからカテゴリを推定する（title / tags / description の文字で照合）
 * 戻り値は推定されたカテゴリの配列（先頭が主カテゴリ）
 */
export function inferCategory(event: Event): CategoryKey[] {
  const result: CategoryKey[] = [];
  const text = [
    event.title,
    event.description ?? "",
    (event.tags ?? []).join(" "),
  ].join(" ");

  // タグからの推定を優先
  for (const tag of event.tags ?? []) {
    const cat = TAG_TO_CATEGORY[tag];
    if (cat && !result.includes(cat)) result.push(cat);
  }

  // キーワード照合
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    CategoryKey,
    string[],
  ][]) {
    if (result.includes(cat)) continue;
    if (matchesKeyword(text, keywords)) result.push(cat);
  }

  return result;
}

/** 表示用：推定カテゴリの先頭1つ（バッジ用） */
export function getPrimaryCategory(event: Event): CategoryKey | null {
  const cats = inferCategory(event);
  return cats[0] ?? null;
}

/** イベントが選択カテゴリに一致するか（空配列=すべて一致） */
export function eventMatchesCategory(
  event: Event,
  selectedCategories: CategoryKey[]
): boolean {
  if (selectedCategories.length === 0) return true;
  const eventCats = inferCategory(event);
  return selectedCategories.some((c) => eventCats.includes(c));
}

/** カテゴリでフィルタ（優先順位補完用） */
export function filterEventsByCategory(
  events: Event[],
  selectedCategories: CategoryKey[]
): Event[] {
  if (selectedCategories.length === 0) return events;
  return events.filter((e) => eventMatchesCategory(e, selectedCategories));
}
