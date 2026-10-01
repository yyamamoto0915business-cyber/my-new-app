import { getThisWeekendYmdBounds } from "@/lib/events";
import { getJstTodayYmd } from "@/lib/jst-date";
import type { TownTimeRange } from "@/components/home/pc/PcTownFilterBar";

export type BrowsePriceFilter = "all" | "free" | "paid";

export type BrowseDateBounds = {
  today: string;
  weekendStart: string;
  weekendEnd: string;
  weekendLabel: string;
  nextWeekStart: string;
  nextWeekEnd: string;
  nextWeekLabel: string;
  monthLabel: string;
};

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function dayOfWeek(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function formatMd(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function getBrowseDateBounds(today = getJstTodayYmd()): BrowseDateBounds {
  const weekend = getThisWeekendYmdBounds();
  const dow = dayOfWeek(today);
  const daysUntilNextMonday = dow === 0 ? 1 : 8 - dow;
  const nextWeekStart = addDays(today, daysUntilNextMonday);
  const nextWeekEnd = addDays(nextWeekStart, 6);
  return {
    today,
    weekendStart: weekend.saturday,
    weekendEnd: weekend.sunday,
    weekendLabel: `${formatMd(weekend.saturday)}–${formatMd(weekend.sunday)}`,
    nextWeekStart,
    nextWeekEnd,
    nextWeekLabel: `${formatMd(nextWeekStart)}–${formatMd(nextWeekEnd)}`,
    monthLabel: `${Number(today.slice(5, 7))}月`,
  };
}

export function ymdMatchesBrowseTime(
  ymd: string,
  timeRange: TownTimeRange,
  specificDate: string,
  bounds: BrowseDateBounds,
): boolean {
  if (!ymd) return timeRange === "all";
  if (timeRange === "all") return true;
  if (timeRange === "date") return specificDate ? ymd === specificDate : true;
  if (timeRange === "today") return ymd === bounds.today;
  if (timeRange === "weekend") {
    return ymd >= bounds.today && ymd >= bounds.weekendStart && ymd <= bounds.weekendEnd;
  }
  if (timeRange === "next_week") {
    return ymd >= bounds.nextWeekStart && ymd <= bounds.nextWeekEnd;
  }
  if (timeRange === "month") {
    return ymd >= bounds.today && ymd.slice(0, 7) === bounds.today.slice(0, 7);
  }
  return true;
}
