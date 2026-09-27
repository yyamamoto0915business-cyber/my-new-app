export const QUIZ_FORMAT_IDS = ["choice", "ox", "photo", "checkin"] as const;

export type QuizFormatId = (typeof QUIZ_FORMAT_IDS)[number];

export const QUIZ_FORMATS: {
  id: QuizFormatId;
  label: string;
  blurb: string;
}[] = [
  { id: "choice", label: "4択クイズ", blurb: "4つの選択肢から1つを選ぶ定番の形式" },
  { id: "ox", label: "○×クイズ", blurb: "○か×で答えるシンプルな形式" },
  { id: "photo", label: "写真クイズ", blurb: "写真を見て答える視覚的なクイズ" },
  { id: "checkin", label: "チェックポイント到着", blurb: "特定のスポットに行くとクイズが表示されます" },
];

export type QuizQuestion = {
  key: string;
  format: QuizFormatId;
  prompt: string;
  category: string;
  imageUrl: string;
  choices: string[];
  correctIndex: number;
  hint: string;
};

export const QUIZ_CATEGORIES = ["歴史・文化", "グルメ", "自然・景観", "まち歩き"] as const;

export function createQuizQuestion(index: number, format: QuizFormatId): QuizQuestion {
  const choices =
    format === "ox" ? ["○ 正しい", "× 正しくない"] : ["選択肢 A", "選択肢 B", "選択肢 C", "選択肢 D"];
  return {
    key: crypto.randomUUID(),
    format,
    prompt: "",
    category: QUIZ_CATEGORIES[index % QUIZ_CATEGORIES.length],
    imageUrl: "",
    choices,
    correctIndex: 0,
    hint: "",
  };
}

export function sampleQuizQuestions(): QuizQuestion[] {
  return [
    {
      key: crypto.randomUUID(),
      format: "choice",
      prompt: "この市のシンボルでもある「みらい塔」は、何時代に築かれたとされていますか？",
      category: "歴史・文化",
      imageUrl: "/profile/album/spring/town.jpg",
      choices: ["奈良時代", "江戸時代", "明治時代", "昭和"],
      correctIndex: 1,
      hint: "城下町として栄えた時代です。",
    },
    {
      key: crypto.randomUUID(),
      format: "choice",
      prompt: "この商店街で名物として親しまれているご当地グルメはどれでしょう？",
      category: "グルメ",
      imageUrl: "/profile/album/spring/cafe.jpg",
      choices: ["みらい焼き", "さくらまんじゅう", "まちのコロッケ", "ゆずソフトクリーム"],
      correctIndex: 0,
      hint: "地元の食材を使った、もちもちの焼き菓子です。",
    },
    {
      key: crypto.randomUUID(),
      format: "choice",
      prompt: "「みどりの丘公園」から見える山の名前は何でしょう？",
      category: "自然・景観",
      imageUrl: "/profile/album/spring/river.jpg",
      choices: ["富士山", "高尾山", "さくら山", "筑波山"],
      correctIndex: 2,
      hint: "春に桜がきれいな、まちのシンボルの山です。",
    },
  ];
}
