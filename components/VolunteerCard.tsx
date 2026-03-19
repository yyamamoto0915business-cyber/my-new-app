"use client";

import { useRouter } from "next/navigation";
import { VolunteerThumbnail } from "./volunteer-thumbnail";

type VolunteerCardProps = {
  id: string | number;
  title: string;
  imageUrl?: string | null;
  dateLabel?: string;
  areaLabel?: string;
  roleLabel?: string;
  shortDescription?: string;
  badges?: string[];
  trustBadges?: string[];
  href: string;
};

const badgeIcon: Record<string, string> = {
  "交通費": "🚃",
  "食事": "🍱",
  "宿泊": "🏨",
  "謝礼": "🎁",
  "保険": "🛡️",
  "送迎": "🚌",
  "緊急のみ": "⚡",
};

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export function VolunteerCard({
  id: _id,
  title,
  imageUrl,
  dateLabel,
  areaLabel,
  roleLabel,
  shortDescription,
  badges = [],
  trustBadges = [],
  href,
}: VolunteerCardProps) {
  const router = useRouter();

  const handleNav = () => router.push(href);

  // 上品に見せるため、表示優先度を固定
  const orderedBadges = [...badges].sort((a, b) => {
    const order = ["交通費", "食事", "宿泊", "謝礼", "保険", "送迎"];
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

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
      aria-label={`${title} の詳細へ`}
    >
      <div className="relative">
        <VolunteerThumbnail
          imageUrl={imageUrl}
          alt={title}
          roleType={roleLabel ? roleLabel : undefined}
          rounded="none"
          className="rounded-none"
        />
      </div>

      <div className="p-4">
        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>

        <dl className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          {dateLabel && (
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-zinc-400">
                📅
              </span>
              <span className="font-medium text-zinc-500 dark:text-zinc-300">
                開催日
              </span>
              <span>{dateLabel}</span>
            </div>
          )}

          {areaLabel && (
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-zinc-400">
                📍
              </span>
              <span className="font-medium text-zinc-500 dark:text-zinc-300">
                エリア
              </span>
              <span className="line-clamp-1">{areaLabel}</span>
            </div>
          )}

          {roleLabel && (
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-zinc-400">
                🧭
              </span>
              <span className="font-medium text-zinc-500 dark:text-zinc-300">
                募集役割
              </span>
              <span className="line-clamp-1">{roleLabel}</span>
            </div>
          )}
        </dl>

        {shortDescription && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {truncate(shortDescription, 100)}
          </p>
        )}

        {orderedBadges.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {orderedBadges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <span aria-hidden className="text-[12px]">
                  {badgeIcon[b] ?? "•"}
                </span>
                {b}
              </span>
            ))}
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

