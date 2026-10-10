"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import type { PublicMysteryPlay, PublicMysteryStep } from "@/lib/organizer/mystery-play";
import { nextMysteryIndex } from "@/lib/organizer/mystery-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";
import { usePlayCopy } from "@/components/play/usePlayCopy";

type Props = {
  token: string;
  mystery: PublicMysteryPlay;
  progress: PlayProgress;
  onProgress: (progress: PlayProgress) => void;
};

export function PlayMystery({ token, mystery, progress, onProgress }: Props) {
  const solved = progress.mystery?.solved ?? [];
  const needed = progress.mystery?.needed ?? mystery.needed;
  const rewards = progress.mystery?.rewards ?? mystery.rewards;
  const [answer, setAnswer] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [held, setHeld] = useState<PlayProgress | null>(null);
  const copy = usePlayCopy();

  const currentIndex = nextMysteryIndex(solved, mystery.steps.length);
  const current = mystery.steps.find((step) => step.index === currentIndex) ?? null;

  async function submit(step: PublicMysteryStep) {
    if (saving || held) return;
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/mystery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: stored.deviceToken,
          stepIndex: step.index,
          answer,
        }),
      });
      const json = (await res.json()) as {
        done?: boolean;
        note?: string;
        hint?: string;
        progress?: PlayProgress;
        error?: string;
      };
      if (!res.ok || !json.progress) {
        setError(json.error ?? "答えを保存できませんでした");
        return;
      }
      if (!json.done) {
        setNote(json.note || "ちがいます。もう一度どうぞ。");
        setHint(json.hint ?? "");
        return;
      }
      setAnswer("");
      setNote(null);
      setHint("");
      setHeld(json.progress);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (!held) return;
    onProgress(held);
    setHeld(null);
  }

  if (progress.completed) {
    return (
      <div className="play-quiz">
        <p className="game-test__kicker">{copy.cleared}</p>
        <h2>{copy.mysteryDone}</h2>
        <p>{copy.mysteryScore(mystery.steps.length, solved.length)}</p>
        {rewards.map((line) => (
          <p key={line} className="game-test__reward">
            {copy.msg(line)}
          </p>
        ))}
      </div>
    );
  }

  if (!current) return <p>{copy.noPuzzles}</p>;

  const place = mystery.steps.findIndex((step) => step.index === current.index) + 1;
  const heldSolved = held?.mystery?.solved.length ?? solved.length;

  return (
    <div className="play-quiz">
      <div className="game-test__top">
        <p>
          {solved.length} / {needed} {copy.questions}
        </p>
        <span>
          {place} / {mystery.steps.length}
        </span>
      </div>
      {current.imageUrl ? <img className="game-test__photo" src={current.imageUrl} alt="" /> : null}
      {current.place ? <p className="game-test__meta">{current.place}</p> : null}
      <h2>{current.prompt}</h2>
      {held ? <p className="game-test__note is-right">{copy.correctSaved}</p> : null}
      {held ? null : (
        <input
          className="game-test__field"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder={copy.answerPlaceholder}
          aria-label={copy.answerPlaceholder}
        />
      )}
      {note && !held ? (
        <p className="game-test__note">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden />
          {hint ? `${copy.msg(note)} ${hint}` : copy.msg(note)}
        </p>
      ) : null}
      {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
      <div className="play-dock">
        {held ? (
          <button type="button" className="play-dock__go" onClick={goNext}>
            {heldSolved >= needed ? copy.seeResults : copy.nextPuzzle}
          </button>
        ) : (
          <button type="button" className="play-dock__go" disabled={saving} onClick={() => void submit(current)}>
            {saving ? copy.recording : copy.msg("答える")}
          </button>
        )}
      </div>
    </div>
  );
}
