/**
 * アンケートの設定（organizer_games.settings.survey）と、答えの確かめ・集計。
 * 受付中（open）は答えたり直したりでき、締め切る（closed）と答えられなくなる。
 */

export type SurveyQuestionType = "choice" | "multi" | "scale" | "text";
export type SurveyPhase = "open" | "closed";

export type SurveyQuestion = {
  id: string;
  label: string;
  type: SurveyQuestionType;
  required: boolean;
  /** choice / multi の選択肢 */
  options?: string[];
};

export type SurveySettings = {
  questions: SurveyQuestion[];
  /** 答えたあとに出すお礼のことば */
  thanks: string;
  /** 答えた人に、みんなの結果（選択と5段階）を見せるか */
  shareResults: boolean;
  phase: SurveyPhase;
};

/** 答え。choice / text / scale は文字（scale は "1"〜"5"）、multi は文字の配列 */
export type SurveyAnswers = Record<string, string | string[]>;

export const SURVEY_QUESTION_MAX = 10;
export const SURVEY_LABEL_MAX = 80;
export const SURVEY_OPTION_MAX = 8;
export const SURVEY_OPTION_LEN = 30;
export const SURVEY_TEXT_MAX = 500;
export const SURVEY_THANKS_MAX = 200;
export const SURVEY_SCALE_LABELS = ["とても悪い", "悪い", "ふつう", "良い", "とても良い"] as const;

export const SURVEY_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  choice: "1つ選ぶ",
  multi: "いくつでも選ぶ",
  scale: "5段階",
  text: "自由に書く",
};

export const DEFAULT_SURVEY_SETTINGS: SurveySettings = {
  questions: [],
  thanks: "ご協力ありがとうございました！",
  shareResults: false,
  phase: "open",
};

export function newSurveyQuestionId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export function isSurveyPhase(value: unknown): value is SurveyPhase {
  return value === "open" || value === "closed";
}

function isQuestionType(value: unknown): value is SurveyQuestionType {
  return value === "choice" || value === "multi" || value === "scale" || value === "text";
}

/** 保存する前・読んだあとに、いつも同じ形にそろえる。質問文のないものは捨て、選択肢が2つ未満の選択式は自由記述にする */
export function sanitizeSurveySettings(raw: unknown): SurveySettings {
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const seen = new Set<string>();
  const questions: SurveyQuestion[] = [];
  for (const item of Array.isArray(body.questions) ? body.questions : []) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const label = text(row.label, SURVEY_LABEL_MAX);
    if (!label) continue;
    let id = text(row.id, 40).replace(/[^\w-]/g, "");
    if (!id || seen.has(id)) id = newSurveyQuestionId();
    seen.add(id);
    let type: SurveyQuestionType = isQuestionType(row.type) ? row.type : "text";
    let options: string[] | undefined;
    if (type === "choice" || type === "multi") {
      options = [
        ...new Set((Array.isArray(row.options) ? row.options : []).map((o) => text(o, SURVEY_OPTION_LEN)).filter(Boolean)),
      ].slice(0, SURVEY_OPTION_MAX);
      if (options.length < 2) {
        type = "text";
        options = undefined;
      }
    }
    questions.push({ id, label, type, required: row.required === true, ...(options ? { options } : {}) });
    if (questions.length >= SURVEY_QUESTION_MAX) break;
  }
  return {
    questions,
    thanks: typeof body.thanks === "string" ? body.thanks.trim().slice(0, SURVEY_THANKS_MAX) : DEFAULT_SURVEY_SETTINGS.thanks,
    shareResults: body.shareResults === true,
    phase: isSurveyPhase(body.phase) ? body.phase : "open",
  };
}

/** ゲームの settings からアンケートの設定を取り出す。質問がなければ null */
export function readStoredSurvey(settings: unknown): SurveySettings | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const survey = sanitizeSurveySettings((settings as { survey?: unknown }).survey);
  return survey.questions.length > 0 ? survey : null;
}

/** 参加の最初の画面に出す情報 */
export type PublicSurveyIntro = { count: number; phase: SurveyPhase };

export function readPublicSurveyIntro(raw: unknown): PublicSurveyIntro | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as { count?: unknown; phase?: unknown };
  const count = typeof body.count === "number" && body.count > 0 ? Math.floor(body.count) : 0;
  return count > 0 ? { count, phase: isSurveyPhase(body.phase) ? body.phase : "open" } : null;
}

/**
 * 答えを確かめる。必須に答えていない・選択肢にない答えはエラー。質問にない答えは捨てる。
 */
export function validateSurveyAnswers(
  questions: SurveyQuestion[],
  raw: unknown,
): { ok: true; answers: SurveyAnswers } | { ok: false; error: string } {
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const answers: SurveyAnswers = {};
  for (const q of questions) {
    const value = body[q.id];
    if (q.type === "multi") {
      const picked = [...new Set((Array.isArray(value) ? value : []).filter((v): v is string => typeof v === "string"))];
      if (picked.some((v) => !q.options?.includes(v))) return { ok: false, error: `「${q.label}」は選択肢から選んでください` };
      if (picked.length === 0) {
        if (q.required) return { ok: false, error: `「${q.label}」に答えてください` };
        continue;
      }
      // 選択肢の順にそろえる
      answers[q.id] = (q.options ?? []).filter((o) => picked.includes(o));
      continue;
    }
    const str = typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
    if (!str) {
      if (q.required) return { ok: false, error: `「${q.label}」に答えてください` };
      continue;
    }
    if (q.type === "choice" && !q.options?.includes(str)) {
      return { ok: false, error: `「${q.label}」は選択肢から選んでください` };
    }
    if (q.type === "scale" && !/^[1-5]$/.test(str)) {
      return { ok: false, error: `「${q.label}」は1〜5から選んでください` };
    }
    answers[q.id] = q.type === "text" ? str.slice(0, SURVEY_TEXT_MAX) : str;
  }
  return { ok: true, answers };
}

/** 質問ごとの集計 */
export type SurveyTally =
  | { questionId: string; label: string; type: "choice" | "multi"; answered: number; counts: { option: string; count: number }[] }
  | { questionId: string; label: string; type: "scale"; answered: number; counts: number[]; average: number | null }
  | { questionId: string; label: string; type: "text"; answered: number; texts: string[] };

export function tallySurvey(questions: SurveyQuestion[], rows: SurveyAnswers[], textLimit = 200): SurveyTally[] {
  return questions.map((q) => {
    const values = rows.map((r) => r[q.id]).filter((v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));
    if (q.type === "choice" || q.type === "multi") {
      return {
        questionId: q.id,
        label: q.label,
        type: q.type,
        answered: values.length,
        counts: (q.options ?? []).map((option) => ({
          option,
          count: values.filter((v) => (Array.isArray(v) ? v.includes(option) : v === option)).length,
        })),
      };
    }
    if (q.type === "scale") {
      const nums = values.map((v) => Number(v)).filter((n) => n >= 1 && n <= 5);
      const counts = [1, 2, 3, 4, 5].map((n) => nums.filter((x) => x === n).length);
      const average = nums.length > 0 ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
      return { questionId: q.id, label: q.label, type: "scale", answered: nums.length, counts, average };
    }
    const texts = values.filter((v): v is string => typeof v === "string");
    return { questionId: q.id, label: q.label, type: "text", answered: texts.length, texts: texts.slice(-textLimit).reverse() };
  });
}
