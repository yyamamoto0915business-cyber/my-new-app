"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicPhotoPlay, PublicPhotoSpot } from "@/lib/organizer/photo-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";
import { usePlayCopy } from "@/components/play/usePlayCopy";

type Props = {
  token: string;
  photo: PublicPhotoPlay;
  progress: PlayProgress;
  onProgress: (progress: PlayProgress) => void;
};

export function PlayPhoto({ token, photo, progress, onProgress }: Props) {
  const done = progress.photo?.done ?? [];
  const needed = progress.photo?.needed ?? photo.clearCount;
  const rewards = progress.photo?.rewards ?? photo.rewards;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = usePlayCopy();

  const active = photo.spots.find((spot) => spot.index === activeIndex) ?? null;

  async function shoot(spot: PublicPhotoSpot) {
    if (saving || done.includes(spot.index)) return;
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: stored.deviceToken,
          spotIndex: spot.index,
        }),
      });
      const json = (await res.json()) as { progress?: PlayProgress; error?: string };
      if (!res.ok || !json.progress) {
        setError(json.error ?? "記録を保存できませんでした");
        return;
      }
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
        <h2>{copy.photoDone}</h2>
        <p>{copy.photoScore(photo.spots.length, done.length)}</p>
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
          .filter((line) => !line.includes("ポイントが残ります"))
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
        {active.imageUrl ? <img className="game-test__photo" src={active.imageUrl} alt="" /> : null}
        <h2>{active.name}</h2>
        {active.place ? <p className="game-test__meta">{active.place}</p> : null}
        {active.prompt ? <p>{active.prompt}</p> : null}
        {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
        <div className="play-dock play-dock--pair">
          <button type="button" className="play-dock__go" disabled={saving} onClick={() => void shoot(active)}>
            {saving ? copy.recording : copy.msg(active.actionLabel)}
          </button>
          <button type="button" className="play-dock__ghost" onClick={() => setActiveIndex(null)}>
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
          {done.length} / {needed} {copy.places}
        </p>
      </div>
      <div className="game-test__list">
        {photo.spots.map((spot) => (
          <button
            key={spot.index}
            type="button"
            className={done.includes(spot.index) ? "game-test__item is-done" : "game-test__item"}
            onClick={() => {
              if (done.includes(spot.index)) return;
              setActiveIndex(spot.index);
              setError(null);
            }}
          >
            {spot.name}
            <small>{done.includes(spot.index) ? copy.recorded : spot.place || copy.msg("撮影スポット")}</small>
          </button>
        ))}
      </div>
      {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
    </div>
  );
}
