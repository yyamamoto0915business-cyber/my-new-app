/**
 * 主催者のダッシュボード（見本 09）の数え方。
 * - 参加者数：来場（チェックインした人。event_checkins）
 * - 売上：レジの会計（支払い済み）＋イベントの申し込み代金（支払い済み）
 * - 閲覧数：掲載の詳細ページが開かれた回数（listing_view_daily、00130 から数え始める）
 * - 申込数：イベントの参加申し込み＋ボランティア募集への応募
 * 期間は日本時間の日付で区切り、すぐ前の同じ長さの期間とくらべる。
 */

export type AnalyticsPeriod = "7d" | "30d" | "month" | "last_month";
export const ANALYTICS_PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "7d", label: "直近7日" },
  { id: "30d", label: "直近30日" },
  { id: "month", label: "今月" },
  { id: "last_month", label: "先月" },
];

export type MetricId = "participants" | "sales" | "views" | "applications";

export type DayPoint = { day: string } & Record<MetricId, number>;

export type AnalyticsResult = {
  period: { id: AnalyticsPeriod; from: string; to: string };
  previous: { from: string; to: string };
  kpis: Record<MetricId, { value: number; previous: number }>;
  series: DayPoint[];
  /** 閲覧数を数え始めた日（null：まだ数えていない） */
  viewsSince: string | null;
};

/** 日本時間の今日（YYYY-MM-DD） */
export function jstToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(now);
}

function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1;
}

/** 期間（両端を含む日付）と、くらべる前の期間 */
export function periodRange(
  period: AnalyticsPeriod,
  today: string
): { from: string; to: string; prevFrom: string; prevTo: string } {
  if (period === "month" || period === "last_month") {
    const [y, m] = today.split("-").map(Number);
    const first = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, "0")}-01`;
    const shift = (yy: number, mm: number, k: number) => {
      const t = yy * 12 + (mm - 1) + k;
      return [Math.floor(t / 12), (t % 12) + 1] as const;
    };
    if (period === "month") {
      const from = first(y, m);
      const len = daysBetween(from, today);
      const [py, pm] = shift(y, m, -1);
      const prevFrom = first(py, pm);
      // 先月の同じ日数（先月が短ければ月末まで）
      const prevMonthEnd = addDays(from, -1);
      const prevTo = [addDays(prevFrom, len - 1), prevMonthEnd].sort()[0];
      return { from, to: today, prevFrom, prevTo };
    }
    const [ly, lm] = shift(y, m, -1);
    const from = first(ly, lm);
    const to = addDays(first(y, m), -1);
    const [py, pm] = shift(y, m, -2);
    return { from, to, prevFrom: first(py, pm), prevTo: addDays(from, -1) };
  }
  const len = period === "7d" ? 7 : 30;
  const from = addDays(today, -(len - 1));
  return { from, to: today, prevFrom: addDays(from, -len), prevTo: addDays(from, -1) };
}

/** タイムスタンプ（UTC）を日本時間の日付に */
export function jstDayOf(ts: string): string {
  return jstToday(new Date(ts));
}

export type AnalyticsRows = {
  checkins: { at: string }[];
  applications: { at: string }[];
  sales: { at: string; yen: number }[];
  views: { day: string; views: number }[];
};

/** 行の集まりから、期間の合計・前の期間の合計・日ごとの値を作る */
export function buildAnalytics(
  period: AnalyticsPeriod,
  today: string,
  rows: AnalyticsRows,
  viewsSince: string | null
): AnalyticsResult {
  const r = periodRange(period, today);
  const series: DayPoint[] = [];
  const index = new Map<string, DayPoint>();
  for (let d = r.from; d <= r.to; d = addDays(d, 1)) {
    const p: DayPoint = { day: d, participants: 0, sales: 0, views: 0, applications: 0 };
    series.push(p);
    index.set(d, p);
  }
  const kpis: AnalyticsResult["kpis"] = {
    participants: { value: 0, previous: 0 },
    sales: { value: 0, previous: 0 },
    views: { value: 0, previous: 0 },
    applications: { value: 0, previous: 0 },
  };
  const add = (metric: MetricId, day: string, n: number) => {
    if (day >= r.from && day <= r.to) {
      kpis[metric].value += n;
      const p = index.get(day);
      if (p) p[metric] += n;
    } else if (day >= r.prevFrom && day <= r.prevTo) {
      kpis[metric].previous += n;
    }
  };
  for (const c of rows.checkins) add("participants", jstDayOf(c.at), 1);
  for (const a of rows.applications) add("applications", jstDayOf(a.at), 1);
  for (const s of rows.sales) add("sales", jstDayOf(s.at), Math.max(0, Math.round(s.yen)));
  for (const v of rows.views) add("views", v.day, Math.max(0, v.views));

  return {
    period: { id: period, from: r.from, to: r.to },
    previous: { from: r.prevFrom, to: r.prevTo },
    kpis,
    series,
    viewsSince,
  };
}

/** 前の期間とくらべた増え方（%）。前が0のときは null（「—」と出す） */
export function changePercent(value: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((value - previous) / previous) * 100);
}
