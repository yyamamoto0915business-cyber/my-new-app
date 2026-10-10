"use client";

import type { ReactNode } from "react";
import { Stamp } from "lucide-react";
import type { PlayProgress, PlaySpotProgress } from "@/lib/organizer/play-types";
import { usePlayCopy } from "@/components/play/usePlayCopy";

function nextSpot(progress: PlayProgress): PlaySpotProgress | null {
  if (progress.completed || progress.spots.length === 0) return null;
  if (progress.nextSpotId) {
    return progress.spots.find((spot) => spot.id === progress.nextSpotId) ?? null;
  }
  if (progress.ordered) {
    return progress.spots.find((spot) => !spot.stamped) ?? null;
  }
  return null;
}

function cellClass(spot: PlaySpotProgress, current: boolean): string | undefined {
  const names = ["play-card__cell"];
  if (spot.stamped) names.push("is-stamped");
  if (current) names.push("is-current");
  if (spot.kind === "goal") names.push("is-goal");
  return names.join(" ");
}

function StampCell({
  spot,
  index,
  current,
  fresh,
  next,
  stampImageUrl,
  onPick,
}: {
  spot: PlaySpotProgress;
  index: number;
  current: boolean;
  fresh: boolean;
  next: boolean;
  stampImageUrl?: string;
  onPick?: (spotId: string) => void;
}) {
  const copy = usePlayCopy();
  const photo = spot.stamped && spot.imageUrl ? spot.imageUrl : "";
  const names = cellClass(spot, current);
  const mark = spot.stamped ? (
    stampImageUrl ? <img className="play-card__mark" src={stampImageUrl} alt="" /> : <Stamp className="h-5 w-5" strokeWidth={2.1} />
  ) : (
    <span className="play-card__num">{index}</span>
  );
  return (
    <li className={next ? `${names} is-next` : names}>
      {onPick ? (
        <button type="button" className="play-card__pick" onClick={() => onPick(spot.id)}>
          <span className="play-card__seal" aria-hidden>
            {photo ? <img src={photo} alt="" /> : null}
            {mark}
          </span>
          <span className="play-card__name">{spot.name}</span>
        </button>
      ) : (
      <span className="play-card__seal" aria-hidden>
        {photo ? <img src={photo} alt="" /> : null}
        {mark}
      </span>
      )}
      {onPick ? null : <span className="play-card__name">{spot.name}</span>}
      {fresh ? <span className="play-card__now">{copy.justStamped}</span> : null}
      {next ? <span className="play-card__next">{copy.next}</span> : null}
    </li>
  );
}

function StampBoard({
  spots,
  highlightSpotId,
  fresh,
  ordered,
  stampImageUrl,
  onPick,
  explicitNext,
}: {
  spots: PlaySpotProgress[];
  highlightSpotId?: string | null;
  fresh: boolean;
  ordered: boolean;
  stampImageUrl?: string;
  onPick?: (spotId: string) => void;
  explicitNext?: string | null;
}) {
  const copy = usePlayCopy();
  const nextSpotId =
    explicitNext !== undefined
      ? explicitNext
      : ordered
        ? (spots.find((spot) => !spot.stamped)?.id ?? null)
        : null;
  const cell = (spot: PlaySpotProgress, index: number) => (
    <StampCell
      key={spot.id}
      spot={spot}
      index={index}
      current={spot.id === highlightSpotId}
      fresh={fresh && spot.id === highlightSpotId}
      next={spot.id === nextSpotId}
      stampImageUrl={stampImageUrl}
      onPick={onPick}
    />
  );
  if (ordered) {
    return (
      <div className="play-card">
        <ol className="play-card__grid">
          {spots.map((spot, index) => cell(spot, index + 1))}
        </ol>
      </div>
    );
  }
  const places = spots.filter((spot) => spot.kind !== "goal");
  const goals = spots.filter((spot) => spot.kind === "goal");
  return (
    <div className="play-card">
      {places.length > 0 ? (
        <ol className="play-card__grid">
          {places.map((spot, index) => cell(spot, index + 1))}
        </ol>
      ) : null}
      {goals.length > 0 ? (
        <>
          <p className="play-card__goal">{copy.goal}</p>
          <ol className="play-card__grid">
            {goals.map((spot, index) => cell(spot, places.length + index + 1))}
          </ol>
        </>
      ) : null}
    </div>
  );
}

export function PlayProgressCard({
  progress,
  highlightSpotId,
  justStampedName,
  alreadyStamped,
  quietToast,
  quietDone,
  asCard,
  onPick,
  children,
}: {
  progress: PlayProgress;
  highlightSpotId?: string | null;
  justStampedName?: string | null;
  alreadyStamped?: boolean;
  quietToast?: boolean;
  quietDone?: boolean;
  asCard?: boolean;
  onPick?: (spotId: string) => void;
  children?: ReactNode;
}) {
  const copy = usePlayCopy();
  const upcoming = nextSpot(progress);
  return (
    <div className="play-progress">
      <div className="play-progress__head">
        <p className="play-progress__count">
          {progress.spotCount === 0
            ? copy.spotsSoon
            : `${progress.stampedCount} / ${progress.spotCount}`}
        </p>
        {upcoming ? (
          <p className="play-progress__nextline">
            <span>{copy.next}</span>
            {upcoming.name}
          </p>
        ) : null}
        <p className="play-progress__who">{copy.player(progress.nickname)}</p>
      </div>
      {children}
      {justStampedName && !quietToast ? (
        <p className="play-progress__toast">
          {alreadyStamped ? copy.alreadyStamped(justStampedName) : copy.stampedName(justStampedName)}
        </p>
      ) : null}
      {progress.completed && !quietDone ? (
        <p className="play-progress__done">
          {progress.stampedCount >= progress.spotCount ? copy.allCollected : copy.goalCollected}
        </p>
      ) : null}
      {progress.spots.length > 0 && asCard ? (
        <StampBoard
          spots={progress.spots}
          highlightSpotId={highlightSpotId}
          fresh={Boolean(highlightSpotId) && !alreadyStamped}
          ordered={progress.ordered === true}
          stampImageUrl={progress.stampImageUrl}
          onPick={onPick}
          explicitNext={progress.nextSpotId}
        />
      ) : null}
      {progress.spots.length > 0 && !asCard ? (
        <ol className="play-progress__list">
          {progress.spots.map((spot) => (
            <li
              key={spot.id}
              className={
                spot.id === highlightSpotId ? "is-current" : spot.stamped ? "is-stamped" : undefined
              }
            >
              <span className="play-progress__mark" aria-hidden>
                {spot.stamped ? <Stamp className="h-4 w-4" strokeWidth={2.2} /> : <span />}
              </span>
              <span>
                {spot.name}
                <em>{copy.msg(spot.kindLabel)}</em>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
