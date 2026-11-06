/**
 * 抽選ゲームの設定（organizer_games.settings.lottery）。
 * 段階は「受付中 → 結果発表」で、主催者が切りかえる。抽選は受付中でもできるが、
 * 参加者に当たり・はずれが見えるのは結果発表にしてから。
 */

export type LotteryPhase = "entry" | "result";

export type LotteryPrize = {
  /** 賞の名前（例：1等 商品券3,000円分） */
  label: string;
  /** 当選する人数 */
  count: number;
};

export type LotterySettings = {
  prizes: LotteryPrize[];
  /** 当選した人に見せる案内（例：受付で番号を見せてください） */
  winnerMessage: string;
  phase: LotteryPhase;
};

export const LOTTERY_PRIZE_MAX = 10;
export const LOTTERY_PRIZE_LABEL_MAX = 60;
export const LOTTERY_PRIZE_COUNT_MAX = 100;
export const LOTTERY_MESSAGE_MAX = 200;

export const DEFAULT_LOTTERY_SETTINGS: LotterySettings = {
  prizes: [{ label: "", count: 1 }],
  winnerMessage: "",
  phase: "entry",
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function isLotteryPhase(value: unknown): value is LotteryPhase {
  return value === "entry" || value === "result";
}

/** 保存する前・読んだあとに、いつも同じ形にそろえる。名前のない賞は捨てる */
export function sanitizeLotterySettings(raw: unknown): LotterySettings {
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const prizes = (Array.isArray(body.prizes) ? body.prizes : [])
    .map((p) => {
      const row = p && typeof p === "object" ? (p as Record<string, unknown>) : {};
      return {
        label: typeof row.label === "string" ? row.label.replace(/\s+/g, " ").trim().slice(0, LOTTERY_PRIZE_LABEL_MAX) : "",
        count: clampInt(row.count, 1, LOTTERY_PRIZE_COUNT_MAX, 1),
      };
    })
    .filter((p) => p.label)
    .slice(0, LOTTERY_PRIZE_MAX);
  return {
    prizes,
    winnerMessage:
      typeof body.winnerMessage === "string" ? body.winnerMessage.trim().slice(0, LOTTERY_MESSAGE_MAX) : "",
    phase: isLotteryPhase(body.phase) ? body.phase : "entry",
  };
}

/** ゲームの settings から抽選の設定を取り出す。賞がなければ null */
export function readStoredLottery(settings: unknown): LotterySettings | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const lottery = sanitizeLotterySettings((settings as { lottery?: unknown }).lottery);
  return lottery.prizes.length > 0 ? lottery : null;
}

/** 当選する人数の合計 */
export function lotteryWinnerTotal(prizes: LotteryPrize[]): number {
  return prizes.reduce((sum, p) => sum + p.count, 0);
}

/** 参加の最初の画面に出す情報（賞の一覧と段階） */
export type PublicLotteryIntro = { prizes: LotteryPrize[]; phase: LotteryPhase };

export function readPublicLotteryIntro(raw: unknown): PublicLotteryIntro | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const s = sanitizeLotterySettings(raw);
  return s.prizes.length > 0 ? { prizes: s.prizes, phase: s.phase } : null;
}

/**
 * 候補の中から n 人をランダムに選ぶ（かたよりのないシャッフル）。
 * random は 0 以上 1 未満を返す関数（テストのときに差しかえられるように）。
 */
export function pickRandom<T>(items: readonly T[], n: number, random: () => number = Math.random): T[] {
  const pool = [...items];
  const count = Math.min(Math.max(0, n), pool.length);
  for (let i = 0; i < count; i += 1) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
