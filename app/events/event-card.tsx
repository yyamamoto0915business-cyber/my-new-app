"use client";

import Link from "next/link";
import type { Event } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";
import { getTagLabel } from "@/lib/db/types";
import { formatEventDateTime } from "@/lib/format-date";

type Props = { event: Event };

/** 説明を最大文字数で省略 */
function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export function EventCard({ event }: Props) {
  const status = getEventStatus(event);
  const isEnded = status === "ended";
  const isFull = status === "full";

  return (
    <article
      className={`border-b border-zinc-200 py-6 last:border-b-0 dark:border-zinc-700 ${
        isEnded ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap gap-1.5">
        {event.area && (
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
            {event.area}
          </span>
        )}
        {event.tags?.slice(0, 3).map((tagId) => (
          <span
            key={tagId}
            className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
          >
            {getTagLabel(tagId)}
          </span>
        ))}
      </div>

      <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {event.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
        {truncate(event.description, 120)}
      </p>

      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex gap-1">
          <dt className="font-medium text-zinc-500 dark:text-zinc-400 shrink-0">日時</dt>
          <dd>
            {formatEventDateTime(event.date, event.startTime)}
            {event.endTime && <span className="ml-1">〜{event.endTime}</span>}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-medium text-zinc-500 dark:text-zinc-400 shrink-0">場所</dt>
          <dd>{event.location}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-medium text-zinc-500 dark:text-zinc-400 shrink-0">料金</dt>
          <dd>
            {event.price === 0 ? "無料" : `¥${event.price}`}
            {event.priceNote && <span className="ml-1 text-zinc-500">（{event.priceNote}）</span>}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {status === "available" && (
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            募集中
          </span>
        )}
        {status === "full" && (
          <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300">
            満員
          </span>
        )}
        {status === "ended" && (
          <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-600 dark:text-zinc-400">
            終了
          </span>
        )}
        {event.childFriendly && (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            子連れOK
          </span>
        )}
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          もっと見る
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
