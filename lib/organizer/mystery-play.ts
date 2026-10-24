import { safeImageUrl, sanitizePlace } from "@/lib/organizer/game-experience";
import { sanitizeMysterySettings } from "@/lib/organizer/mystery";
import type { QuizGate } from "@/lib/organizer/quiz-play";

export type PublicMysteryStep = {
  index: number;
  place: string;
  prompt: string;
  imageUrl: string;
  /** その場所に着いてから開く謎。着くまで、謎の文と写真は空で渡す。 */
  checkpoint?: { place: string; arrival: "gps" | "keyword"; locked: boolean };
  /** マップに出す場所。向かう先なので、着く前から渡す。 */
  lat?: number;
  lng?: number;
};

export type PublicMysteryPlay = {
  needed: number;
  rewards: string[];
  steps: PublicMysteryStep[];
};

export type StoredMysteryStep = PublicMysteryStep & {
  answer: string;
  hint: string;
  /** 着いたことの確かめ（クイズのチェックポイントと同じ）。参加者には渡さない。 */
  gate: QuizGate | null;
  /** マップに出す場所。確かめ方に関係なく、場所を決めた謎はすべて出す。 */
  pin: { lat: number; lng: number } | null;
};

export type StoredMysteryPlay = {
  needed: number;
  /** クーポン・景品引換。どちらかがあれば、クリアした人に引き換えコードを出す。 */
  couponOn: boolean;
  prizeOn: boolean;
  rewards: string[];
  steps: StoredMysteryStep[];
};

function mysteryImage(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw.startsWith("/") && !raw.includes("..") && !raw.includes("\\")) return raw.slice(0, 300);
  return safeImageUrl(raw, 300);
}

export function readStoredMystery(settings: unknown): StoredMysteryPlay | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const mystery = sanitizeMysterySettings((settings as { mystery?: unknown }).mystery);
  if (!mystery) return null;
  const steps = mystery.steps.flatMap((step) => {
    if (!step.published || !step.prompt || !step.answer) return [];
    const pin = sanitizePlace(step.lat, step.lng);
    let gate: QuizGate | null = null;
    if (step.arrival === "keyword" && step.keyword) {
      gate = { arrival: "keyword", place: step.place, keyword: step.keyword };
    } else if (step.arrival === "gps" && pin) {
      gate = { arrival: "gps", place: step.place, ...pin, radiusM: step.radius };
    }
    return [
      {
        place: step.place,
        prompt: step.prompt,
        imageUrl: mysteryImage(step.imageUrl),
        answer: step.answer,
        hint: step.hint,
        gate,
        pin,
      },
    ];
  });
  if (steps.length === 0) return null;
  // 参加者のクリア画面に出す文。名前を書いていれば、その中身を出す。
  const rewards = [
    mystery.couponOn
      ? mystery.couponName
        ? `クーポン：${mystery.couponName}${mystery.couponDetail ? `（${mystery.couponDetail}）` : ""}`
        : "クーポンを受け取れます。"
      : "",
    mystery.prizeOn
      ? mystery.prizeName
        ? `景品：${mystery.prizeName}${mystery.prizePlace ? `（受け取り場所：${mystery.prizePlace}）` : ""}`
        : "景品を受け取れます。"
      : "",
  ].filter(Boolean);
  return {
    needed: Math.min(steps.length, Math.max(1, mystery.clearCount)),
    couponOn: mystery.couponOn,
    prizeOn: mystery.prizeOn,
    rewards,
    steps: steps.map((step, index) => ({ ...step, index })),
  };
}

/** 参加者に渡す1つの謎。opened でなければ、着いて開く謎は中身を隠す。 */
export function publicMysteryStep(step: StoredMysteryStep, opened = false): PublicMysteryStep {
  const { index, place, prompt, imageUrl, gate } = step;
  // 場所は向かう先なので、着く前から渡す（マップに出すため）。
  const pin = step.pin ? { lat: step.pin.lat, lng: step.pin.lng } : {};
  if (!gate) return { index, place, prompt, imageUrl, ...pin };
  const checkpoint = { place: gate.place, arrival: gate.arrival, locked: !opened };
  if (opened) return { index, place, prompt, imageUrl, checkpoint, ...pin };
  return { index, place, prompt: "", imageUrl: "", checkpoint, ...pin };
}

export function publicMystery(play: StoredMysteryPlay): PublicMysteryPlay {
  return {
    needed: play.needed,
    rewards: play.rewards,
    steps: play.steps.map((step) => publicMysteryStep(step)),
  };
}

export function readPublicMystery(raw: unknown): PublicMysteryPlay | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const steps = Array.isArray(body.steps)
    ? body.steps.flatMap((item): PublicMysteryStep[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const prompt = typeof row.prompt === "string" ? row.prompt.trim() : "";
        const index = typeof row.index === "number" ? Math.round(row.index) : -1;
        const cp = row.checkpoint && typeof row.checkpoint === "object" ? (row.checkpoint as Record<string, unknown>) : null;
        const checkpoint = cp
          ? {
              place: typeof cp.place === "string" ? cp.place : "",
              arrival: (cp.arrival === "keyword" ? "keyword" : "gps") as "gps" | "keyword",
              locked: cp.locked === true,
            }
          : undefined;
        if (index < 0 || (!prompt && !checkpoint?.locked)) return [];
        return [
          {
            index,
            place: typeof row.place === "string" ? row.place : "",
            prompt,
            imageUrl: mysteryImage(row.imageUrl),
            ...(checkpoint ? { checkpoint } : {}),
            ...(typeof row.lat === "number" && typeof row.lng === "number" && Number.isFinite(row.lat) && Number.isFinite(row.lng)
              ? { lat: row.lat, lng: row.lng }
              : {}),
          },
        ];
      })
    : [];
  if (steps.length === 0) return null;
  const neededRaw = typeof body.needed === "number" ? Math.round(body.needed) : steps.length;
  const rewards = Array.isArray(body.rewards)
    ? body.rewards.filter((line): line is string => typeof line === "string" && line.trim().length > 0)
    : [];
  return {
    needed: Math.min(steps.length, Math.max(1, neededRaw)),
    rewards,
    steps,
  };
}

export function normalizeMysterySolved(value: unknown, total: number): number[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<number>();
  for (const item of value) {
    if (typeof item !== "number" || !Number.isInteger(item)) continue;
    if (item < 0 || item >= total) continue;
    set.add(item);
  }
  return [...set].sort((left, right) => left - right);
}

export function nextMysteryIndex(solved: number[], total: number): number | null {
  for (let index = 0; index < total; index += 1) {
    if (!solved.includes(index)) return index;
  }
  return null;
}
