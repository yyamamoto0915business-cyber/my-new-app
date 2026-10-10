"use client";

import { useState } from "react";
import { GameTestSheet } from "@/components/organizer/games/GameTestSheet";
import { missionKindLabel, type MissionItem } from "@/lib/organizer/mission";

type Props = {
  name: string;
  description: string;
  missions: MissionItem[];
  clearCount: number;
  hintsOn: boolean;
  rewards: { coupon: boolean; points: boolean; stamp: boolean };
  prizePlace: string;
  onClose: () => void;
};

function quotedKeyword(condition: string): string {
  const matched = condition.match(/[「『]([^」』]+)[」』]/);
  return matched?.[1]?.trim() ?? "";
}

function actionLabel(kind: MissionItem["kind"]): string {
  if (kind === "photo") return "写真を残す";
  if (kind === "checkin") return "チェックインする";
  if (kind === "quiz") return "答えた";
  if (kind === "friends") return "一緒に参加した";
  return "着いた";
}

export function MissionTestPlay({
  name,
  description,
  missions,
  clearCount,
  hintsOn,
  rewards,
  prizePlace,
  onClose,
}: Props) {
  const visible = missions.filter((mission) => mission.published && mission.name.trim());
  const needed = Math.min(Math.max(clearCount, 1), Math.max(visible.length, 1));
  const [started, setStarted] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const title = name.trim() || "ミッション";
  const active = visible.find((mission) => mission.key === activeKey) ?? null;
  const cleared = done.length >= needed;

  function reset() {
    setStarted(false);
    setActiveKey(null);
    setDone([]);
    setKeyword("");
    setNote(null);
    setFinished(false);
  }

  function complete(key: string) {
    const next = done.includes(key) ? done : [...done, key];
    setDone(next);
    setKeyword("");
    setNote(null);
    if (next.length >= needed) setFinished(true);
    else setActiveKey(null);
  }

  function tryKeyword() {
    if (!active) return;
    const expected = quotedKeyword(active.condition);
    if (expected && keyword.trim() !== expected) {
      setNote("ちがいます。もう一度どうぞ。");
      return;
    }
    if (!expected && !keyword.trim()) {
      setNote("合言葉を入れてください。");
      return;
    }
    complete(active.key);
  }

  const rewardLines = [
    rewards.coupon ? "クーポンを受け取れます。" : "",
    rewards.points ? "ポイントが残ります。" : "",
    rewards.stamp ? "スタンプが残ります。" : "",
    prizePlace.trim() ? `${prizePlace.trim()}で受け取れます。` : "",
  ].filter(Boolean);

  return (
    <GameTestSheet onClose={onClose}>
      {visible.length === 0 ? (
        <div className="play-game__card">
          <h2>{title}</h2>
          <p>ミッションを1つ入れてから、お試しできます。</p>
        </div>
      ) : !started ? (
        <div className="play-game__card play-start">
          <h2>{title}</h2>
          {description.trim() ? <p>{description.trim()}</p> : null}
          <p className="play-game__meta">
            {visible.length}件 · {needed}件以上でクリア
          </p>
          <button type="button" className="play-start__go" onClick={() => setStarted(true)}>
            ミッションをはじめる
          </button>
        </div>
      ) : finished ? (
        <div className="play-game__card">
          <p className="game-test__kicker">{cleared ? "クリア" : "結果"}</p>
          <h2>{cleared ? "ミッション完了" : title}</h2>
          <p>
            {visible.length}件中{done.length}件、達成しました。
            {cleared ? "お疲れさまでした。" : `クリアは${needed}件以上です。`}
          </p>
          {cleared
            ? rewardLines.map((line) => (
                <p key={line} className="game-test__reward">
                  {line}
                </p>
              ))
            : null}
          <button type="button" className="play-start__go" onClick={reset}>
            はじめから
          </button>
        </div>
      ) : active ? (
        <div className="play-game__card">
          <p className="game-test__kicker">{missionKindLabel(active.kind)}</p>
          <h2>{active.name}</h2>
          {active.condition && (hintsOn || active.kind !== "keyword") ? <p>{active.condition}</p> : null}
          {active.kind === "keyword" ? (
            <>
              <input
                className="game-test__field"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="合言葉"
                aria-label="合言葉"
              />
              {note ? <p className="game-test__note">{note}</p> : null}
              <button type="button" className="play-start__go" onClick={tryKeyword}>
                答える
              </button>
            </>
          ) : (
            <button type="button" className="play-start__go" onClick={() => complete(active.key)}>
              {actionLabel(active.kind)}
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
            {visible.map((mission) => (
              <button
                key={mission.key}
                type="button"
                className={done.includes(mission.key) ? "game-test__item is-done" : "game-test__item"}
                onClick={() => {
                  if (done.includes(mission.key)) return;
                  setActiveKey(mission.key);
                  setNote(null);
                }}
              >
                {mission.name}
                <small>{done.includes(mission.key) ? "達成" : missionKindLabel(mission.kind)}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </GameTestSheet>
  );
}
