"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Flag, Gift, MapPin, QrCode, Share2, Stamp, Ticket, type LucideIcon } from "lucide-react";
import type { GameHowtoIcon } from "@/lib/organizer/game-experience";
import { usePlayCopy } from "@/components/play/usePlayCopy";
import type { PlayStart } from "@/components/play/rally/types";
import "./rally.css";

const HOWTO_ICONS: Record<GameHowtoIcon, LucideIcon> = {
  pin: MapPin,
  qr: QrCode,
  stamp: Stamp,
  gift: Gift,
  flag: Flag,
};

export function RallyStartScreen({
  start,
  title,
  fallbackDescription,
  showLogin,
  loginHref,
  shareNote,
  onShare,
  onStart,
}: {
  start: PlayStart | null;
  title: string;
  fallbackDescription: string;
  showLogin: boolean;
  loginHref: string;
  shareNote: string | null;
  onShare: () => void;
  onStart: () => void;
}) {
  const copy = usePlayCopy();
  const description = start?.description.trim() || fallbackDescription;
  const buttonLabel = start?.buttonLabel.trim() || "ラリーをはじめる";
  const hasMedia = Boolean(start?.videoUrl || start?.imageUrl);
  const showInfo = Boolean(start?.periodLabel || start?.showFreeBadge || (start && start.steps.length > 0));

  return (
    <main className={hasMedia ? "rally-start" : "rally-start rally-start--plain"}>
      <div className="rally-start__media" aria-hidden>
        {start?.videoUrl ? (
          <video src={start.videoUrl} poster={start.imageUrl || undefined} autoPlay muted loop playsInline />
        ) : start?.imageUrl ? (
          <img src={start.imageUrl} alt="" />
        ) : null}
      </div>
      <div className="rally-start__shade" aria-hidden />

      <div className="rally-start__body">
        <div className="rally-start__hero">
          {start?.showCharacter ? (
            <Image
              className="rally-start__character"
              src="/organizer/games/loading-mascot-1.png"
              alt=""
              width={64}
              height={64}
            />
          ) : null}
          {start?.catchCopy ? <p className="rally-start__catch">{start.catchCopy}</p> : null}
          <h1 className="rally-start__title">{title}</h1>
          {description ? <p className="rally-start__desc">{description}</p> : null}
        </div>

        <div className="rally-start__foot">
          {showInfo ? (
            <div className="rally-start__info">
              {start?.periodLabel ? (
                <p>
                  <CalendarDays aria-hidden />
                  {copy.msg(start.periodLabel)}
                </p>
              ) : null}
              {start?.showFreeBadge ? (
                <p className="rally-start__free">
                  <Ticket aria-hidden />
                  {copy.freeToJoin}
                </p>
              ) : null}
              {start && start.steps.length > 0 ? (
                <ol className="rally-start__steps">
                  {start.steps.map((step, index) => {
                    const Icon = HOWTO_ICONS[step.icon];
                    return (
                      <li key={`${step.icon}-${index}`}>
                        <span aria-hidden>
                          <Icon />
                        </span>
                        {step.label}
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </div>
          ) : null}

          <button type="button" className="rally-cta" onClick={onStart}>
            {copy.msg(buttonLabel)}
            <ArrowRight aria-hidden />
          </button>
          {showLogin || start?.showShare ? (
            <div className="rally-start__sub">
              {showLogin ? (
                <Link className="rally-start__subbtn" href={loginHref}>
                  {copy.login}
                </Link>
              ) : null}
              {start?.showShare ? (
                <button type="button" className="rally-start__subbtn" onClick={onShare}>
                  <Share2 aria-hidden />
                  {copy.share}
                </button>
              ) : null}
            </div>
          ) : null}
          {shareNote ? (
            <p className="rally-start__note" role="status">
              {copy.msg(shareNote)}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
