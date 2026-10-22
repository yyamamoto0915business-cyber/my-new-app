"use client";

import { useState } from "react";
import { Lightbulb, MapPin } from "lucide-react";
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
  /** 着いて開いたチェックポイントの問題と、答えるときに一緒に送る証し。 */
  const [opened, setOpened] = useState<
    Record<number, { question: PublicQuizQuestion; here: { lat: number; lng: number } | null; keyword: string }>
  >({});
  const [gateKeyword, setGateKeyword] = useState("");
  const [gateBusy, setGateBusy] = useState(false);
  const [gateNote, setGateNote] = useState<string | null>(null);

  async function openCheckpoint(question: PublicQuizQuestion, here: { lat: number; lng: number } | null) {
    const stored = readPlaySession(token);
    if (!stored) {
      setGateNote("先に参加用QRから入ってください");
      return;
    }
    setGateBusy(true);
    setGateNote(null);
    try {
      const keyword = gateKeyword.trim();
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/quiz-open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken: stored.deviceToken, questionIndex: question.index, here, keyword }),
      });
      const json = (await res.json()) as { question?: PublicQuizQuestion; error?: string };
      if (!res.ok || !json.question) {
        setGateNote(json.error ?? "チェックポイントを確かめられませんでした");
        return;
      }
      setOpened((current) => ({ ...current, [question.index]: { question: json.question!, here, keyword } }));
      setGateKeyword("");
    } catch {
      setGateNote("通信エラーが発生しました");
    } finally {
      setGateBusy(false);
    }
  }

  function checkHere(question: PublicQuizQuestion) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGateNote("この端末では現在地を取れません");
      return;
    }
    setGateBusy(true);
    setGateNote("現在地を確認しています…");
    navigator.geolocation.getCurrentPosition(
      (position) =>
        void openCheckpoint(question, {
          lat: Math.round(position.coords.latitude * 1e6) / 1e6,
          lng: Math.round(position.coords.longitude * 1e6) / 1e6,
        }),
      () => {
        setGateBusy(false);
        setGateNote("現在地を取得できませんでした。位置情報を許可して、もう一度押してください。");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

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
          here: opened[question.index]?.here ?? null,
          keyword: opened[question.index]?.keyword ?? "",
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
  const shown = opened[current.index]?.question ?? current;
  const locked = shown.checkpoint?.locked === true;

  if (locked && shown.checkpoint) {
    const checkpoint = shown.checkpoint;
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
        <div className="play-quiz__gate">
          <span className="play-quiz__gate-icon" aria-hidden>
            <MapPin />
          </span>
          <p className="play-quiz__gate-kicker">{copy.msg("チェックポイント")}</p>
          {checkpoint.place ? <h2>{checkpoint.place}</h2> : null}
          <p>{copy.msg("この場所に着くと、問題が出ます。")}</p>
          {checkpoint.arrival === "keyword" ? (
            <form
              className="play-quiz__gate-form"
              onSubmit={(event) => {
                event.preventDefault();
                void openCheckpoint(current, null);
              }}
            >
              <p>{copy.msg("現地にある合言葉を入れると、問題が開きます。")}</p>
              <input
                value={gateKeyword}
                maxLength={40}
                aria-label={copy.msg("合言葉")}
                placeholder={copy.msg("合言葉")}
                onChange={(event) => setGateKeyword(event.target.value)}
              />
              <button type="submit" className="play-dock__go" disabled={gateBusy || !gateKeyword.trim()}>
                {copy.msg("問題を開く")}
              </button>
            </form>
          ) : (
            <div className="play-quiz__gate-form">
              <p>{copy.msg("着いたら、現在地で確かめます。")}</p>
              <button type="button" className="play-dock__go" disabled={gateBusy} onClick={() => checkHere(current)}>
                {copy.msg("現在地で確かめる")}
              </button>
            </div>
          )}
          {gateNote ? <p className="play-quiz__gate-note">{copy.msg(gateNote)}</p> : null}
        </div>
      </div>
    );
  }

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
      {shown.checkpoint ? (
        <p className="game-test__note is-right">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {copy.msg("着きました。問題に答えてください。")}
        </p>
      ) : null}
      {shown.category ? <em className="game-test__chip">{shown.category}</em> : null}
      {shown.imageUrl ? (
        <img
          className={cn("game-test__photo", shown.format === "photo" && "game-test__photo--large")}
          src={shown.imageUrl}
          alt=""
        />
      ) : null}
      <h2>{shown.prompt}</h2>
      <div className={cn("game-test__choices", shown.format === "ox" && "game-test__choices--ox")}>
        {shown.choices.map((choice, choiceIndex) => {
          const right = verdict === "correct" && picked === choiceIndex;
          const wrong = verdict === "wrong" && picked === choiceIndex;
          return (
            <button
              key={`${shown.index}-${choiceIndex}`}
              type="button"
              className={cn("game-test__choice", right && "is-right", wrong && "is-wrong")}
              disabled={saving || verdict === "correct"}
              onClick={() => void answer(shown, choiceIndex)}
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
