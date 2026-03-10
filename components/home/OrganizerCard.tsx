"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { FeaturedOrganizer } from "@/lib/db/organizers";

type OrganizerCardProps = {
  organizer: FeaturedOrganizer;
};

export function OrganizerCard({ organizer }: OrganizerCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const showAvatar = organizer.avatarUrl && !avatarError;

  return (
    <Link
      href={`/organizers/${organizer.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-slate-300/80 hover:shadow-md"
    >
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            {showAvatar && organizer.avatarUrl ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-100 sm:h-14 sm:w-14">
                <Image
                  src={organizer.avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  onError={() => setAvatarError(true)}
                />
              </div>
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-500 sm:h-14 sm:w-14"
                aria-hidden
              >
                {organizer.organizationName.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 group-hover:text-slate-700">
              {organizer.organizationName}
            </h3>
            {organizer.region && (
              <p className="mt-0.5 text-xs text-slate-500">{organizer.region}</p>
            )}
            {organizer.bio && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {organizer.bio}
              </p>
            )}
          </div>
        </div>
        {organizer.eventCount > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            開催イベント {organizer.eventCount}件
          </p>
        )}
        <span className="mt-4 inline-flex items-center text-sm font-medium text-slate-600 group-hover:text-slate-800">
          プロフィールを見る
          <span className="ml-1" aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
