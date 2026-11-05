/**
 * イベントの申し込みで主催者が聞く質問（events.application_questions）と、
 * 申し込んだ人の答え（event_participants.answers）。
 */

export type EventQuestionType = "text" | "select";

export type EventQuestion = {
  id: string;
  label: string;
  type: EventQuestionType;
  required: boolean;
  /** 選択式のときの選択肢 */
  options?: string[];
};

export type EventAnswers = Record<string, string>;

export const EVENT_QUESTION_MAX = 5;
export const EVENT_QUESTION_LABEL_MAX = 60;
export const EVENT_QUESTION_OPTION_MAX = 8;
export const EVENT_QUESTION_OPTION_LEN = 30;
export const EVENT_ANSWER_MAX = 300;

/** よく使う質問（作成画面で押すだけで足せる） */
export const EVENT_QUESTION_PRESETS: Omit<EventQuestion, "id">[] = [
  { label: "アレルギーや、気をつけてほしいことはありますか？", type: "text", required: false },
  { label: "参加する人数を教えてください", type: "select", required: true, options: ["1人", "2人", "3人", "4人以上"] },
  { label: "何で知りましたか？", type: "select", required: false, options: ["MachiGlyph", "SNS", "チラシ・ポスター", "知り合いから", "その他"] },
  { label: "主催者に伝えたいことがあれば、どうぞ", type: "text", required: false },
];

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export function newEventQuestionId(): string {
  return `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 保存する前・読んだあとに、いつも同じ形にそろえる。質問文がないものは捨てる */
export function sanitizeEventQuestions(raw: unknown): EventQuestion[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: EventQuestion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const label = text(row.label, EVENT_QUESTION_LABEL_MAX);
    if (!label) continue;
    let id = text(row.id, 40).replace(/[^\w-]/g, "");
    if (!id || seen.has(id)) id = newEventQuestionId();
    seen.add(id);
    const type: EventQuestionType = row.type === "select" ? "select" : "text";
    const options =
      type === "select" && Array.isArray(row.options)
        ? [...new Set(row.options.map((o) => text(o, EVENT_QUESTION_OPTION_LEN)).filter(Boolean))].slice(
            0,
            EVENT_QUESTION_OPTION_MAX,
          )
        : undefined;
    // 選択肢が2つ未満の選択式は、自由記述にする
    if (type === "select" && (!options || options.length < 2)) {
      out.push({ id, label, type: "text", required: row.required === true });
    } else {
      out.push({ id, label, type, required: row.required === true, ...(options ? { options } : {}) });
    }
    if (out.length >= EVENT_QUESTION_MAX) break;
  }
  return out;
}

/**
 * 申し込みの答えを確かめる。必須の質問に答えていない・選択肢にない答えはエラー。
 * 質問にない答えは捨てる。
 */
export function validateEventAnswers(
  questions: EventQuestion[],
  raw: unknown,
): { ok: true; answers: EventAnswers | null } | { ok: false; error: string } {
  if (questions.length === 0) return { ok: true, answers: null };
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const answers: EventAnswers = {};
  for (const q of questions) {
    const value = typeof body[q.id] === "string" ? (body[q.id] as string).trim().slice(0, EVENT_ANSWER_MAX) : "";
    if (!value) {
      if (q.required) return { ok: false, error: `「${q.label}」に答えてください` };
      continue;
    }
    if (q.type === "select" && !q.options?.includes(value)) {
      return { ok: false, error: `「${q.label}」は選択肢から選んでください` };
    }
    answers[q.id] = value;
  }
  return { ok: true, answers: Object.keys(answers).length > 0 ? answers : null };
}

/** 答えを「質問：答え」の並びにする（主催者の一覧・CSV 用） */
export function formatEventAnswers(
  questions: EventQuestion[],
  answers: unknown,
): { label: string; value: string }[] {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return [];
  const body = answers as Record<string, unknown>;
  return questions.flatMap((q) => {
    const value = typeof body[q.id] === "string" ? (body[q.id] as string) : "";
    return value ? [{ label: q.label, value }] : [];
  });
}

/** Stripe の metadata（値は500文字まで）に答えを入れる。キーは q_質問のid */
export function answersToStripeMetadata(answers: EventAnswers | null): Record<string, string> {
  if (!answers) return {};
  return Object.fromEntries(Object.entries(answers).map(([id, value]) => [`q_${id}`, value.slice(0, 480)]));
}

/** Stripe の metadata から答えを取り出す */
export function answersFromStripeMetadata(meta: Record<string, string> | null | undefined): EventAnswers | null {
  if (!meta) return null;
  const answers: EventAnswers = {};
  for (const [key, value] of Object.entries(meta)) {
    if (key.startsWith("q_") && typeof value === "string" && value) answers[key.slice(2)] = value;
  }
  return Object.keys(answers).length > 0 ? answers : null;
}
