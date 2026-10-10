"use client";

import { useState } from "react";
import { GameTestSheet } from "@/components/organizer/games/GameTestSheet";
import { checkinMethodLabel, type CheckinClearMode, type CheckinSpot } from "@/lib/organizer/checkin";

type Props = {
  name: string;
  description: string;
  spots: CheckinSpot[];
  clearMode: CheckinClearMode;
  clearCount: number;
  couponOn: boolean;
  couponName: string;
  pointsOn: boolean;
  points: number;
  stampOn: boolean;
  prizeOn: boolean;
  receivePlace: "app" | "venue";
  onClose: () => void;
};

export function CheckinTestPlay({
  name,
  description,
  spots,
  clearMode,
  clearCount,
  couponOn,
  couponName,
  pointsOn,
  points,
  stampOn,
  prizeOn,
  receivePlace,
  onClose,
}: Props) {
  const visible = spots.filter((spot) => spot.published && spot.name.trim());
  const needed =
    clearMode === "all"
      ? Math.max(visible.length, 1)
      : Math.min(Math.max(clearCount, 1), Math.max(visible.length, 1));
  const [started, setStarted] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const title = name.trim() || "チェックイン";
  const active = visible.find((spot) => spot.key === activeKey) ?? null;

  function reset() {
    setStarted(false);
    setActiveKey(null);
    setDone([]);
    setKeyword("");
    setNote(null);
    setFinished(false);
  }

  function mark(key: string) {
    const next = done.includes(key) ? done : [...done, key];
    setDone(next);
    setKeyword("");
    setNote(null);
    if (next.length >= needed) setFinished(true);
    else setActiveKey(null);
  }

  function tryKeyword() {
    if (!active) return;
    const expected = active.keyword.trim();
    if (!expected) {
      setNote("キーワードがまだ入っていません。");
      return;
    }
    if (keyword.trim() !== expected) {
      setNote("ちがいます。もう一度どうぞ。");
      return;
    }
    mark(active.key);
  }

  const rewardLines = [
    couponOn && couponName.trim() ? couponName.trim() : couponOn ? "クーポンを受け取れます。" : "",
    pointsOn ? `${points}ポイントが残ります。` : "",
    stampOn ? "スタンプが残ります。" : "",
    prizeOn ? "景品を受け取れます。" : "",
    receivePlace === "venue" ? "会場で受け取れます。" : "",
  ].filter(Boolean);

  return (
    <GameTestSheet onClose={onClose}>
      {visible.length === 0 ? (
        <div className="play-game__card">
          <h2>{title}</h2>
          <p>スポットを1つ入れてから、お試しできます。</p>
        </div>
      ) : !started ? (
        <div className="play-game__card play-start">
          <h2>{title}</h2>
          {description.trim() ? <p>{description.trim()}</p> : null}
          <p className="play-game__meta">
            {visible.length}か所 · {needed}か所以上でクリア
          </p>
          <button type="button" className="play-start__go" onClick={() => setStarted(true)}>
            めぐりをはじめる
          </button>
        </div>
      ) : finished ? (
        <div className="play-game__card">
          <p className="game-test__kicker">クリア</p>
          <h2>チェックイン完了</h2>
          <p>
            {visible.length}か所中{done.length}か所を記録しました。お疲れさまでした。
          </p>
          {rewardLines.map((line) => (
            <p key={line} className="game-test__reward">
              {line}
            </p>
          ))}
          <button type="button" className="play-start__go" onClick={reset}>
            はじめから
          </button>
        </div>
      ) : active ? (
        <div className="play-game__card">
          {active.imageUrl ? <img className="game-test__photo" src={active.imageUrl} alt="" /> : null}
          <p className="game-test__kicker">{checkinMethodLabel(active.method)}</p>
          <h2>{active.name}</h2>
          {active.place ? <p>{active.place}</p> : null}
          {active.method === "gps" ? <p className="game-test__meta">半径 {active.radius}m のあたりです。</p> : null}
          {active.method === "keyword" ? (
            <>
              <input
                className="game-test__field"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="キーワード"
                aria-label="キーワード"
              />
              {note ? <p className="game-test__note">{note}</p> : null}
              <button type="button" className="play-start__go" onClick={tryKeyword}>
                答える
              </button>
            </>
          ) : (
            <button type="button" className="play-start__go" onClick={() => mark(active.key)}>
              {active.method === "qr" ? "QRを読み取った" : "この場所にいる"}
            </button>
          )}
          <button type="button" className="game-test__back" onClick={() => setActiveKey(null)}>
            一覧へ戻る
          </button>
        </div>
      ) : (
        <div className="play-game__card">
          <div className="game-test__top">
            <p>{title}</p>
            <span>
              {done.length} / {needed}
            </span>
          </div>
          <div className="game-test__list">
            {visible.map((spot) => (
              <button
                key={spot.key}
                type="button"
                className={done.includes(spot.key) ? "game-test__item is-done" : "game-test__item"}
                onClick={() => {
                  if (done.includes(spot.key)) return;
                  setActiveKey(spot.key);
                  setKeyword("");
                  setNote(null);
                }}
              >
                {spot.name}
                <small>{done.includes(spot.key) ? "記録しました" : checkinMethodLabel(spot.method)}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </GameTestSheet>
  );
}
