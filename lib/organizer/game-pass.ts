/** ゲームの参加パスの設定（申し込んだ人だけのとき）。定員・締め切り・注意書き。 */
export type GamePassSettings = {
  /** 申し込める人数。null は上限なし。 */
  capacity: number | null;
  /** この日時を過ぎたら申し込めない（ISO）。null は締め切りなし。 */
  deadline: string | null;
  /** 申し込む前に読んでほしいこと。参加パスにも出す。 */
  note: string;
};

export const GAME_PASS_NOTE_MAX = 300;
export const GAME_PASS_CAPACITY_MAX = 100000;

export function readGamePassSettings(raw: unknown): GamePassSettings | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as { capacity?: unknown; deadline?: unknown; note?: unknown };
  const capacityNum = typeof row.capacity === "number" ? row.capacity : typeof row.capacity === "string" ? Number(row.capacity) : NaN;
  const capacity =
    Number.isFinite(capacityNum) && capacityNum >= 1 ? Math.min(Math.round(capacityNum), GAME_PASS_CAPACITY_MAX) : null;
  const deadline =
    typeof row.deadline === "string" && row.deadline && !Number.isNaN(Date.parse(row.deadline))
      ? new Date(row.deadline).toISOString()
      : null;
  const note = typeof row.note === "string" ? row.note.trim().slice(0, GAME_PASS_NOTE_MAX) : "";
  if (capacity == null && deadline == null && !note) return null;
  return { capacity, deadline, note };
}

/** 保存した設定（settings.pass）を読む。 */
export function gamePassFromSettings(settings: unknown): GamePassSettings | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  return readGamePassSettings((settings as { pass?: unknown }).pass);
}

/** 締め切りを「11/30(月) 23:59」の形で。 */
export function formatGamePassDeadline(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("month")}/${get("day")}(${get("weekday")}) ${get("hour")}:${get("minute")}`;
}
