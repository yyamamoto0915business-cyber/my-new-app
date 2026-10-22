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

/** チェックポイント到着の確かめ方。GPS は現在地、keyword は現地に掲示した合言葉。 */
export const QUIZ_ARRIVALS = [
  { id: "gps", label: "GPS", blurb: "決めた場所の近くに来ると問題が開きます" },
  { id: "keyword", label: "合言葉", blurb: "現地の看板などにある合言葉を入れると開きます" },
] as const;

export type QuizArrival = (typeof QUIZ_ARRIVALS)[number]["id"];

export const QUIZ_RADIUS_OPTIONS = [30, 50, 100, 200] as const;

export type QuizQuestion = {
  key: string;
  format: QuizFormatId;
  prompt: string;
  category: string;
  imageUrl: string;
  choices: string[];
  correctIndex: number;
  hint: string;
  /** ここから下は「チェックポイント到着」のときだけ使う。 */
  place: string;
  arrival: QuizArrival;
  lat: number | null;
  lng: number | null;
  radius: number;
  keyword: string;
};

const OX_CHOICES = ["○ 正しい", "× 正しくない"];
const FOUR_CHOICES = ["選択肢 A", "選択肢 B", "選択肢 C", "選択肢 D"];

export function quizFormatLabel(format: QuizFormatId): string {
  return QUIZ_FORMATS.find((item) => item.id === format)?.label ?? "4択クイズ";
}

/** 形式を変えたときの問題。○×は選択肢を2つにし、ほかの形式へ戻すときは4つにする。 */
export function changeQuizFormat(question: QuizQuestion, format: QuizFormatId): QuizQuestion {
  if (question.format === format) return question;
  if (format === "ox") {
    return { ...question, format, choices: [...OX_CHOICES], correctIndex: Math.min(question.correctIndex, 1) };
  }
  if (question.format === "ox") {
    return { ...question, format, choices: [...FOUR_CHOICES], correctIndex: 0 };
  }
  return { ...question, format };
}

/** 公開の前に直してほしいこと。なければ null。 */
export function quizQuestionProblem(question: QuizQuestion, number: number): string | null {
  if (!question.prompt.trim()) return `${number}問目の問題文を入れてください`;
  if (question.choices.filter((choice) => choice.trim()).length < 2) {
    return `${number}問目の選択肢を2つ以上入れてください`;
  }
  if (question.format === "photo" && !question.imageUrl.trim()) {
    return `${number}問目は写真クイズです。写真を入れてください`;
  }
  if (question.format === "checkin") {
    if (!question.place.trim()) return `${number}問目のチェックポイントの名前を入れてください`;
    if (question.arrival === "gps" && (question.lat == null || question.lng == null)) {
      return `${number}問目のチェックポイントの場所を地図で決めてください`;
    }
    if (question.arrival === "keyword" && !question.keyword.trim()) {
      return `${number}問目の合言葉を入れてください`;
    }
  }
  return null;
}

export const QUIZ_CATEGORIES = ["歴史・文化", "グルメ", "自然・景観", "まち歩き"] as const;

export const QUIZ_CHECKPOINT_DEFAULTS = {
  place: "",
  arrival: "gps" as QuizArrival,
  lat: null,
  lng: null,
  radius: 50,
  keyword: "",
};

export function createQuizQuestion(index: number, format: QuizFormatId): QuizQuestion {
  const choices = format === "ox" ? [...OX_CHOICES] : [...FOUR_CHOICES];
  return {
    key: crypto.randomUUID(),
    format,
    prompt: "",
    category: QUIZ_CATEGORIES[index % QUIZ_CATEGORIES.length],
    imageUrl: "",
    choices,
    correctIndex: 0,
    hint: "",
    ...QUIZ_CHECKPOINT_DEFAULTS,
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
      ...QUIZ_CHECKPOINT_DEFAULTS,
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
      ...QUIZ_CHECKPOINT_DEFAULTS,
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
      ...QUIZ_CHECKPOINT_DEFAULTS,
    },
  ];
}
