"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicMission, PublicMissionPlay } from "@/lib/organizer/mission-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";
import { usePlayCopy } from "@/components/play/usePlayCopy";

type Props = {
  token: string;
  mission: PublicMissionPlay;
  progress: PlayProgress;
  onProgress: (progress: PlayProgress) => void;
};

export function PlayMission({ token, mission, progress, onProgress }: Props) {
  const done = progress.mission?.done ?? [];
  const needed = progress.mission?.needed ?? mission.clearCount;
  const rewards = progress.mission?.rewards ?? mission.rewards;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = usePlayCopy();

  const active = mission.missions.find((item) => item.index === activeIndex) ?? null;

  async function complete(item: PublicMission) {
    if (saving || done.includes(item.index)) return;
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/mission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: stored.deviceToken,
          missionIndex: item.index,
          keyword,
        }),
      });
      const json = (await res.json()) as {
        done?: boolean;
        note?: string;
        progress?: PlayProgress;
        error?: string;
      };
      if (!res.ok || !json.progress) {
        setError(json.error ?? "達成を保存できませんでした");
        return;
      }
      if (!json.done) {
        setNote(json.note || "ちがいます。もう一度どうぞ。");
        return;
      }
      setKeyword("");
      setNote(null);
      setActiveIndex(null);
      onProgress(json.progress);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (progress.completed) {
    return (
      <div className="play-quiz">
        <p className="game-test__kicker">{copy.cleared}</p>
        <h2>{copy.missionDone}</h2>
        <p>{copy.missionScore(mission.missions.length, done.length)}</p>
        {progress.rewardPoints ? (
          progress.rewardPointsAwarded ? (
            <>
              <p className="play-clear__points">{copy.pointsGot(progress.rewardPoints)}</p>
              <Link className="play-join__login" href="/points">
                {copy.seePoints}
              </Link>
            </>
          ) : (
            <p className="play-clear__points">{copy.pointsReady(progress.rewardPoints)}</p>
          )
        ) : null}
        {rewards
          .filter((line) => line !== "ポイントが残ります。")
          .map((line) => (
            <p key={line} className="game-test__reward">
              {copy.msg(line)}
            </p>
          ))}
      </div>
    );
  }

  if (active) {
    return (
      <div className="play-quiz">
        <p className="game-test__kicker">{copy.msg(active.kindLabel)}</p>
        <h2>{active.name}</h2>
        {active.condition ? <p>{active.condition}</p> : null}
        {active.kind === "keyword" ? (
          <input
            className="game-test__field"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={copy.passphrase}
            aria-label={copy.passphrase}
          />
        ) : null}
        {note ? <p className="game-test__note">{copy.msg(note)}</p> : null}
        {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
        <div className="play-dock play-dock--pair">
          <button type="button" className="play-dock__go" disabled={saving} onClick={() => void complete(active)}>
            {saving ? copy.recording : copy.msg(active.actionLabel)}
          </button>
          <button
            type="button"
            className="play-dock__ghost"
            onClick={() => {
              setActiveIndex(null);
              setNote(null);
              setKeyword("");
            }}
          >
            {copy.backToList}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="play-quiz">
      <div className="game-test__top">
        <p>
          {done.length} / {needed} {copy.doneWord}
        </p>
      </div>
      <div className="game-test__list">
        {mission.missions.map((item) => (
          <button
            key={item.index}
            type="button"
            className={done.includes(item.index) ? "game-test__item is-done" : "game-test__item"}
            onClick={() => {
              if (done.includes(item.index)) return;
              setActiveIndex(item.index);
              setNote(null);
              setError(null);
            }}
          >
            {item.name}
            <small>{done.includes(item.index) ? copy.achieved : copy.msg(item.kindLabel)}</small>
          </button>
        ))}
      </div>
      {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
    </div>
  );
}
