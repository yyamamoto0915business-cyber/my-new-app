"use client";

import { useState } from "react";
import { Lightbulb, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/organizer/quiz";

type Rewards = {
  coupon: boolean;
  prize: boolean;
  ranking: boolean;
};

type Props = {
  name: string;
  description: string;
  questions: QuizQuestion[];
  clearCount: number;
  rewards: Rewards;
  onClose: () => void;
};

export function QuizTestPlay({ name, description, questions, clearCount, rewards, onClose }: Props) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const title = name.trim() || "クイズラリー";
  const question = questions[index] ?? null;
  const total = questions.length;
  const needed = Math.min(Math.max(clearCount, 1), Math.max(total, 1));
  const cleared = correctCount >= needed;
  const waitingAtSpot = question?.format === "checkin" && !arrived;
  const last = index >= total - 1;

  function reset() {
    setStarted(false);
    setIndex(0);
    setArrived(false);
    setPicked(null);
    setVerdict(null);
    setCorrectCount(0);
    setFinished(false);
  }

  function answer(choiceIndex: number) {
    if (!question || verdict === "correct") return;
    setPicked(choiceIndex);
    if (choiceIndex === question.correctIndex) {
      setVerdict("correct");
      setCorrectCount((count) => count + 1);
      return;
    }
    setVerdict("wrong");
  }

  function goNext() {
    if (!last) {
      setIndex((current) => current + 1);
      setArrived(false);
      setPicked(null);
      setVerdict(null);
      return;
    }
    setFinished(true);
  }

  const rewardLines = [
    rewards.coupon ? "クーポンを受け取れます。" : "",
    rewards.prize ? "景品と引き換えできます。" : "",
    rewards.ranking ? "順位は、公開したあとの画面で見られます。" : "",
  ].filter(Boolean);

  return (
    <div className="game-test" role="dialog" aria-modal="true" aria-label="お試しプレイ">
      <div className="game-test__sheet">
        <div className="game-test__bar">
          <p>お試しです。記録や特典の付与はされません。</p>
          <button type="button" onClick={onClose}>
            閉じる
          </button>
        </div>

        {total === 0 ? (
          <div className="play-game__card">
            <h2>{title}</h2>
            <p>問題を1つ入れてから、お試しできます。</p>
          </div>
        ) : !started ? (
          <div className="play-game__card play-start">
            <h2>{title}</h2>
            {description.trim() ? <p>{description.trim()}</p> : null}
            <p className="play-game__meta">
              {total}問 · {needed}問以上でクリア
            </p>
            <button type="button" className="play-start__go" onClick={() => setStarted(true)}>
              クイズをはじめる
            </button>
          </div>
        ) : finished ? (
          <div className="play-game__card">
            <p className="game-test__kicker">{cleared ? "クリア" : "結果"}</p>
            <h2>{cleared ? "クイズ完了" : title}</h2>
            <p>
              {total}問中{correctCount}問、正解しました。
              {cleared ? "お疲れさまでした。" : `クリアは${needed}問以上です。`}
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
        ) : question ? (
          <div className="play-game__card">
            <div className="game-test__top">
              <p>{title}</p>
              <span>
                {index + 1} / {total}
              </span>
            </div>
            {waitingAtSpot ? (
              <>
                <div className="play-quiz__gate">
                  <span className="play-quiz__gate-icon" aria-hidden>
                    <MapPin />
                  </span>
                  <p className="play-quiz__gate-kicker">チェックポイント</p>
                  {question.place.trim() ? <h2>{question.place.trim()}</h2> : null}
                  <p>この場所に着くと、問題が出ます。</p>
                  <p>
                    {question.arrival === "keyword"
                      ? "本番では、現地の合言葉を入れると開きます。"
                      : "本番では、現在地で確かめてから開きます。"}
                  </p>
                  <button type="button" className="play-start__go" onClick={() => setArrived(true)}>
                    着いたことにする（お試し）
                  </button>
                </div>
              </>
            ) : (
              <>
                {question.category ? <em className="game-test__chip">{question.category}</em> : null}
                {question.imageUrl ? (
                  <img
                    className={cn("game-test__photo", question.format === "photo" && "game-test__photo--large")}
                    src={question.imageUrl}
                    alt=""
                  />
                ) : null}
                <h2>{question.prompt.trim() || "問題文がまだありません。"}</h2>
                <div className={cn("game-test__choices", question.format === "ox" && "game-test__choices--ox")}>
                  {question.choices.map((choice, choiceIndex) => {
                    const label = choice.trim() || `選択肢 ${choiceIndex + 1}`;
                    const right = verdict === "correct" && choiceIndex === question.correctIndex;
                    const wrong = verdict === "wrong" && picked === choiceIndex;
                    return (
                      <button
                        key={`${question.key}-${choiceIndex}`}
                        type="button"
                        className={cn("game-test__choice", right && "is-right", wrong && "is-wrong")}
                        onClick={() => answer(choiceIndex)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {verdict === "wrong" ? (
                  <p className="game-test__note">
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                    {question.hint.trim()
                      ? `ちがいます。${question.hint.trim()}`
                      : "ちがいます。もう一度どうぞ。"}
                  </p>
                ) : null}
                {verdict === "correct" ? <p className="game-test__note is-right">正解です。</p> : null}
                {verdict === "correct" ? (
                  <button type="button" className="play-start__go" onClick={goNext}>
                    {last ? "結果を見る" : "次の問題へ"}
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
