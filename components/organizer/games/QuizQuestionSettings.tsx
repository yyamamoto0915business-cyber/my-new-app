"use client";

import { useState } from "react";
import { BookOpen, Camera, CircleHelp, LocateFixed, MapPin, type LucideIcon } from "lucide-react";
import { SpotPinField } from "@/components/organizer/games/SpotPinField";
import {
  QUIZ_ARRIVALS,
  QUIZ_FORMATS,
  QUIZ_RADIUS_OPTIONS,
  changeQuizFormat,
  type QuizFormatId,
  type QuizQuestion,
} from "@/lib/organizer/quiz";
import { cn } from "@/lib/utils";

export const QUIZ_FORMAT_ICONS: Record<QuizFormatId, LucideIcon> = {
  choice: BookOpen,
  ox: CircleHelp,
  photo: Camera,
  checkin: MapPin,
};

/** この問題の形式。出題形式で選んだもの（と、いまの形式）から選ぶ。 */
export function QuizFormatChips({
  question,
  allowed,
  onChange,
}: {
  question: QuizQuestion;
  allowed: QuizFormatId[];
  onChange: (next: QuizQuestion) => void;
}) {
  const shown = QUIZ_FORMATS.filter((format) => allowed.includes(format.id) || format.id === question.format);
  if (shown.length <= 1) return null;
  return (
    <div className="quiz-format-chips" role="radiogroup" aria-label="この問題の形式">
      {shown.map((format) => {
        const Icon = QUIZ_FORMAT_ICONS[format.id];
        const on = question.format === format.id;
        return (
          <button
            key={format.id}
            type="button"
            role="radio"
            aria-checked={on}
            className={cn(`is-${format.id}`, on && "is-on")}
            onClick={() => onChange(changeQuizFormat(question, format.id))}
          >
            <Icon aria-hidden />
            {format.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * チェックポイント到着の設定。map が true なら地図で場所を決める（フォーム用）。
 * プレビューの中では地図を出さず、現在地を使うボタンだけにする。
 */
export function QuizCheckpointFields({
  question,
  onChange,
  map,
}: {
  question: QuizQuestion;
  onChange: (patch: Partial<QuizQuestion>) => void;
  map: boolean;
}) {
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  if (question.format !== "checkin") return null;
  const placed = question.lat != null && question.lng != null;

  function useHere() {
    if (!navigator.geolocation) {
      setNote("この端末では現在地を取れません");
      return;
    }
    setLocating(true);
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: Math.round(position.coords.latitude * 1e6) / 1e6,
          lng: Math.round(position.coords.longitude * 1e6) / 1e6,
        });
        setLocating(false);
      },
      () => {
        setNote("現在地を取得できませんでした");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }

  return (
    <div className="quiz-checkpoint">
      <p className="quiz-checkpoint__lead">
        <MapPin aria-hidden />
        この場所に着くまで、参加者には問題を見せません。
      </p>
      <label className="quiz-checkpoint__field">
        <span>チェックポイントの名前</span>
        <input
          value={question.place}
          maxLength={40}
          placeholder="例：みらい塔の前"
          onChange={(event) => onChange({ place: event.target.value })}
        />
      </label>
      <div className="quiz-checkpoint__field">
        <span>着いたことの確かめ方</span>
        <div className="quiz-checkpoint__arrivals" role="radiogroup" aria-label="着いたことの確かめ方">
          {QUIZ_ARRIVALS.map((arrival) => (
            <button
              key={arrival.id}
              type="button"
              role="radio"
              aria-checked={question.arrival === arrival.id}
              className={cn(question.arrival === arrival.id && "is-on")}
              onClick={() => onChange({ arrival: arrival.id })}
            >
              <strong>{arrival.label}</strong>
              <em>{arrival.blurb}</em>
            </button>
          ))}
        </div>
      </div>
      {question.arrival === "gps" ? (
        <>
          {map ? (
            <SpotPinField
              lat={question.lat}
              lng={question.lng}
              onChange={(place) => onChange({ lat: place?.lat ?? null, lng: place?.lng ?? null })}
            />
          ) : (
            <div className="quiz-checkpoint__field">
              <span>場所</span>
              <p className={cn("quiz-checkpoint__placed", placed && "is-on")}>
                {placed ? "場所は決まっています" : "まだ決まっていません（フォームの地図でも決められます）"}
              </p>
              <button type="button" className="quiz-checkpoint__here" disabled={locating} onClick={useHere}>
                <LocateFixed aria-hidden />
                {locating ? "現在地を確認しています…" : "いまいる場所にする"}
              </button>
              {note ? <small>{note}</small> : null}
            </div>
          )}
          <label className="quiz-checkpoint__field">
            <span>開く範囲</span>
            <select value={question.radius} onChange={(event) => onChange({ radius: Number(event.target.value) })}>
              {QUIZ_RADIUS_OPTIONS.map((radius) => (
                <option key={radius} value={radius}>
                  半径 {radius}m 以内
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <label className="quiz-checkpoint__field">
          <span>合言葉（現地の看板などに書いておく）</span>
          <input
            value={question.keyword}
            maxLength={40}
            placeholder="例：さくら"
            onChange={(event) => onChange({ keyword: event.target.value })}
          />
        </label>
      )}
    </div>
  );
}
