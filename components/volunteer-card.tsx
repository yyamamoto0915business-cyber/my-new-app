"use client";

import Link from "next/link";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import { getDisplayBenefits, getCategoryLabel } from "@/lib/volunteer-utils";
import { VolunteerThumbnail } from "./volunteer-thumbnail";

type Props = {
  role: VolunteerRoleWithEvent;
  priority?: boolean;
};

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export function VolunteerCard({ role, priority = false }: Props) {
  const { chips, overflowCount } = getDisplayBenefits(role);
  const categoryLabel = getCategoryLabel(role.roleType);
  const isEmergency = role.emergency?.isEmergency === true;

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/80">
      <Link href={`/volunteer/${role.id}`} className="block relative">
        <VolunteerThumbnail
          imageUrl={role.thumbnailUrl}
          alt={role.title}
          roleType={categoryLabel}
          rounded="none"
          className="rounded-t-xl"
          priority={priority}
        />
        {isEmergency && (
          <span className="absolute top-2 left-2 rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white shadow-md">
            緊急
          </span>
        )}
      </Link>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {categoryLabel}
          </span>
        </div>

        <h2 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">
          {role.title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
          {truncate(role.description, 80)}
        </p>

        {role.event && (
          <p className="mt-2 text-xs text-zinc-500">
            {role.event.title}
            {role.event.prefecture && ` · ${role.event.prefecture}`}
          </p>
        )}

        <dl className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-zinc-400" aria-hidden>📅</span>
            <span>{role.dateTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-zinc-400" aria-hidden>📍</span>
            <span className="line-clamp-1">{role.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-zinc-400" aria-hidden>👥</span>
            <span>定員{role.capacity}名</span>
          </div>
        </dl>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {chips.map(({ benefit, label }) => (
              <span
                key={benefit}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
              >
                {label}
              </span>
            ))}
            {overflowCount > 0 && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-500">
                +{overflowCount}
              </span>
            )}
          </div>
        )}

        <div className="mt-4">
          <Link
            href={`/volunteer/${role.id}`}
            className="inline-flex w-full justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            詳細を見る
          </Link>
        </div>
      </div>
    </article>
  );
}
