/**
 * カテゴリ対応ルール（マッピング）
 * 表示ラベルと内部キーを分離。localStorageには内部キーのみ保存。
 */

export const CATEGORY_KEYS = [
  "study",
  "workshop",
  "community",
  "family",
  "sports",
  "music",
  "food",
  "volunteer",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** 内部キー → 表示ラベル（日本語） */
export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  study: "勉強",
  workshop: "体験",
  community: "交流",
  family: "親子",
  sports: "スポーツ",
  music: "音楽",
  food: "食",
  volunteer: "ボランティア",
};

/** イベントタグID（EVENT_TAGS）→ カテゴリ内部キー */
export const TAG_TO_CATEGORY_KEY: Record<string, CategoryKey> = {
  free: "study",
  kids: "family",
  beginner: "workshop",
  rain_ok: "sports",
  indoor: "community",
  english: "community",
  tourist: "community",
  student: "study",
};

/** カテゴリごとのキーワード（title/description のテキスト照合用） */
export const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  study: ["勉強", "学習", "講座", "セミナー", "勉強会", "もくもく", "LT", "読書会", "研究"],
  workshop: [
    "体験",
    "ワークショップ",
    "教室",
    "参加型",
    "作る",
    "ハンドメイド",
    "陶芸",
    "染め",
    "工作",
  ],
  community: [
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
  family: ["親子", "キッズ", "子ども", "こども", "ファミリー", "子供"],
  sports: [
    "ラン",
    "ヨガ",
    "スポーツ",
    "体操",
    "フットサル",
    "ランニング",
    "ウォーキング",
  ],
  music: ["ライブ", "音楽", "演奏", "フェス", "コンサート", "ライヴ"],
  food: [
    "グルメ",
    "マルシェ",
    "フード",
    "カフェ",
    "料理",
    "食べ",
    "クッキング",
    "パン",
    "フリマ",
    "フリーマーケット",
  ],
  volunteer: [
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
