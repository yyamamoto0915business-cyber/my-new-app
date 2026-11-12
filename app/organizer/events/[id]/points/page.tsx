"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Info, Sparkles } from "lucide-react";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { cn } from "@/lib/utils";
import type { EventPointSettings, PointProduct } from "@/lib/db/event-point-settings";
import type { EventPointStats } from "@/lib/points/event-points";

type Data = {
  event: { id: string; title: string; date: string; endDate: string | null; startTime: string | null; endTime: string | null };
  settings: EventPointSettings;
  products: PointProduct[];
  stats: EventPointStats;
};

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;
function periodLabel(e: Data["event"]): string {
  const day = (ymd: string) => {
    const [, m, d] = ymd.split("-").map(Number);
    const wd = WEEKDAY_JA[new Date(`${ymd}T12:00:00+09:00`).getUTCDay()];
    return `${m}/${d}（${wd}）`;
  };
  const start = `${day(e.date)}${e.startTime ? ` ${e.startTime}` : ""}`;
  const last = e.endDate && e.endDate !== e.date ? day(e.endDate) : "";
  return `${start}〜${last}${e.endTime ? `${last ? " " : ""}${e.endTime}` : ""}`;
}

/**
 * 主催者：イベントポイントの使い方（画面案 ①②）。
 * ポイントはこのイベントのゲームでたまり、開催中にこのイベントのレジで使える。
 * 「商品と交換」を選ぶと、レジの商品ごとに何ptで交換できるかを決める（割引はあとで作る）。
 */
export default function EventPointsSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"off" | "exchange">("off");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/organizer/events/${encodeURIComponent(id)}/points`, { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(json.error ?? "読み込めませんでした");
        return json as Data;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setMode(json.settings.mode === "exchange" ? "exchange" : "off");
        setPrices(Object.fromEntries(json.products.map((p) => [p.id, p.pointPrice ? String(p.pointPrice) : ""])));
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const exchangeCount = Object.values(prices).filter((v) => Number(v) > 0).length;

  async function save() {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/organizer/events/${encodeURIComponent(id)}/points`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          products: data.products.map((p) => ({ id: p.id, pointPrice: Number(prices[p.id]) > 0 ? Number(prices[p.id]) : null })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "保存できませんでした");
      setMessage({ ok: true, text: "保存しました" });
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <OrganizerRegistrationGate>
      <div className="mx-auto w-full max-w-xl space-y-4 pb-28">
        <div className="flex items-center gap-2.5 pt-1">
          <Link
            href="/organizer/events"
            aria-label="イベント管理に戻る"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3ef] text-[#3c4a40]"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-[12px] text-[#5f6d64]">{data?.event.title ?? " "}</p>
            <h1 className="text-[18px] font-bold text-[#163828]">イベントポイント</h1>
          </div>
        </div>

        {loadError ? (
          <p className="rounded-[16px] border border-[#f1d9c4] bg-[#fdf6ef] px-4 py-4 text-[13px] text-[#7a5a3a]">{loadError}</p>
        ) : !data ? (
          <div className="space-y-3">
            <div className="h-[150px] animate-pulse rounded-[18px] bg-[#e8ede4]" />
            <div className="h-[240px] animate-pulse rounded-[18px] bg-[#e8ede4]" />
          </div>
        ) : !data.settings.ready ? (
          <p className="rounded-[16px] border border-[#ecd9a6] bg-[#fffaf0] px-4 py-4 text-[13px] leading-relaxed text-[#6b5a33]">
            イベントポイントはただいま準備中です。もうしばらくお待ちください。
          </p>
        ) : (
          <>
            {/* このイベントのポイント */}
            <section className="space-y-1.5 rounded-[18px] border border-[#ecd9a6] bg-gradient-to-br from-[#fffaf0] to-[#fdf0cf] p-4">
              <p className="text-[11px] font-bold tracking-[0.16em] text-[#8a6a1c]">EVENT POINT</p>
              <p className="text-[21px] font-bold text-[#3a2c10]" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                {data.event.title}ポイント
              </p>
              <p className="text-[12.5px] leading-relaxed text-[#6b5a33]">
                このイベントのゲームでたまり、開催中（{periodLabel(data.event)}）にこのイベントのレジで使えます。
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { label: "発行済み", value: `${data.stats.issued.toLocaleString("ja-JP")}pt` },
                  { label: "使われた", value: `${data.stats.used.toLocaleString("ja-JP")}pt` },
                  { label: "ためた人", value: `${data.stats.earners.toLocaleString("ja-JP")}人` },
                ].map((s) => (
                  <div key={s.label} className="rounded-[12px] bg-white/80 px-2.5 py-2">
                    <p className="text-[10.5px] text-[#8a7650]">{s.label}</p>
                    <p className="text-[17px] font-bold text-[#163828]">{s.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 使い方 */}
            <section className="space-y-2.5" aria-labelledby="point-mode-heading">
              <h2 id="point-mode-heading" className="text-[15px] font-bold text-[#163828]">
                ポイントの使い方
              </h2>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[16px] border-[1.5px] bg-white p-3.5",
                  mode === "off" ? "border-[#2f7d4e] bg-[#f1f8f3]" : "border-[#e3e8e3]"
                )}
              >
                <input
                  type="radio"
                  name="point-mode"
                  checked={mode === "off"}
                  onChange={() => setMode("off")}
                  className="mt-1 h-[18px] w-[18px] accent-[#2f7d4e]"
                />
                <span>
                  <span className="block text-[14.5px] font-bold text-[#163828]">使わない（記録だけ）</span>
                  <span className="block text-[12px] text-[#5f6d64]">ためたポイントは参加者の記録に残ります</span>
                </span>
              </label>

              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[16px] border-[1.5px] bg-white p-3.5",
                  mode === "exchange" ? "border-[#2f7d4e] bg-[#f1f8f3]" : "border-[#e3e8e3]"
                )}
              >
                <input
                  type="radio"
                  name="point-mode"
                  checked={mode === "exchange"}
                  onChange={() => setMode("exchange")}
                  className="mt-1 h-[18px] w-[18px] accent-[#2f7d4e]"
                />
                <span>
                  <span className="block text-[14.5px] font-bold text-[#163828]">商品と交換する</span>
                  <span className="block text-[12px] text-[#3f5146]">レジの商品ごとに、何ptで交換できるかを決めます</span>
                </span>
              </label>

              <div className="flex items-start gap-3 rounded-[16px] border-[1.5px] border-dashed border-[#e3e8e3] bg-white/60 p-3.5 text-[#8a958d]">
                <Sparkles className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden />
                <span>
                  <span className="block text-[14px] font-bold">お会計の割引に使う</span>
                  <span className="block text-[12px]">準備中です</span>
                </span>
              </div>
            </section>

            {/* 交換できる商品（画面案 ②） */}
            {mode === "exchange" ? (
              <section className="space-y-2.5" aria-labelledby="point-products-heading">
                <div className="flex items-baseline justify-between">
                  <h2 id="point-products-heading" className="text-[15px] font-bold text-[#163828]">
                    交換できる商品
                  </h2>
                  <span className="text-[12px] text-[#5f6d64]">{exchangeCount}品</span>
                </div>
                {data.products.length === 0 ? (
                  <p className="rounded-[16px] border border-dashed border-[#d6e3da] bg-white px-4 py-4 text-[13px] text-[#6b776f]">
                    まだレジに商品がありません。
                    <Link href="/organizer/pos" className="ml-1 font-bold text-[#1f7a4a] underline underline-offset-2">
                      レジで商品を登録
                    </Link>
                    してください。
                  </p>
                ) : (
                  <ul className="divide-y divide-[#eef1ec] overflow-hidden rounded-[18px] border border-[#e3e8e3] bg-white">
                    {data.products.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 px-3.5 py-3">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px] font-bold text-[#163828]">{p.name}</span>
                          <span className="block text-[11.5px] text-[#6b776f]">¥{p.priceYen.toLocaleString("ja-JP")}</span>
                        </span>
                        <label className="flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-[#1f5e3a]">
                          <span className="sr-only">{p.name}の交換pt</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={99999}
                            placeholder="交換しない"
                            value={prices[p.id] ?? ""}
                            onChange={(e) => setPrices((cur) => ({ ...cur, [p.id]: e.target.value }))}
                            className="h-10 w-[7.5rem] rounded-[10px] border-[1.5px] border-[#cfe3d6] bg-[#fafcf9] px-2.5 text-right text-[16px] font-bold placeholder:text-[12px] placeholder:font-semibold placeholder:text-[#9aa89c]"
                          />
                          pt
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="flex items-start gap-2 rounded-[14px] border border-[#ecd9a6] bg-[#fffaf0] px-3.5 py-3 text-[12px] leading-relaxed text-[#6b5a33]">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#a87412]" aria-hidden />
                  交換ptは商品ごとに1つで、ほかのイベントで「商品と交換」を選んだときも同じになります。空にすると、その商品は交換できません。
                </p>
              </section>
            ) : null}

            <p className="text-[11.5px] leading-relaxed text-[#6b776f]">
              交換した分は、その会計の売上から引かれます。イベントが終わると、残ったポイントは使えなくなります。
            </p>
          </>
        )}
      </div>

      {data?.settings.ready ? (
        <div className="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom,0px))] z-40 border-t border-[#e6ebe6] bg-white/95 px-4 py-3 backdrop-blur min-[900px]:bottom-0">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-1.5">
            {message ? (
              <p className={cn("text-center text-[12.5px] font-bold", message.ok ? "text-[#1f7a4a]" : "text-[#b84060]")} role="status">
                {message.text}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="h-[52px] w-full rounded-[16px] bg-[#2f7d4e] text-[16px] font-bold text-white disabled:opacity-60"
            >
              {saving ? "保存中…" : mode === "exchange" ? `${exchangeCount}品を交換できるようにして保存` : "保存する"}
            </button>
          </div>
        </div>
      ) : null}
    </OrganizerRegistrationGate>
  );
}
