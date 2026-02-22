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

  return (
    <article
      className={`rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900/50 ${
        isEnded ? "opacity-60" : "shadow-sm"
      }`}
    >
      <div className="flex flex-wrap gap-1.5">
        {(event.area || event.city) && (
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
            {event.area || event.city}
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
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {truncate(event.description, 100)}
      </p>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div>
          <dt className="inline font-medium text-zinc-500 dark:text-zinc-400">日時 </dt>
          <dd className="inline">
            {formatEventDateTime(event.date, event.startTime)}
            {event.endTime && <span>〜{event.endTime}</span>}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-zinc-500 dark:text-zinc-400">場所 </dt>
          <dd className="inline">{event.location}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-zinc-500 dark:text-zinc-400">料金 </dt>
          <dd className="inline">
            {event.price === 0 ? "入場無料" : `¥${event.price}`}
            {event.priceNote && <span className="text-zinc-500">（{event.priceNote}）</span>}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
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
        </div>
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
