/** 投稿の「行った日」（任意の期間）。フィードの投稿日時とは別。 */

export const POST_VISITED_MAX_DAYS = 90;

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const TZ = "Asia/Tokyo";

export type VisitedRange = {
  visitedFrom: string | null;
  visitedTo: string | null;
};

type YmdParts = { y: number; m: number; d: number };

function parseYmdParts(ymd: string): YmdParts {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

export function isValidYmd(value: string): boolean {
  if (!YMD_RE.test(value)) return false;
  const { y, m, d } = parseYmdParts(value);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** DB の DATE / ISO から YYYY-MM-DD を取り出す */
export function ymdFromDb(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  return isValidYmd(match[1]) ? match[1] : null;
}

export function todayYmdTokyo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function addDaysYmd(ymd: string, days: number): string {
  const { y, m, d } = parseYmdParts(ymd);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return [
    dt.getUTCFullYear(),
    String(dt.getUTCMonth() + 1).padStart(2, "0"),
    String(dt.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function daysBetweenYmd(from: string, to: string): number {
  const a = parseYmdParts(from);
  const b = parseYmdParts(to);
  const t0 = Date.UTC(a.y, a.m - 1, a.d);
  const t1 = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((t1 - t0) / 86_400_000);
}

/** 終了日入力の上限（今日と開始+90日の早い方） */
export function visitedToMaxYmd(from: string, today: string = todayYmdTokyo()): string {
  const cap = addDaysYmd(from, POST_VISITED_MAX_DAYS);
  return cap < today ? cap : today;
}

function asYmd(value: unknown): string | null | "invalid" {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return "invalid";
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isValidYmd(trimmed) ? trimmed : "invalid";
}

export type ParseVisitedRangeResult =
  | { ok: true; visitedFrom: string | null; visitedTo: string | null }
  | { ok: false; error: string };

/** API / フォームから期間を正規化する */
export function parseVisitedRangeInput(
  fromValue: unknown,
  toValue: unknown,
  now: Date = new Date(),
): ParseVisitedRangeResult {
  const from = asYmd(fromValue);
  const to = asYmd(toValue);
  if (from === "invalid" || to === "invalid") {
    return { ok: false, error: "日付の形式が正しくありません" };
  }
  if (to && !from) {
    return { ok: false, error: "開始日を入力してください" };
  }
  if (!from) {
    return { ok: true, visitedFrom: null, visitedTo: null };
  }

  const today = todayYmdTokyo(now);
  if (from > today) {
    return { ok: false, error: "未来の日付は指定できません" };
  }
  if (to && to > today) {
    return { ok: false, error: "未来の日付は指定できません" };
  }
  if (to && to < from) {
    return { ok: false, error: "終了日は開始日以降にしてください" };
  }
  if (to && daysBetweenYmd(from, to) > POST_VISITED_MAX_DAYS) {
    return {
      ok: false,
      error: `期間は${POST_VISITED_MAX_DAYS}日以内にしてください`,
    };
  }

  return {
    ok: true,
    visitedFrom: from,
    visitedTo: to && to !== from ? to : null,
  };
}

/** アルバムの年・季節・月に使う日時（訪問開始日、なければ投稿日時） */
export function albumDateIso(
  visitedFrom: string | null | undefined,
  createdAt: string,
): string {
  if (visitedFrom && isValidYmd(visitedFrom)) {
    return `${visitedFrom}T00:00:00+09:00`;
  }
  return createdAt;
}

export function formatVisitedDot(
  from: string,
  to?: string | null,
): string {
  const a = parseYmdParts(from);
  const fromStr = `${a.y}.${String(a.m).padStart(2, "0")}.${String(a.d).padStart(2, "0")}`;
  if (!to || to === from) return fromStr;
  const b = parseYmdParts(to);
  if (a.y === b.y) {
    return `${fromStr}〜${String(b.m).padStart(2, "0")}.${String(b.d).padStart(2, "0")}`;
  }
  return `${fromStr}〜${b.y}.${String(b.m).padStart(2, "0")}.${String(b.d).padStart(2, "0")}`;
}

export function formatVisitedJa(from: string, to?: string | null): string {
  const a = parseYmdParts(from);
  const fromStr = `${a.y}年${a.m}月${a.d}日`;
  if (!to || to === from) return fromStr;
  const b = parseYmdParts(to);
  if (a.y === b.y && a.m === b.m) return `${fromStr}〜${b.d}日`;
  if (a.y === b.y) return `${fromStr}〜${b.m}月${b.d}日`;
  return `${fromStr}〜${b.y}年${b.m}月${b.d}日`;
}

export function formatVisitedSlash(from: string, to?: string | null): string {
  const a = parseYmdParts(from);
  const fromStr = `${a.y}/${a.m}/${a.d}`;
  if (!to || to === from) return fromStr;
  const b = parseYmdParts(to);
  if (a.y === b.y && a.m === b.m) return `${fromStr}〜${b.d}`;
  if (a.y === b.y) return `${fromStr}〜${b.m}/${b.d}`;
  return `${fromStr}〜${b.y}/${b.m}/${b.d}`;
}

export function formatVisitedThumb(from: string, to?: string | null): string {
  const a = parseYmdParts(from);
  const fromStr = `${a.m}/${a.d}`;
  if (!to || to === from) return fromStr;
  const b = parseYmdParts(to);
  if (a.y === b.y && a.m === b.m) return `${fromStr}〜${b.d}`;
  return `${fromStr}〜${b.m}/${b.d}`;
}

type AlbumDateSource = {
  visitedFrom?: string | null;
  visitedTo?: string | null;
  createdAt: string;
};

function isoToYmdTokyo(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function formatMyPostDotDate(post: AlbumDateSource): string {
  if (post.visitedFrom) return formatVisitedDot(post.visitedFrom, post.visitedTo);
  return formatVisitedDot(isoToYmdTokyo(post.createdAt));
}

export function formatMyPostSlashDate(post: AlbumDateSource): string {
  if (post.visitedFrom) return formatVisitedSlash(post.visitedFrom, post.visitedTo);
  return formatVisitedSlash(isoToYmdTokyo(post.createdAt));
}

export function formatMyPostThumbDate(post: AlbumDateSource): string {
  if (post.visitedFrom) return formatVisitedThumb(post.visitedFrom, post.visitedTo);
  return formatVisitedThumb(isoToYmdTokyo(post.createdAt));
}

export function visitedDetailLabel(
  from: string | null | undefined,
  to?: string | null,
): string | undefined {
  if (!from) return undefined;
  return `${formatVisitedJa(from, to)}に訪問`;
}
