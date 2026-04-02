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
};

export function EventOrganizerCard({
  organizerName,
  organizerId,
  organizerAvatarUrl,
  organizerRegion,
  organizerBio,
  eventCount,
}: EventOrganizerCardProps) {
  const profileHref = organizerId ? `/organizers/${organizerId}` : null;
  const [avatarError, setAvatarError] = useState(false);
  const showAvatar = organizerAvatarUrl && !avatarError;

  return (
    <aside
      className="rounded-[24px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)] sm:p-5"
      aria-labelledby="organizer-card-heading"
    >
      <h2
        id="organizer-card-heading"
        className="text-[16px] font-semibold text-slate-900"
      >
        このイベントの主催者
      </h2>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* アイコン */}
        <div className="shrink-0">
          {showAvatar ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-slate-100 sm:h-16 sm:w-16">
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
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{organizerName}</p>
          {organizerRegion && (
            <p className="mt-0.5 text-sm text-slate-500">{organizerRegion}</p>
          )}
          {organizerBio && (
            <p className="mt-2 line-clamp-3 text-sm text-slate-600">
              {organizerBio}
            </p>
          )}
          {eventCount != null && eventCount > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              他 {eventCount} 件のイベントを開催
            </p>
          )}
        </div>
      </div>

      {profileHref && (
        <Link
          href={profileHref}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors active:bg-slate-50"
        >
          主催者プロフィールを見る
        </Link>
      )}
    </aside>
  );
}
