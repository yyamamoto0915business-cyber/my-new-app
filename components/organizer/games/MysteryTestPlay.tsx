"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { GameTestSheet } from "@/components/organizer/games/GameTestSheet";
import type { MysteryStep } from "@/lib/organizer/mystery";

type Props = {
  name: string;
  description: string;
  steps: MysteryStep[];
  clearCount: number;
  couponOn: boolean;
  prizeOn: boolean;
  onClose: () => void;
};

export function MysteryTestPlay({
  name,
  description,
  steps,
  clearCount,
  couponOn,
  prizeOn,
  onClose,
}: Props) {
  const visible = steps.filter((step) => step.published && step.prompt.trim() && step.answer.trim());
  const needed = Math.min(Math.max(clearCount, 1), Math.max(visible.length, 1));
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(0);
  const [answer, setAnswer] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [correct, setCorrect] = useState(false);
  const [finished, setFinished] = useState(false);

  const title = name.trim() || "謎解き街歩き";
  const current = visible[index] ?? null;
  const rewards = [
    couponOn ? "クーポンを受け取れます。" : "",
    prizeOn ? "景品を受け取れます。" : "",
  ].filter(Boolean);

  function reset() {
    setStarted(false);
    setIndex(0);
    setSolved(0);
    setAnswer("");
    setNote(null);
    setCorrect(false);
    setFinished(false);
  }

  function submit() {
    if (!current || correct) return;
    if (answer.trim() !== current.answer.trim()) {
      setNote(current.hint.trim() ? `ちがいます。もう一度どうぞ。 ${current.hint.trim()}` : "ちがいます。もう一度どうぞ。");
      return;
    }
    setNote(null);
    setCorrect(true);
    setSolved((count) => count + 1);
  }

  function goNext() {
    const nextSolved = solved;
    if (nextSolved >= needed || index >= visible.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((currentIndex) => currentIndex + 1);
    setAnswer("");
    setNote(null);
    setCorrect(false);
  }

  return (
    <GameTestSheet onClose={onClose}>
      {visible.length === 0 ? (
        <div className="play-game__card">
          <h2>{title}</h2>
          <p>謎を1つ入れてから、お試しできます。</p>
        </div>
      ) : !started ? (
        <div className="play-game__card play-start">
          <h2>{title}</h2>
          {description.trim() ? <p>{description.trim()}</p> : null}
          <p className="play-game__meta">
            {visible.length}問 · {needed}問以上でクリア
          </p>
          <p className="game-test__meta">順に解きます。</p>
          <button type="button" className="play-start__go" onClick={() => setStarted(true)}>
            謎解きをはじめる
          </button>
        </div>
      ) : finished ? (
        <div className="play-game__card">
          <p className="game-test__kicker">クリア</p>
          <h2>謎解き完了</h2>
          <p>
            {visible.length}問中{solved}問、解けました。お疲れさまでした。
          </p>
          {rewards.map((line) => (
            <p key={line} className="game-test__reward">
              {line}
            </p>
          ))}
          <button type="button" className="play-start__go" onClick={reset}>
            はじめから
          </button>
        </div>
      ) : current ? (
        <div className="play-game__card">
          <div className="game-test__top">
            <p>
              {Math.max(solved - (correct ? 1 : 0), 0)} / {needed}
            </p>
            <span>
              {index + 1} / {visible.length}
            </span>
          </div>
          {current.imageUrl ? <img className="game-test__photo" src={current.imageUrl} alt="" /> : null}
          {current.place.trim() ? <p className="game-test__meta">{current.place.trim()}</p> : null}
          <h2>{current.prompt}</h2>
          {correct ? <p className="game-test__note is-right">正解です。</p> : null}
          {correct ? null : (
            <input
              className="game-test__field"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="答え"
              aria-label="答え"
            />
          )}
          {note && !correct ? (
            <p className="game-test__note">
              <Lightbulb className="h-3.5 w-3.5" aria-hidden />
              {note}
            </p>
          ) : null}
          {correct ? (
            <button type="button" className="play-start__go" onClick={goNext}>
              {solved >= needed || index >= visible.length - 1 ? "結果を見る" : "次の謎へ"}
            </button>
          ) : (
            <button type="button" className="play-start__go" onClick={submit}>
              答える
            </button>
          )}
        </div>
      ) : null}
    </GameTestSheet>
  );
}
