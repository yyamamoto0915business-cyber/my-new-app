import { safeImageUrl } from "@/lib/organizer/game-experience";
import { sanitizeMysterySettings } from "@/lib/organizer/mystery";

export type PublicMysteryStep = {
  index: number;
  place: string;
  prompt: string;
  imageUrl: string;
};

export type PublicMysteryPlay = {
  needed: number;
  rewards: string[];
  steps: PublicMysteryStep[];
};

export type StoredMysteryStep = PublicMysteryStep & {
  answer: string;
  hint: string;
};

export type StoredMysteryPlay = {
  needed: number;
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
    return [
      {
        place: step.place,
        prompt: step.prompt,
        imageUrl: mysteryImage(step.imageUrl),
        answer: step.answer,
        hint: step.hint,
      },
    ];
  });
  if (steps.length === 0) return null;
  const rewards = [
    mystery.couponOn ? "クーポンを受け取れます。" : "",
    mystery.prizeOn ? "景品を受け取れます。" : "",
  ].filter(Boolean);
  return {
    needed: Math.min(steps.length, Math.max(1, mystery.clearCount)),
    rewards,
    steps: steps.map((step, index) => ({ ...step, index })),
  };
}

export function publicMystery(play: StoredMysteryPlay): PublicMysteryPlay {
  return {
    needed: play.needed,
    rewards: play.rewards,
    steps: play.steps.map(({ answer: _answer, hint: _hint, ...step }) => step),
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
        if (!prompt || index < 0) return [];
        return [
          {
            index,
            place: typeof row.place === "string" ? row.place : "",
            prompt,
            imageUrl: mysteryImage(row.imageUrl),
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
