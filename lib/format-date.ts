const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

/** HH:mm:ss や HH:mm を HH:mm に揃える */
export function formatTimeToHm(time?: string | null): string {
  if (!time) return "";
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (match) {
    return `${Number(match[1])}:${match[2]}`;
  }
  return trimmed;
}

/** ISO日付 (YYYY-MM-DD) を 2/20(木) 形式に */
export function formatEventDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const w = WEEKDAY[date.getDay()];
  return `${m}/${d}(${w})`;
}

/** 日付＋開始時刻を 2/20(木) 19:00 形式に */
export function formatEventDateTime(dateStr: string, startTime?: string): string {
  const base = formatEventDate(dateStr);
  const time = formatTimeToHm(startTime);
  return time ? `${base} ${time}` : base;
}

/** PCイベント詳細向け: 2026/4/26 (土) 10:00～16:00 */
export function formatEventDatePc(
  dateStr: string,
  startTime?: string,
  endTime?: string
): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const w = WEEKDAY[new Date(y, m - 1, d).getDay()];
  const datePart = `${y}/${m}/${d} (${w})`;
  if (!startTime) return datePart;
  const start = formatTimeToHm(startTime);
  const end = formatTimeToHm(endTime);
  const timePart = end ? `${start}～${end}` : start;
  return `${datePart} ${timePart}`;
}
