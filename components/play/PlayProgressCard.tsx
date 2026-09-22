"use client";

import { Stamp } from "lucide-react";
import type { PlayProgress } from "@/lib/organizer/play-types";

export function PlayProgressCard({
  progress,
  highlightSpotId,
  justStampedName,
  alreadyStamped,
}: {
  progress: PlayProgress;
  highlightSpotId?: string | null;
  justStampedName?: string | null;
  alreadyStamped?: boolean;
}) {
  return (
    <div className="play-progress">
      <p className="play-progress__who">{progress.nickname}さん</p>
      {justStampedName ? (
        <p className="play-progress__toast">
          {alreadyStamped
            ? `${justStampedName}は、すでに押してあります`
            : `${justStampedName}のスタンプを押しました`}
        </p>
      ) : null}
      <p className="play-progress__count">
        {progress.spotCount === 0
          ? "スポットはこれから置かれます"
          : `${progress.stampedCount} / ${progress.spotCount} スポット`}
      </p>
      {progress.completed ? (
        <p className="play-progress__done">全部集まりました。お疲れさまでした。</p>
      ) : null}
      {progress.spots.length > 0 ? (
        <ol className="play-progress__list">
          {progress.spots.map((spot) => (
            <li
              key={spot.id}
              className={
                spot.id === highlightSpotId
                  ? "is-current"
                  : spot.stamped
                    ? "is-stamped"
                    : undefined
              }
            >
              <span className="play-progress__mark" aria-hidden>
                {spot.stamped ? (
                  <Stamp className="h-4 w-4" strokeWidth={2.2} />
                ) : (
                  <span />
                )}
              </span>
              <span>
                {spot.name}
                <em>{spot.kindLabel}</em>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
