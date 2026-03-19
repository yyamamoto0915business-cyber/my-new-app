"use client";

import { useRouter } from "next/navigation";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import type { Benefit } from "@/lib/volunteer-roles-mock";
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

function parseDateStart(dateTime: string): Date | null {
  const match = dateTime.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const d = new Date(`${match[1]}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateShort(dateTime: string): string {
  const d = parseDateStart(dateTime);
  if (!d) return dateTime;
  // 例: "2/12(水)"
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
}

export function VolunteerCard({ role, priority = false }: Props) {
  const router = useRouter();

  const { chips, overflowCount } = getDisplayBenefits(role);
  const categoryLabel = getCategoryLabel(role.roleType);
  const isEmergency = role.emergency?.isEmergency === true;
  const area = role.event?.prefecture ?? role.location;
  const formattedDate = formatDateShort(role.dateTime);

  const benefitIcon: Record<Benefit, string> = {
    TRANSPORT: "🚃",
    LODGING: "🏨",
    MEAL: "🍱",
    REWARD: "🎁",
    INSURANCE: "🛡️",
    SHUTTLE: "🚌",
  };

  const trustBadges = [
    role.beginnerFriendly ? "初心者歓迎" : null,
    role.oneDayOk ? "1日だけOK" : null,
    role.organizerVerified ? "主催者確認済み" : null,
    role.contactAvailable ? "問い合わせ可能" : null,
  ].filter(Boolean) as string[];

  const href = `/volunteer/${role.id}`;
  const handleNav = () => router.push(href);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleNav}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNav();
        }
      }}
      className="h-full cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-zinc-900 dark:focus-visible:ring-offset-zinc-900"
      aria-label={`${role.title} の詳細へ`}
    >
      <div className="relative">
        <VolunteerThumbnail
          imageUrl={role.thumbnailUrl}
          alt={role.title}
          roleType={categoryLabel}
          rounded="none"
          className="rounded-none"
          priority={priority}
        />
        {isEmergency && (
          <span className="absolute top-3 left-3 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-lg">
            緊急
          </span>
        )}
      </div>

      <div className="p-4">
        <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
          {role.title}
        </h2>

        <dl className="mt-3 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-zinc-400">
              📅
            </span>
            <span>
              <span className="mr-1 font-medium text-zinc-500 dark:text-zinc-300">
                開催日
              </span>
              {formattedDate}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-zinc-400">
              📍
            </span>
            <span className="line-clamp-1">
              <span className="mr-1 font-medium text-zinc-500 dark:text-zinc-300">
                エリア
              </span>
              {area}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-zinc-400">
              🧭
            </span>
            <span>
              <span className="mr-1 font-medium text-zinc-500 dark:text-zinc-300">
                募集役割
              </span>
              {categoryLabel}・定員{role.capacity}名
            </span>
          </div>
        </dl>

        {role.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {truncate(role.description, 90)}
          </p>
        )}

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map(({ benefit, label }) => (
              <span
                key={benefit}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <span aria-hidden className="text-[12px]">
                  {benefitIcon[benefit]}
                </span>
                {label}
              </span>
            ))}
            {overflowCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                +{overflowCount}
              </span>
            )}
          </div>
        )}

        {trustBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {trustBadges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNav();
            }}
            className="min-h-[44px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            詳細を見る
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNav();
            }}
            className="min-h-[44px] rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            応募する
          </button>
        </div>
      </div>
    </article>
  );
}
