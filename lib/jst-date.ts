export function getJstTodayYmd(baseDate: Date = new Date()): string {
  const jst = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(baseDate);
  // en-CA is expected to be yyyy-mm-dd, but normalize defensively.
  const parts = jst.split("-");
  if (parts.length === 3) return `${parts[0]}-${parts[1]}-${parts[2]}`;
  const fallback = new Date(baseDate.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return fallback;
}

export function getJstNowHm(baseDate: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(baseDate);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function toJstTimestamp(dateYmd: string, timeHm: string): number | null {
  const d = String(dateYmd ?? "").trim();
  const t = String(timeHm ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  if (!/^\d{2}:\d{2}$/.test(t)) return null;
  const ts = Date.parse(`${d}T${t}:00+09:00`);
  return Number.isNaN(ts) ? null : ts;
}
