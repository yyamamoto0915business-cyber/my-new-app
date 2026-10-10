"use client";

import { useState } from "react";
import { GameTestSheet } from "@/components/organizer/games/GameTestSheet";
import type { PhotoSpot } from "@/lib/organizer/photo";

type Props = {
  name: string;
  description: string;
  spots: PhotoSpot[];
  clearCount: number;
  photoRequired: boolean;
  points: number;
  rewards: { points: boolean; coupon: boolean; prize: boolean };
  onClose: () => void;
};

export function PhotoTestPlay({
  name,
  description,
  spots,
  clearCount,
  photoRequired,
  points,
  rewards,
  onClose,
}: Props) {
  const visible = spots.filter((spot) => spot.name.trim());
  const needed = Math.min(Math.max(clearCount, 1), Math.max(visible.length, 1));
  const [started, setStarted] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const title = name.trim() || "フォトラリー";
  const active = visible.find((spot) => spot.key === activeKey) ?? null;

  function reset() {
    setStarted(false);
    setActiveKey(null);
    setDone([]);
    setFinished(false);
  }

  function shoot(key: string) {
    const next = done.includes(key) ? done : [...done, key];
    setDone(next);
    if (next.length >= needed) setFinished(true);
    else setActiveKey(null);
  }

  const rewardLines = [
    rewards.points ? `${points}ポイントが残ります。` : "",
    rewards.coupon ? "クーポンを受け取れます。" : "",
    rewards.prize ? "景品を受け取れます。" : "",
  ].filter(Boolean);

  return (
    <GameTestSheet onClose={onClose}>
      {visible.length === 0 ? (
        <div className="play-game__card">
          <h2>{title}</h2>
          <p>撮影スポットを1つ入れてから、お試しできます。</p>
        </div>
      ) : !started ? (
        <div className="play-game__card play-start">
          <h2>{title}</h2>
          {description.trim() ? <p>{description.trim()}</p> : null}
          <p className="play-game__meta">
            {visible.length}か所 · {needed}か所以上でクリア
          </p>
          <button type="button" className="play-start__go" onClick={() => setStarted(true)}>
            さんぽをはじめる
          </button>
        </div>
      ) : finished ? (
        <div className="play-game__card">
          <p className="game-test__kicker">クリア</p>
          <h2>フォト完了</h2>
          <p>
            {visible.length}か所中{done.length}か所、写真を残しました。お疲れさまでした。
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
          <h2>{active.name}</h2>
          {active.place ? <p className="game-test__meta">{active.place}</p> : null}
          {active.prompt ? <p>{active.prompt}</p> : null}
          <button type="button" className="play-start__go" onClick={() => shoot(active.key)}>
            {photoRequired ? "写真を残す" : "ここに来た"}
          </button>
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
                  if (!done.includes(spot.key)) setActiveKey(spot.key);
                }}
              >
                {spot.name}
                <small>{done.includes(spot.key) ? "記録しました" : spot.place || "撮影スポット"}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </GameTestSheet>
  );
}
