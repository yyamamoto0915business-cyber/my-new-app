"use client";

import Link from "next/link";
import type { Event } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";
import { getTagLabel } from "@/lib/db/types";
import { formatEventDateTime } from "@/lib/format-date";
import { EventThumbnail } from "@/components/event-thumbnail";

type Props = { event: Event };

/** 説明を最大文字数で省略 */
function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export function EventCard({ event }: Props) {
  const status = getEventStatus(event);
  const isEnded = status === "ended";

  const featureBadges: { label: string; className: string }[] = [];
  if (event.price === 0) {
    featureBadges.push({
      label: "無料",
      className:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    });
  }
  if (status === "available") {
    featureBadges.push({
      label: "募集中",
      className:
        "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
    });
  } else if (status === "full") {
    featureBadges.push({
      label: "満員",
      className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200",
    });
  } else if (status === "ended") {
    featureBadges.push({
      label: "終了",
      className:
        "bg-zinc-200 text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300",
    });
  }
  if (event.childFriendly) {
    featureBadges.push({
      label: "親子歓迎",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    });
  }

  return (
    <Link
      href={`/events/${event.id}`}
      className={`block overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[var(--border)] dark:bg-[var(--background)] ${
        isEnded ? "opacity-60" : ""
      }`}
    >
      <article>
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          className="rounded-t-xl"
        />
        <div className="p-4 sm:p-5">
          {/* タイトル */}
          <h2 className="font-serif text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100 line-clamp-2">
            {event.title}
          </h2>

          {/* 日時・地域・料金 */}
          <dl className="mt-2 space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-zinc-500 dark:text-zinc-400">
                日時{" "}
              </dt>
              <dd className="inline">
                {formatEventDateTime(event.date, event.startTime)}
                {event.endTime && <span>〜{event.endTime}</span>}
              </dd>
            </div>
            {(event.area || event.city) && (
              <div>
                <dt className="inline font-medium text-zinc-500 dark:text-zinc-400">
                  地域{" "}
                </dt>
                <dd className="inline">
                  {event.area || event.city}
                </dd>
              </div>
            )}
            <div>
              <dt className="inline font-medium text-zinc-500 dark:text-zinc-400">
                料金{" "}
              </dt>
              <dd className="inline">
                {event.price === 0 ? "無料" : `¥${event.price}`}
                {event.priceNote && (
                  <span className="text-zinc-500">
                    （{event.priceNote}）
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {/* 説明文（2行まで） */}
          {event.description && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 line-clamp-2 dark:text-zinc-400">
              {truncate(event.description, 80)}
            </p>
          )}

          {/* タグ・バッジ類 */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {event.tags?.slice(0, 2).map((tagId) => (
              <span
                key={tagId}
                className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
              >
                {getTagLabel(tagId)}
              </span>
            ))}
            {featureBadges.slice(0, 2).map((b) => (
              <span
                key={b.label}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${b.className}`}
              >
                {b.label}
              </span>
            ))}
            {event.salonOnly && featureBadges.length < 2 && (
              <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                サロン限定
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
