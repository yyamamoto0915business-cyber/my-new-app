import { safeImageUrl, sanitizePlace } from "@/lib/organizer/game-experience";
import { QUIZ_FORMAT_IDS, type QuizArrival, type QuizFormatId } from "@/lib/organizer/quiz";

export type PublicQuizQuestion = {
  index: number;
  format: QuizFormatId;
  prompt: string;
  category: string;
  imageUrl: string;
  choices: string[];
  /** チェックポイント到着の問題。着くまで、問題文・選択肢・写真は空で渡す。 */
  checkpoint?: { place: string; arrival: QuizArrival; locked: boolean };
};

export type PublicQuiz = {
  clearCount: number;
  rewards: string[];
  questions: PublicQuizQuestion[];
};

export type StoredQuizQuestion = PublicQuizQuestion & {
  correctIndex: number;
  hint: string;
  /** チェックポイント到着の確かめに使う。参加者には渡さない。 */
  gate: QuizGate | null;
};

export type QuizGate =
  | { arrival: "gps"; place: string; lat: number; lng: number; radiusM: number }
  | { arrival: "keyword"; place: string; keyword: string };

function readFormat(value: unknown): QuizFormatId {
  return typeof value === "string" && (QUIZ_FORMAT_IDS as readonly string[]).includes(value)
    ? (value as QuizFormatId)
    : "choice";
}

/** 到着の確かめ方。場所や合言葉が足りなければ、確かめずに出す（null）。 */
function readGate(row: Record<string, unknown>): QuizGate | null {
  const place = typeof row.place === "string" ? row.place.trim().slice(0, 40) : "";
  if (row.arrival === "keyword") {
    const keyword = typeof row.keyword === "string" ? row.keyword.trim().slice(0, 40) : "";
    return keyword ? { arrival: "keyword", place, keyword } : null;
  }
  const spot = sanitizePlace(row.lat, row.lng);
  if (!spot) return null;
  const radiusRaw = typeof row.radius === "number" ? Math.round(row.radius) : 50;
  return { arrival: "gps", place, ...spot, radiusM: Math.min(500, Math.max(20, radiusRaw)) };
}

export type StoredQuiz = {
  clearCount: number;
  couponOn: boolean;
  /** 景品引換。クーポンと同じく、クリアした人に引き換えコードを出す。 */
  prizeOn: boolean;
  rankingOn: boolean;
  rewards: string[];
  questions: StoredQuizQuestion[];
};

function quizImage(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw.startsWith("/") && !raw.includes("..") && !raw.includes("\\")) return raw.slice(0, 300);
  return safeImageUrl(raw, 300);
}

export function readStoredQuiz(settings: unknown): StoredQuiz | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const quiz = (settings as { quiz?: unknown }).quiz;
  if (!quiz || typeof quiz !== "object" || Array.isArray(quiz)) return null;
  const body = quiz as Record<string, unknown>;
  const questions = Array.isArray(body.questions)
    ? body.questions.slice(0, 40).flatMap((item): StoredQuizQuestion[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const prompt = typeof row.prompt === "string" ? row.prompt.trim().slice(0, 200) : "";
        const choices = Array.isArray(row.choices)
          ? row.choices
              .filter((choice): choice is string => typeof choice === "string")
              .map((choice) => choice.trim().slice(0, 40))
              .slice(0, 6)
          : [];
        if (!prompt || choices.length < 2) return [];
        const correctRaw = typeof row.correctIndex === "number" ? Math.round(row.correctIndex) : 0;
        const format = readFormat(row.format);
        const gate = format === "checkin" ? readGate(row) : null;
        return [
          {
            index: 0,
            format,
            gate,
            prompt,
            category: typeof row.category === "string" ? row.category.trim().slice(0, 24) : "",
            imageUrl: quizImage(row.imageUrl),
            choices,
            correctIndex: Math.min(Math.max(correctRaw, 0), choices.length - 1),
            hint: typeof row.hint === "string" ? row.hint.trim().slice(0, 80) : "",
          },
        ];
      })
        .map((question, index) => ({ ...question, index }))
    : [];
  if (questions.length === 0) return null;
  const rewardsRaw =
    body.rewards && typeof body.rewards === "object" ? (body.rewards as Record<string, unknown>) : {};
  const line = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const couponName = line(rewardsRaw.couponName, 40);
  const couponDetail = line(rewardsRaw.couponDetail, 80);
  const prizeName = line(rewardsRaw.prizeName, 40);
  const prizePlace = line(rewardsRaw.prizePlace, 60);
  // 参加者のクリア画面に出す文。名前を書いていれば、その中身を出す。
  const rewards = [
    rewardsRaw.coupon === true
      ? couponName
        ? `クーポン：${couponName}${couponDetail ? `（${couponDetail}）` : ""}`
        : "クーポンを受け取れます。"
      : "",
    rewardsRaw.prize === true
      ? prizeName
        ? `景品：${prizeName}${prizePlace ? `（受け取り場所：${prizePlace}）` : ""}`
        : "景品と引き換えできます。"
      : "",
    rewardsRaw.ranking === true ? "順位は、結果の画面で見られます。" : "",
  ].filter(Boolean);
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : questions.length;
  return {
    clearCount: Math.min(questions.length, Math.max(1, clearRaw)),
    couponOn: rewardsRaw.coupon === true,
    prizeOn: rewardsRaw.prize === true,
    rankingOn: rewardsRaw.ranking === true,
    rewards,
    questions,
  };
}

/** 正解数が多い人が上。同じ数なら先にクリアした人、それも同じなら id の順で固定する。 */
export function quizFinishRank(
  rows: { id: string; clearedAt: string; solved?: number }[],
  playerId: string,
  clearedAt: string,
  solved = 0,
): number {
  const mine = Date.parse(clearedAt);
  if (Number.isNaN(mine)) return 1;
  let ahead = 0;
  for (const row of rows) {
    if (row.id === playerId) continue;
    const at = Date.parse(row.clearedAt);
    if (Number.isNaN(at)) continue;
    const theirs = row.solved ?? 0;
    if (theirs > solved) ahead += 1;
    else if (theirs === solved && (at < mine || (at === mine && row.id < playerId))) ahead += 1;
  }
  return ahead + 1;
}

/** 参加者に渡す1問。opened でなければ、チェックポイントの問題は中身を隠す。 */
export function publicQuizQuestion(question: StoredQuizQuestion, opened = false): PublicQuizQuestion {
  const { index, format, prompt, category, imageUrl, choices, gate } = question;
  if (!gate) return { index, format, prompt, category, imageUrl, choices };
  const checkpoint = { place: gate.place, arrival: gate.arrival, locked: !opened };
  if (opened) return { index, format, prompt, category, imageUrl, choices, checkpoint };
  return { index, format, prompt: "", category, imageUrl: "", choices: [], checkpoint };
}

export function publicQuiz(quiz: StoredQuiz): PublicQuiz {
  return {
    clearCount: quiz.clearCount,
    rewards: quiz.rewards,
    questions: quiz.questions.map((question) => publicQuizQuestion(question)),
  };
}

function readCheckpoint(raw: unknown): PublicQuizQuestion["checkpoint"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const row = raw as Record<string, unknown>;
  return {
    place: typeof row.place === "string" ? row.place : "",
    arrival: row.arrival === "keyword" ? "keyword" : "gps",
    locked: row.locked === true,
  };
}

export function readPublicQuiz(raw: unknown): PublicQuiz | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const questions = Array.isArray(body.questions)
    ? body.questions.flatMap((item): PublicQuizQuestion[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const prompt = typeof row.prompt === "string" ? row.prompt.trim() : "";
        const choices = Array.isArray(row.choices)
          ? row.choices.filter((choice): choice is string => typeof choice === "string" && choice.trim().length > 0)
          : [];
        const index = typeof row.index === "number" ? Math.round(row.index) : -1;
        const checkpoint = readCheckpoint(row.checkpoint);
        if (index < 0) return [];
        if (!checkpoint?.locked && (!prompt || choices.length < 2)) return [];
        return [
          {
            index,
            format: readFormat(row.format),
            prompt,
            category: typeof row.category === "string" ? row.category : "",
            imageUrl: quizImage(row.imageUrl),
            choices,
            ...(checkpoint ? { checkpoint } : {}),
          },
        ];
      })
    : [];
  if (questions.length === 0) return null;
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : questions.length;
  const rewards = Array.isArray(body.rewards)
    ? body.rewards.filter((line): line is string => typeof line === "string" && line.trim().length > 0)
    : [];
  return {
    clearCount: Math.min(questions.length, Math.max(1, clearRaw)),
    rewards,
    questions,
  };
}

export function normalizeQuizSolved(value: unknown, total: number): number[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<number>();
  for (const item of value) {
    if (typeof item !== "number" || !Number.isInteger(item)) continue;
    if (item < 0 || item >= total) continue;
    set.add(item);
  }
  return [...set].sort((left, right) => left - right);
}
