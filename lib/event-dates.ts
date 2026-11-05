/**
 * イベントの開催日の判定。期間イベント（date〜endDate）と1日だけのイベントを同じように扱う。
 * 日付はすべて JST の "YYYY-MM-DD" 文字列で比べる。
 */

type EventDays = { date: string; endDate?: string | null };

/** 最終日。1日だけのイベントは開始日と同じ */
export function eventLastDay(e: EventDays): string {
  return e.endDate && e.endDate > e.date ? e.endDate : e.date;
}

/** 開始日と終了日が別の日の期間イベントか */
export function isPeriodEvent(e: EventDays): boolean {
  return Boolean(e.endDate && e.endDate > e.date);
}

/** その日に開催しているか（期間イベントは期間中ずっと） */
export function eventOccursOn(e: EventDays, ymd: string): boolean {
  return e.date <= ymd && eventLastDay(e) >= ymd;
}

/** start〜end（両端を含む）と開催日が1日でも重なるか */
export function eventOverlapsRange(e: EventDays, start: string, end: string): boolean {
  return e.date <= end && eventLastDay(e) >= start;
}

/** 最終日が過ぎて終わったか */
export function isEventEndedBy(e: EventDays, today: string): boolean {
  return eventLastDay(e) < today;
}

/** 今日を含む期間イベントで、すでに始まっているもの（「開催中」と出す） */
export function isPeriodEventOngoing(e: EventDays, today: string): boolean {
  return isPeriodEvent(e) && eventOccursOn(e, today);
}

/**
 * Supabase の events を「今日以降も開催がある」ものに絞る or 条件。
 * 1日だけ（end_date が NULL）は date >= today、期間イベントは end_date >= today。
 */
export function upcomingEventsOrFilter(today: string): string {
  return `date.gte.${today},end_date.gte.${today}`;
}

/** 「最終日が今日より前（終わった）」の or 条件。upcomingEventsOrFilter の反対 */
export function endedEventsOrFilter(today: string): string {
  return `and(end_date.is.null,date.lt.${today}),end_date.lt.${today}`;
}

/**
 * フォームから届いた終了日を保存できる形にする。
 * くり返し（毎週・毎月）のときや、開始日と同じ日・空のときは null（1日だけ）。
 * 開始日より前なら "invalid" を返す。
 */
export function normalizeEventEndDate(
  date: unknown,
  endDate: unknown,
  recurrence: string
): string | null | "invalid" {
  if (recurrence !== "none") return null;
  const start = typeof date === "string" ? date.slice(0, 10) : "";
  const end = typeof endDate === "string" ? endDate.trim().slice(0, 10) : "";
  if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
  if (end < start) return "invalid";
  return end === start ? null : end;
}
