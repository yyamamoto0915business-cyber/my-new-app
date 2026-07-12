import { getJstNowHm } from "@/lib/jst-date";

/** ISO 時刻または Date を JST の H:MM / HH:MM 表示に */
export function formatJstHm(isoOrDate?: string | Date | null): string {
  if (!isoOrDate) return getJstNowHm();
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return getJstNowHm();
  return getJstNowHm(d);
}

/** 「最終更新 10:05」用（先頭ゼロなしの時） */
export function formatLastUpdatedLabel(isoOrDate?: string | Date | null): string {
  const hm = formatJstHm(isoOrDate);
  const [h, m] = hm.split(":");
  return `最終更新 ${Number(h)}:${m}`;
}

export function formatYen(amount: number): string {
  return `¥${Math.max(0, Math.round(amount)).toLocaleString("ja-JP")}`;
}

export function formatSoldTickets(sold: number, capacity: number | null): string {
  if (capacity != null && capacity > 0) {
    return `${sold} / ${capacity}枚`;
  }
  return `${sold}枚`;
}

export function formatCheckedInRatio(checkedIn: number, holders: number): string {
  return `${checkedIn} / ${holders}人`;
}
