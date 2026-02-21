const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

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
  return startTime ? `${base} ${startTime}` : base;
}
