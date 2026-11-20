"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Eye, Gamepad2, Users, Wallet, type LucideIcon } from "lucide-react";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";
import { cn } from "@/lib/utils";
import {
  ANALYTICS_PERIODS,
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

/** グラフが 0 だけのときの説明（何をすると増えるか） */
const EMPTY_HINT: Record<MetricId, string> = {
  participants: "当日の受付でQRを読み取ると、ここに数えられます",
  sales: "レジの会計やイベントの参加費の支払いがあると出ます",
  views: "イベント・お店・募集のページが開かれると数えます",
  applications: "参加の申し込みやボランティアの応募があると出ます",
};

/** 2026-11-14 → 11/14 */
function md(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  return `${m}/${d}`;
}

/**
 * 前の期間とのちがい。％ではなく「前の期間より +3人」のように数で出す
 * （前は 0 のときに「前の期間：なし」、減ったときに赤い「-100%」が出て、こわく見えた）
 */
function Change({ value, previous, unit }: { value: number; previous: number; unit: (n: number) => string }) {
  if (value === 0 && previous === 0) {
    return <span className="text-[11.5px] font-medium text-[#9aa29c]">前の期間も 0</span>;
  }
  const diff = value - previous;
  if (diff === 0) return <span className="text-[11.5px] font-medium text-[#6b776f]">前の期間と同じ</span>;
  return (
    <span className={cn("text-[11.5px] font-semibold", diff > 0 ? "text-[#1f7a4a]" : "text-[#8a6d3b]")}>
      前の期間より {diff > 0 ? "+" : "−"}
      {unit(Math.abs(diff))}
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
  // 右は最後の日付（11/18 など）が切れないように広めにとる
  const pad = { l: 40, r: 22, t: 14, b: 26 };
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
  if (points.length > 0 && values.every((v) => v === 0)) {
    return (
      <div className="flex h-[160px] flex-col items-center justify-center rounded-[14px] bg-[#f7f8f5] px-4 text-center">
        <p className="text-[13.5px] font-bold text-[#3f5146]">この期間の{metric.label}はまだありません</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-[#7b877f]">{EMPTY_HINT[metric.id]}</p>
      </div>
    );
  }
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
 * 主催者のダッシュボード（見本 09。ホームの「くわしい数字を見る」から開く）。入口はホームの数字の下（「くわしい数字を見る」）だけ。
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

  // ゲームの効果への入口（公開中のゲームがあるときだけ。いちばん新しい公開中のゲームの効果の画面へ）
  const [games, setGames] = useState<{ id: string; name: string; status: string; typeLabel?: string }[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/organizer/games", { cache: "no-store", signal: controller.signal })
      .then(async (r) => (r.ok ? ((await r.json()) as { games?: { id: string; name: string; status: string; typeLabel?: string }[] }) : null))
      .then((json) => setGames(json?.games ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const publishedGames = (games ?? []).filter((g) => g.status === "published");

  const metric = METRICS.find((m) => m.id === metricId) ?? METRICS[0];
  const rangeLabel = useMemo(() => (data ? `${md(data.period.from)}〜${md(data.period.to)}` : ""), [data]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 pb-24 pc:pb-6">
      {/* 見出し（ホームの「くわしい数字を見る」から来る） */}
      <header className="flex items-start gap-2.5 pt-1">
        <Link
          href="/organizer/home"
          aria-label="ホームに戻る"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6e2d6] bg-white text-[#173f2c]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <OrgEyebrow>DASHBOARD</OrgEyebrow>
          <h1 className="mt-1 text-[21px] font-bold leading-tight tracking-[0.04em] text-[#173f2c]" style={{ fontFamily: ORG_SERIF }}>
            ダッシュボード
          </h1>
          <p className="mt-0.5 text-[12.5px] text-[#6b776f]">参加・閲覧・売上・申込の状況</p>
        </div>
      </header>

      {/* しぼりこみ：期間は押して切りかえ、イベントは選ぶ */}
      <div className="space-y-2">
        <div role="tablist" aria-label="期間" className="grid grid-cols-4 gap-1 rounded-full bg-[#eef3ef] p-1">
          {ANALYTICS_PERIODS.map((p) => {
            const on = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "min-h-[38px] whitespace-nowrap rounded-full text-[13px] font-semibold transition",
                  on ? "bg-[#173f2c] text-[#f6ebc8] shadow-[0_3px_8px_rgba(14,42,29,0.22)]" : "text-[#5f6d64]"
                )}
              >
                {p.label.replace("直近", "")}
              </button>
            );
          })}
        </div>
        <label className="block">
          <span className="sr-only">イベント</span>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="h-11 w-full truncate rounded-[14px] border border-[#e6e2d6] bg-white px-3.5 text-[16px] font-medium text-[#3f5146]"
          >
            <option value="">すべてのイベント</option>
            {(data?.events ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
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
          {/* 4つの数字（1枚のカード）。押すと下のグラフがその数字になる */}
          <div
            className={cn(
              "relative overflow-hidden rounded-[18px] border border-[#e6e2d6] bg-white shadow-[0_3px_10px_rgba(22,56,40,0.05)]",
              loading && "opacity-60"
            )}
          >
            <span className="pointer-events-none absolute inset-x-5 top-0 z-10 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#c9a54e] to-transparent" aria-hidden />
            <div className="grid grid-cols-2 tablet:grid-cols-4" role="group" aria-label="期間の数字（押すとグラフが変わります）">
              {METRICS.map((m, idx) => {
                const k = data.kpis[m.id];
                const selected = m.id === metricId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetricId(m.id)}
                    aria-pressed={selected}
                    className={cn(
                      "relative flex flex-col items-start gap-1 px-3.5 py-3 text-left transition active:bg-[#f7f5ee]",
                      idx % 2 === 0 && "border-r border-[#f0ede4]",
                      idx < 2 && "border-b border-[#f0ede4] tablet:border-b-0",
                      "tablet:border-r tablet:last:border-r-0",
                      selected && "bg-[#f4f8f5]"
                    )}
                  >
                    {selected ? <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-[#173f2c]" aria-hidden /> : null}
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#5f6d64]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: m.bg, color: m.color }} aria-hidden>
                        <m.Icon className="h-3.5 w-3.5" />
                      </span>
                      {m.label}
                    </span>
                    <span className="mt-0.5 text-[20px] font-bold leading-tight tracking-tight text-[#173f2c] tabular-nums">{m.unit(k.value)}</span>
                    {m.id === "views" && data.viewsSince == null ? (
                      <span className="text-[11.5px] font-medium text-[#9aa29c]">準備中</span>
                    ) : (
                      <Change value={k.value} previous={k.previous} unit={m.unit} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <section aria-labelledby="trend-heading" className="space-y-2">
            <h2 id="trend-heading" className="flex items-baseline justify-between gap-2 px-1">
              <span className="text-[16px] font-bold text-[#173f2c]" style={{ fontFamily: ORG_SERIF }}>
                {metric.label}の推移
              </span>
              <span className="text-[12px] tabular-nums text-[#7b877f]">{rangeLabel}</span>
            </h2>
            <div className="rounded-[18px] border border-[#ebeee8] bg-white p-3.5 shadow-[0_3px_10px_rgba(22,56,40,0.05)]">
              <TrendChart points={data.series} metric={metric} />
            </div>
          </section>

          {/* ゲームの効果：上の「推移」と同じ見出しと白いカードにそろえ、公開中のゲームを1行ずつ（前は1枚だけ紫で浮いていた） */}
          {publishedGames.length > 0 ? (
            <section aria-labelledby="games-heading" className="space-y-2">
              <h2 id="games-heading" className="flex items-baseline justify-between gap-2 px-1">
                <span className="text-[16px] font-bold text-[#173f2c]" style={{ fontFamily: ORG_SERIF }}>
                  ゲームの効果
                </span>
                <span className="text-[12px] text-[#7b877f]">公開中 {publishedGames.length}件</span>
              </h2>
              <ul className="relative divide-y divide-[#f0ede4] overflow-hidden rounded-[18px] border border-[#e6e2d6] bg-white shadow-[0_3px_10px_rgba(22,56,40,0.05)]">
                {publishedGames.slice(0, 3).map((g) => (
                  <li key={g.id}>
                    <Link href={`/organizer/games/${g.id}/analytics`} className="flex items-center gap-3 px-3.5 py-3 active:bg-[#f7f5ee]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ef] text-[#173f2c]" aria-hidden>
                        <Gamepad2 className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-[#1f2a24]">{g.name}</span>
                        <span className="block text-[11.5px] text-[#7b877f]">{g.typeLabel ? `${g.typeLabel}・` : ""}参加やクリアの数</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#a3ada6]" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <details className="rounded-[14px] border border-[#ebeee8] bg-white px-3.5 py-2.5 text-[13px] text-[#3f5146]">
            <summary className="cursor-pointer text-[13.5px] font-semibold text-[#173f2c]">日ごとの数（表）</summary>
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

          <details className="rounded-[14px] border border-[#ebeee8] bg-white px-3.5 py-2.5 text-[13px] text-[#3f5146]">
            <summary className="cursor-pointer text-[13.5px] font-semibold text-[#173f2c]">数字の数え方</summary>
          <ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-[#6b776f]">
            <li>参加者数は、当日の受付でチェックインした人の数です。</li>
            <li>申込数は、イベントへの参加申し込みとボランティアへの応募の合計です。</li>
            <li>売上は、レジの会計とイベントの参加費（支払い済み）の合計です。返金した分は入りません。</li>
            <li>
              <Eye className="mr-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
              閲覧数は、イベント・お店・募集のページが開かれた回数です
              {data.viewsSince ? `（${md(data.viewsSince)}から数えています）` : "（ただいま準備中です）"}。
            </li>
          </ul>
          </details>
        </>
      )}
    </div>
  );
}
