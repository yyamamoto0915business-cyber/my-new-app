import { safeImageUrl } from "@/lib/organizer/game-experience";

export type PublicQuizQuestion = {
  index: number;
  prompt: string;
  category: string;
  imageUrl: string;
  choices: string[];
};

export type PublicQuiz = {
  clearCount: number;
  rewards: string[];
  questions: PublicQuizQuestion[];
};

export type StoredQuizQuestion = PublicQuizQuestion & {
  correctIndex: number;
  hint: string;
};

export type StoredQuiz = {
  clearCount: number;
  couponOn: boolean;
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
        return [
          {
            index: 0,
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
  const rewards = [
    rewardsRaw.coupon === true ? "クーポンを受け取れます。" : "",
    rewardsRaw.prize === true ? "景品と引き換えできます。" : "",
    rewardsRaw.ranking === true ? "順位は、結果の画面で見られます。" : "",
  ].filter(Boolean);
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : questions.length;
  return {
    clearCount: Math.min(questions.length, Math.max(1, clearRaw)),
    couponOn: rewardsRaw.coupon === true,
    rankingOn: rewardsRaw.ranking === true,
    rewards,
    questions,
  };
}

/** 先にクリアした人が上。同時なら id の順で固定する。 */
export function quizFinishRank(
  rows: { id: string; clearedAt: string }[],
  playerId: string,
  clearedAt: string,
): number {
  const mine = Date.parse(clearedAt);
  if (Number.isNaN(mine)) return 1;
  let ahead = 0;
  for (const row of rows) {
    if (row.id === playerId) continue;
    const at = Date.parse(row.clearedAt);
    if (Number.isNaN(at)) continue;
    if (at < mine || (at === mine && row.id < playerId)) ahead += 1;
  }
  return ahead + 1;
}

export function publicQuiz(quiz: StoredQuiz): PublicQuiz {
  return {
    clearCount: quiz.clearCount,
    rewards: quiz.rewards,
    questions: quiz.questions.map(({ index, prompt, category, imageUrl, choices }) => ({
      index,
      prompt,
      category,
      imageUrl,
      choices,
    })),
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
        if (!prompt || choices.length < 2 || index < 0) return [];
        return [
          {
            index,
            prompt,
            category: typeof row.category === "string" ? row.category : "",
            imageUrl: quizImage(row.imageUrl),
            choices,
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
