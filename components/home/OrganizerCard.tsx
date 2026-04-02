"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { FeaturedOrganizer } from "@/lib/db/organizers";
import { CATEGORY_LABELS } from "@/lib/categories";

type OrganizerCardProps = {
  organizer: FeaturedOrganizer;
};

export function OrganizerCard({ organizer }: OrganizerCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const showAvatar = organizer.avatarUrl && !avatarError;
  const tags = organizer.categories.slice(0, 3);

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
            {organizer.activityArea && (
              <p className="mt-0.5 text-xs text-slate-500">{organizer.activityArea}</p>
            )}
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((key) => (
                  <span
                    key={key}
                    className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
                  >
                    {CATEGORY_LABELS[key]}
                  </span>
                ))}
              </div>
            )}
            {organizer.shortBio && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {organizer.shortBio}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {organizer.eventCount > 0 && (
            <span>開催イベント {organizer.eventCount}件</span>
          )}
          {organizer.nextEvent && (
            <span className="text-slate-600">
              次回: {organizer.nextEvent.title}
            </span>
          )}
        </div>
        <span className="mt-4 inline-flex items-center text-sm font-medium text-slate-600 group-hover:text-slate-800">
          プロフィールを見る
          <span className="ml-1" aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
