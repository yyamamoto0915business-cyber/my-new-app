"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicQuiz, PublicQuizQuestion } from "@/lib/organizer/quiz-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";
import { usePlayCopy } from "@/components/play/usePlayCopy";

type Props = {
  token: string;
  quiz: PublicQuiz;
  progress: PlayProgress;
  onProgress: (progress: PlayProgress) => void;
};

export function PlayQuiz({ token, quiz, progress, onProgress }: Props) {
  const solved = progress.quiz?.solved ?? [];
  const needed = progress.quiz?.needed ?? quiz.clearCount;
  const rewards = progress.quiz?.rewards ?? quiz.rewards;
  const current = quiz.questions.find((question) => !solved.includes(question.index)) ?? null;
  const [picked, setPicked] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<"correct" | "wrong" | null>(null);
  const [hint, setHint] = useState("");
  const [held, setHeld] = useState<PlayProgress | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = usePlayCopy();

  async function answer(question: PublicQuizQuestion, choiceIndex: number) {
    if (verdict === "correct" || saving) return;
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setSaving(true);
    setError(null);
    setPicked(choiceIndex);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: stored.deviceToken,
          questionIndex: question.index,
          choiceIndex,
        }),
      });
      const json = (await res.json()) as {
        correct?: boolean;
        hint?: string;
        progress?: PlayProgress;
        error?: string;
      };
      if (!res.ok || !json.progress) {
        setError(json.error ?? "回答を保存できませんでした");
        setPicked(null);
        return;
      }
      if (json.correct) {
        setVerdict("correct");
        setHint("");
        setHeld(json.progress);
        return;
      }
      setVerdict("wrong");
      setHint(json.hint?.trim() || "ちがいます。もう一度どうぞ。");
    } catch {
      setError("通信エラーが発生しました");
      setPicked(null);
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (!held) return;
    onProgress(held);
    setHeld(null);
    setPicked(null);
    setVerdict(null);
    setHint("");
  }

  if (progress.completed) {
    return (
      <div className="play-quiz">
        <p className="game-test__kicker">{copy.cleared}</p>
        <h2>{copy.quizDone}</h2>
        <p>{copy.quizScore(quiz.questions.length, solved.length)}</p>
        {progress.quizRank ? <p className="play-clear__points">{copy.rankLine(progress.quizRank)}</p> : null}
        {progress.rewardUsed ? (
          <p className="play-clear__used">{copy.used}</p>
        ) : progress.rewardCode ? (
          <>
            <p className="play-clear__code">{progress.rewardCode}</p>
            <p className="play-clear__code-note">{copy.showCode}</p>
          </>
        ) : null}
        {rewards
          .filter((line) => {
            if (progress.quizRank && line === "順位は、結果の画面で見られます。") return false;
            if ((progress.rewardCode || progress.rewardUsed) && line === "クーポンを受け取れます。") return false;
            return true;
          })
          .map((line) => (
            <p key={line} className="game-test__reward">
              {copy.msg(line)}
            </p>
          ))}
      </div>
    );
  }

  if (!current) {
    return <p>{copy.noQuestions}</p>;
  }

  const place = quiz.questions.findIndex((question) => question.index === current.index) + 1;

  return (
    <div className="play-quiz">
      <div className="game-test__top">
        <p>
          {solved.length} / {needed} {copy.correctCount}
        </p>
        <span>
          {place} / {quiz.questions.length}
        </span>
      </div>
      {current.category ? <em className="game-test__chip">{current.category}</em> : null}
      {current.imageUrl ? <img className="game-test__photo" src={current.imageUrl} alt="" /> : null}
      <h2>{current.prompt}</h2>
      <div className="game-test__choices">
        {current.choices.map((choice, choiceIndex) => {
          const right = verdict === "correct" && picked === choiceIndex;
          const wrong = verdict === "wrong" && picked === choiceIndex;
          return (
            <button
              key={`${current.index}-${choiceIndex}`}
              type="button"
              className={cn("game-test__choice", right && "is-right", wrong && "is-wrong")}
              disabled={saving || verdict === "correct"}
              onClick={() => void answer(current, choiceIndex)}
            >
              {choice}
            </button>
          );
        })}
      </div>
      {verdict === "wrong" ? (
        <p className="game-test__note">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden />
          {copy.wrongHint(hint)}
        </p>
      ) : null}
      {verdict === "correct" ? <p className="game-test__note is-right">{copy.correctSaved}</p> : null}
      {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
      {verdict === "correct" ? (
        <div className="play-dock">
          <button type="button" className="play-dock__go" onClick={goNext}>
            {(held?.quiz?.solved.length ?? solved.length) >= needed ? copy.seeResults : copy.nextQuestion}
          </button>
        </div>
      ) : null}
    </div>
  );
}
