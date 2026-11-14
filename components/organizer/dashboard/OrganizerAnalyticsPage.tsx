"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  Eye,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ANALYTICS_PERIODS,
  changePercent,
  type AnalyticsPeriod,
  type AnalyticsResult,
  type DayPoint,
  type MetricId,
} from "@/lib/organizer/analytics";

type Data = AnalyticsResult & {
  events: { id: string; title: string; date: string }[];
  eventId: string | null;
};

const METRICS: {
  id: MetricId;
  label: string;
  unit: (n: number) => string;
  Icon: LucideIcon;
  color: string;
  bg: string;
}[] = [
  { id: "participants", label: "参加者数", unit: (n) => `${n.toLocaleString("ja-JP")}人`, Icon: Users, color: "#2f7d4e", bg: "#e6f3ea" },
  { id: "sales", label: "売上", unit: (n) => `¥${n.toLocaleString("ja-JP")}`, Icon: Wallet, color: "#b07a1c", bg: "#fdf3dc" },
  { id: "views", label: "閲覧数", unit: (n) => `${n.toLocaleString("ja-JP")}回`, Icon: BarChart3, color: "#2f6fae", bg: "#e6f1fa" },
  { id: "applications", label: "申込数", unit: (n) => `${n.toLocaleString("ja-JP")}件`, Icon: CalendarDays, color: "#2f7d4e", bg: "#e6f3ea" },
];

/** 2026-11-14 → 11/14 */
function md(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  return `${m}/${d}`;
}

function Change({ value, previous }: { value: number; previous: number }) {
  const pct = changePercent(value, previous);
  if (pct == null) {
    return <span className="text-[12px] font-bold text-[#8a958d]">前の期間：なし</span>;
  }
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[13px] font-bold", up ? "text-[#1f7a4a]" : "text-[#a3403a]")}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {up ? "+" : ""}
      {pct}%<span className="sr-only">（前の期間とくらべて）</span>
    </span>
  );
}

/** 日ごとの推移（1本の線）。指でなぞる・カーソルを当てると、その日の数が出る */
function TrendChart({ points, metric }: { points: DayPoint[]; metric: (typeof METRICS)[number] }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(320);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(240, el.clientWidth)));
    ro.observe(el);
    setWidth(Math.max(240, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const height = 200;
  const pad = { l: 40, r: 14, t: 14, b: 26 };
  const values = points.map((p) => p[metric.id]);
  const max = Math.max(1, ...values);
  // 目盛りは0と、きりのいい上限の半分・上限
  const niceMax = (() => {
    const pow = 10 ** Math.floor(Math.log10(max));
    const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= max) ?? 10;
    return step * pow;
  })();
  const x = (i: number) =>
    pad.l + (points.length <= 1 ? (width - pad.l - pad.r) / 2 : (i * (width - pad.l - pad.r)) / (points.length - 1));
  const y = (v: number) => pad.t + (1 - v / niceMax) * (height - pad.t - pad.b);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[metric.id]).toFixed(1)}`).join(" ");
  const area = points.length
    ? `${line} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
    : "";
  const tickEvery = Math.max(1, Math.ceil(points.length / 5));
  const showDots = points.length <= 14;

  function onMove(clientX: number) {
    const el = boxRef.current;
    if (!el || !points.length) return;
    const rx = clientX - el.getBoundingClientRect().left;
    const i = Math.round(((rx - pad.l) / (width - pad.l - pad.r)) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  }

  const hp = hover != null ? points[hover] : null;
  return (
    <div
      ref={boxRef}
      className="relative touch-pan-y select-none"
      onPointerMove={(e) => onMove(e.clientX)}
      onPointerDown={(e) => onMove(e.clientX)}
      onPointerLeave={() => setHover(null)}
    >
      <svg width={width} height={height} role="img" aria-label={`${metric.label}の日ごとの推移`}>
        {[0, niceMax / 2, niceMax].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="#eef1ec" strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#8a958d">
              {metric.id === "sales" && t >= 10000 ? `${t / 10000}万` : t.toLocaleString("ja-JP")}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % tickEvery === 0 || i === points.length - 1 ? (
            <text key={p.day} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill="#8a958d">
              {md(p.day)}
            </text>
          ) : null
        )}
        <path d={area} fill={metric.color} fillOpacity={0.1} />
        <path d={line} fill="none" stroke={metric.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {showDots
          ? points.map((p, i) => (
              <circle key={p.day} cx={x(i)} cy={y(p[metric.id])} r={4} fill="#fff" stroke={metric.color} strokeWidth={2} />
            ))
          : null}
        {hp != null && hover != null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(0)} stroke="#c9d3cc" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(hp[metric.id])} r={5} fill={metric.color} stroke="#fff" strokeWidth={2} />
          </g>
        ) : null}
      </svg>
      {hp != null && hover != null ? (
        <div
          className="pointer-events-none absolute top-1 rounded-[10px] border border-[#e3e8e3] bg-white px-2.5 py-1.5 text-[12px] shadow-[0_4px_12px_rgba(22,56,40,0.12)]"
          style={{ left: Math.min(Math.max(x(hover) - 50, 0), width - 110) }}
        >
          <p className="m-0 text-[11px] text-[#6b776f]">{md(hp.day)}</p>
          <p className="m-0 font-bold text-[#163828]">{metric.unit(hp[metric.id])}</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * 主催者のダッシュボード（見本 09）。入口はホームの数字の下（「くわしい数字を見る」）だけ。
 * 数字の決め方は lib/organizer/analytics.ts。
 */
export function OrganizerAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("7d");
  const [eventId, setEventId] = useState("");
  const [metricId, setMetricId] = useState<MetricId>("participants");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ period });
    if (eventId) q.set("eventId", eventId);
    fetch(`/api/organizer/analytics?${q}`, { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(json.error ?? "数字を読み込めませんでした");
        return json as Data;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, eventId]);

  const metric = METRICS.find((m) => m.id === metricId) ?? METRICS[0];
  const rangeLabel = useMemo(() => (data ? `${md(data.period.from)}〜${md(data.period.to)}` : ""), [data]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 pb-24 pc:pb-6">
      <div className="flex items-start gap-2.5 pt-1">
        <Link
          href="/organizer/home"
          aria-label="ホームに戻る"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3ef] text-[#3c4a40]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold text-[#163828]">ダッシュボード</h1>
          <p className="text-[12.5px] text-[#5f6d64]">参加・閲覧・売上の状況</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#e6f3ea] text-[#2f7d4e]" aria-hidden>
          <BarChart3 className="h-6 w-6" />
        </span>
      </div>

      {/* しぼりこみ（1行） */}
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">イベント</span>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="h-11 w-full truncate rounded-[14px] border border-[#dfe7e1] bg-white px-3 text-[16px] font-bold text-[#163828]"
          >
            <option value="">すべてのイベント</option>
            {(data?.events ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <label className="shrink-0">
          <span className="sr-only">期間</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
            className="h-11 rounded-[14px] border border-[#dfe7e1] bg-white px-3 text-[16px] font-bold text-[#163828]"
          >
            {ANALYTICS_PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-[16px] border border-[#f1d9c4] bg-[#fdf6ef] px-4 py-4 text-[13px] text-[#7a5a3a]">{error}</p>
      ) : !data ? (
        <div className="grid grid-cols-2 gap-2.5 tablet:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[132px] animate-pulse rounded-[18px] bg-[#e8ede4]" />
          ))}
        </div>
      ) : (
        <>
          {/* 4つの数字。押すと下のグラフがその数字になる */}
          <div className={cn("grid grid-cols-2 gap-2.5 tablet:grid-cols-4", loading && "opacity-60")} role="group" aria-label="期間の数字">
            {METRICS.map((m) => {
              const k = data.kpis[m.id];
              const selected = m.id === metricId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetricId(m.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-[18px] border bg-white p-3.5 text-left shadow-[0_3px_10px_rgba(22,56,40,0.05)]",
                    selected ? "border-[#2f7d4e] ring-1 ring-[#2f7d4e]" : "border-[#ebeee8]"
                  )}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: m.bg, color: m.color }} aria-hidden>
                    <m.Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[12.5px] text-[#5f6d64]">{m.label}</span>
                  <span className="text-[22px] font-bold leading-none tracking-tight text-[#163828]">{m.unit(k.value)}</span>
                  {m.id === "views" && data.viewsSince == null ? (
                    <span className="text-[11.5px] font-bold text-[#8a958d]">準備中</span>
                  ) : (
                    <Change value={k.value} previous={k.previous} />
                  )}
                </button>
              );
            })}
          </div>

          <section aria-labelledby="trend-heading" className="space-y-2">
            <h2 id="trend-heading" className="text-[16px] font-bold text-[#163828]">
              {metric.label}の推移
            </h2>
            <div className="rounded-[18px] border border-[#ebeee8] bg-white p-3.5 shadow-[0_3px_10px_rgba(22,56,40,0.05)]">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[13px] font-bold text-[#163828]">
                  {ANALYTICS_PERIODS.find((p) => p.id === data.period.id)?.label}
                </span>
                <span className="text-[12px] text-[#8a958d]">{rangeLabel}</span>
              </div>
              <TrendChart points={data.series} metric={metric} />
            </div>
          </section>

          <details className="rounded-[14px] border border-[#ebeee8] bg-white px-3.5 py-2.5 text-[13px] text-[#3f5146]">
            <summary className="cursor-pointer font-bold text-[#163828]">日ごとの数（表）</summary>
            <table className="mt-2 w-full text-right text-[12.5px]">
              <thead>
                <tr className="text-[#6b776f]">
                  <th className="py-1 text-left font-medium">日付</th>
                  {METRICS.map((m) => (
                    <th key={m.id} className="py-1 font-medium">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...data.series].reverse().map((p) => (
                  <tr key={p.day} className="border-t border-[#f1f3ef]">
                    <td className="py-1 text-left">{md(p.day)}</td>
                    {METRICS.map((m) => (
                      <td key={m.id} className="py-1 tabular-nums">
                        {m.unit(p[m.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <ul className="space-y-1 text-[11.5px] leading-relaxed text-[#6b776f]">
            <li>参加者数は、当日の受付でチェックインした人の数です。</li>
            <li>申込数は、イベントへの参加申し込みとボランティアへの応募の合計です。</li>
            <li>売上は、レジの会計とイベントの参加費（支払い済み）の合計です。返金した分は入りません。</li>
            <li>
              <Eye className="mr-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
              閲覧数は、イベント・お店・募集のページが開かれた回数です
              {data.viewsSince ? `（${md(data.viewsSince)}から数えています）` : "（ただいま準備中です）"}。
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
