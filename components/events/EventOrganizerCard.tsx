"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type EventOrganizerCardProps = {
  organizerName: string;
  organizerId?: string | null;
  organizerAvatarUrl?: string | null;
  organizerRegion?: string | null;
  organizerBio?: string | null;
  eventCount?: number;
  variant?: "default" | "embedded";
};

export function EventOrganizerCard({
  organizerName,
  organizerId,
  organizerAvatarUrl,
  organizerRegion,
  organizerBio,
  eventCount,
  variant = "default",
}: EventOrganizerCardProps) {
  const profileHref = organizerId ? `/organizers/${organizerId}` : null;
  const [avatarError, setAvatarError] = useState(false);
  const showAvatar = organizerAvatarUrl && !avatarError;

  const isEmbedded = variant === "embedded";

  return (
    <aside
      className={
        isEmbedded
          ? undefined
          : "rounded-2xl border border-[var(--mg-line)] bg-white p-5"
      }
      aria-labelledby={isEmbedded ? undefined : "organizer-card-heading"}
    >
      {!isEmbedded ? (
        <h2
          id="organizer-card-heading"
          className="text-base font-semibold text-[var(--mg-ink)]"
        >
          このイベントの主催者
        </h2>
      ) : null}

      <div
        className={
          isEmbedded
            ? "flex flex-col items-center gap-3 text-center"
            : "mt-4 flex flex-col gap-4 sm:flex-row sm:items-start"
        }
      >
        {/* アイコン */}
        <div className="shrink-0">
          {showAvatar ? (
            <div
              className={
                isEmbedded
                  ? "relative h-12 w-12 overflow-hidden rounded-full bg-slate-100"
                  : "relative h-14 w-14 overflow-hidden rounded-full bg-slate-100 sm:h-16 sm:w-16"
              }
            >
              <Image
                src={organizerAvatarUrl}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
                onError={() => setAvatarError(true)}
              />
            </div>
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500 sm:h-16 sm:w-16"
              aria-hidden
            >
              {organizerName.slice(0, 1)}
            </div>
          )}
        </div>

        {/* 情報 */}
        <div className={isEmbedded ? "min-w-0" : "min-w-0 flex-1"}>
          <p className="font-semibold text-[var(--mg-ink)]">{organizerName}</p>
          {organizerRegion && (
            <p className="mt-0.5 text-sm text-[var(--mg-muted)]">{organizerRegion}</p>
          )}
          {organizerBio && (
            <p
              className={
                isEmbedded
                  ? "mt-2 line-clamp-4 text-xs leading-relaxed text-[var(--mg-muted)]"
                  : "mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--mg-muted)]"
              }
            >
              {organizerBio}
            </p>
          )}
          {eventCount != null && eventCount > 0 && !isEmbedded && (
            <p className="mt-2 text-xs text-[var(--mg-muted)]">
              他 {eventCount} 件のイベントを開催
            </p>
          )}
        </div>
      </div>

      {profileHref && (
        <Link
          href={profileHref}
          className={
            isEmbedded
              ? "mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline"
              : "mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline"
          }
        >
          プロフィールを見る
          <span aria-hidden>›</span>
        </Link>
      )}
    </aside>
  );
}
