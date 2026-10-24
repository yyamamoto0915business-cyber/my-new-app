"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { PlacePickerDialog } from "@/components/organizer/games/PlacePickerDialog";
import { GAME_CHECKIN_RADIUS_PRESETS } from "@/lib/organizer/game-experience";
import { cn } from "@/lib/utils";

export type Arrival = "none" | "gps" | "keyword";
export type ArrivalValue = {
  place: string;
  arrival: Arrival;
  lat: number | null;
  lng: number | null;
  radius: number;
  keyword: string;
};

const ARRIVALS: { id: Arrival; label: string; blurb: string }[] = [
  { id: "none", label: "確かめない", blurb: "どこからでも解けます" },
  { id: "gps", label: "GPS", blurb: "決めた場所の近くに来ると確かめられます" },
  { id: "keyword", label: "合言葉", blurb: "現地の看板などにある合言葉を入れます" },
];

/**
 * 地図の場所と、その場所に着いたことの確かめ方（位置情報スタンプラリー・クイズのチェックポイントと同じ）。
 * 謎解き・ミッションで使う。
 */
export function ArrivalFields({
  value: step,
  itemLabel,
  arrivalNote,
  onChange,
}: {
  value: ArrivalValue;
  /** 「謎」「ミッション」など。案内の文に使う。 */
  itemLabel: string;
  /** 確かめ方を選んだときの説明。なければ「着いたことを確かめてから達成」。 */
  arrivalNote?: string;
  onChange: (patch: Partial<ArrivalValue>) => void;
}) {
  const [picking, setPicking] = useState(false);
  const placed = step.lat != null && step.lng != null;
  const preset = (GAME_CHECKIN_RADIUS_PRESETS as readonly number[]).includes(step.radius);
  return (
    <div className="quiz-checkpoint">
      {/* 位置情報スタンプラリーと同じ。押すと、住所で探して地図でピンを合わせる画面が開く。 */}
      <div className="quiz-checkpoint__field">
        <span>地図の場所（参加者のマップにピンで出ます）</span>
        <button
          type="button"
          onClick={() => setPicking(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            minHeight: "2.6rem",
            padding: "0 1rem",
            border: placed ? "1.5px solid #b7e4c4" : "1.5px dashed #e6a23c",
            borderRadius: 999,
            background: placed ? "#eef7f1" : "#fff8e8",
            color: placed ? "#1f7a4a" : "#8a5a00",
            fontSize: "0.85rem",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          <MapPin className="h-4 w-4" aria-hidden />
          {placed ? "場所OK・変更" : "場所を選ぶ"}
        </button>
      </div>
      {picking ? (
        <PlacePickerDialog
          title={`「${step.place.trim() || `この${itemLabel}`}」の場所`}
          value={placed ? { lat: step.lat!, lng: step.lng! } : null}
          onPick={(place) => onChange({ lat: place?.lat ?? null, lng: place?.lng ?? null })}
          onClose={() => setPicking(false)}
        />
      ) : null}
      <div className="quiz-checkpoint__field">
        <span>着いたことの確かめ方</span>
        <div className="quiz-checkpoint__arrivals" role="radiogroup" aria-label="着いたことの確かめ方">
          {ARRIVALS.map((arrival) => (
            <button
              key={arrival.id}
              type="button"
              role="radio"
              aria-checked={step.arrival === arrival.id}
              className={cn(step.arrival === arrival.id && "is-on")}
              onClick={() => onChange({ arrival: arrival.id })}
            >
              <strong>{arrival.label}</strong>
              <em>{arrival.blurb}</em>
            </button>
          ))}
        </div>
      </div>
      {step.arrival === "gps" ? (
        <>
          <label className="quiz-checkpoint__field">
            <span>判定半径（m）</span>
            <select
              value={preset ? String(step.radius) : "custom"}
              onChange={(event) =>
                onChange({ radius: event.target.value === "custom" ? 40 : Number(event.target.value) })
              }
            >
              {GAME_CHECKIN_RADIUS_PRESETS.map((radius) => (
                <option key={radius} value={radius}>
                  {radius}m
                </option>
              ))}
              <option value="custom">任意</option>
            </select>
            <small>この半径の中にいるときだけ、達成できます。</small>
          </label>
          {preset ? null : (
            <label className="quiz-checkpoint__field">
              <span>任意の半径</span>
              <input
                type="number"
                min={5}
                max={500}
                value={step.radius}
                onChange={(event) => onChange({ radius: Number(event.target.value) })}
              />
            </label>
          )}
          {placed ? null : (
            <small style={{ color: "#c0392b" }}>上の「場所を選ぶ」で場所を決めてください。決めるまでは、確かめずに出します。</small>
          )}
        </>
      ) : null}
      {step.arrival === "keyword" ? (
        <label className="quiz-checkpoint__field">
          <span>合言葉（現地の看板などに書いておく。答えとは別）</span>
          <input
            value={step.keyword}
            maxLength={40}
            placeholder="例：さくら"
            onChange={(event) => onChange({ keyword: event.target.value })}
          />
        </label>
      ) : null}
      {step.arrival !== "none" ? (
        <p className="quiz-checkpoint__lead" style={{ margin: 0 }}>
          {arrivalNote ?? `その場所に着いたことを確かめてから、${itemLabel}を達成にします。`}
        </p>
      ) : null}
    </div>
  );
}
