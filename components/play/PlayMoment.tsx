"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Stamp } from "lucide-react";
import { rewardLine, type GameStampAnimation, type GameStampSound, type PublicPlayMoment } from "@/lib/organizer/game-experience";
import { playStampSound } from "@/lib/organizer/play-stamp-sound";
import { usePlayCopy } from "@/components/play/usePlayCopy";

export function playMomentHasClear(moment: PublicPlayMoment | null | undefined): boolean {
  if (!moment?.configured) return false;
  return Boolean(moment.clearTitle || moment.clearMessage || moment.rewardLabel);
}

export function PlaySpotCopy({
  intro,
  description,
  hint,
  imageUrl,
  videoUrl,
  imageAlt,
}: {
  intro: string;
  description: string;
  hint: string;
  imageUrl?: string;
  videoUrl?: string;
  imageAlt?: string;
}) {
  const copy = usePlayCopy();
  if (!intro && !description && !hint && !imageUrl && !videoUrl) return null;
  return (
    <div className="play-spot-copy">
      {videoUrl ? <video className="play-spot__video" src={videoUrl} controls playsInline preload="metadata" /> : null}
      {imageUrl ? <img className="play-spot__photo" src={imageUrl} alt={imageAlt ?? ""} /> : null}
      {intro ? <p>{intro}</p> : null}
      {description ? <p>{description}</p> : null}
      {hint ? <p className="play-spot-copy__hint">{copy.hintLabel}：{hint}</p> : null}
    </div>
  );
}

export function PlayStampBurst({
  message,
  animation,
  already,
  imageUrl,
  sound,
  soundUrl,
}: {
  message: string;
  animation: GameStampAnimation;
  already: boolean;
  imageUrl?: string;
  sound?: GameStampSound;
  soundUrl?: string;
}) {
  useEffect(() => {
    if (already) return;
    if (!soundUrl && (!sound || sound === "none")) return;
    playStampSound(sound ?? "none", soundUrl);
  }, [already, sound, soundUrl]);
  if (already || (!message && !imageUrl)) return null;
  return (
    <div className={`play-stamp play-stamp--${animation}`} role="status">
      {imageUrl ? <img className="play-stamp__mark" src={imageUrl} alt="" /> : <Stamp className="h-8 w-8" strokeWidth={1.7} aria-hidden />}
      {message ? <strong>{message}</strong> : null}
    </div>
  );
}

export function PlayClearPanel({
  moment,
  code,
  used,
  points,
  pointsAwarded,
  badge,
  badgeAwarded,
  badgeImage,
  claimHref,
}: {
  moment: PublicPlayMoment;
  code?: string;
  used?: boolean;
  points?: number;
  pointsAwarded?: boolean;
  badge?: string;
  badgeAwarded?: boolean;
  badgeImage?: string;
  claimHref?: string;
}) {
  const copy = usePlayCopy();
  if (!playMomentHasClear(moment) && !code && !used && !points && !badge) return null;
  return (
    <div className="play-clear">
      {moment.showCharacter ? (
        <Image
          className="play-start__character"
          src="/organizer/games/loading-mascot-1.png"
          alt=""
          width={72}
          height={72}
        />
      ) : null}
      <h2>{copy.msg(moment.clearTitle || "コンプリート！")}</h2>
      {moment.clearMessage ? <p>{moment.clearMessage}</p> : null}
      {moment.rewardLabel ? (
        <p className="play-clear__reward">{copy.msg(rewardLine(moment.rewardKind, moment.rewardLabel))}</p>
      ) : null}
      {used ? (
        <p className="play-clear__used">{copy.used}</p>
      ) : code ? (
        <>
          <p className="play-clear__code">{code}</p>
          <p className="play-clear__code-note">{copy.showCode}</p>
        </>
      ) : null}
      {points ? (
        pointsAwarded ? (
          <p className="play-clear__points">{copy.pointsGot(points)}</p>
        ) : (
          <div className="play-clear__claim">
            <p className="play-clear__points">{copy.pointsReady(points)}</p>
            <p className="play-clear__code-note">{copy.pointsLand}</p>
            {claimHref ? (
              <Link href={claimHref}>{copy.loginToClaim}</Link>
            ) : null}
          </div>
        )
      ) : null}
      {badge ? (
        badgeAwarded ? (
          <div className="play-clear__badge">
            {badgeImage ? <img src={badgeImage} alt="" /> : <span>{badge}</span>}
            <p className="play-clear__points">{copy.badgeGot}</p>
            <Link href="/points#badges">{copy.seeBadges}</Link>
          </div>
        ) : (
          <div className="play-clear__claim">
            <p className="play-clear__points">{copy.badgeReady(badge)}</p>
            <p className="play-clear__code-note">{copy.badgeStays}</p>
            {claimHref ? <Link href={claimHref}>{copy.loginToClaim}</Link> : null}
          </div>
        )
      ) : null}
    </div>
  );
}
