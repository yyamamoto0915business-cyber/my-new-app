"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { formatEventDate } from "@/lib/format-date";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";

type Props = {
  event: Event;
  participantCount?: number;
  isPast?: boolean;
};

function formatSchedule(event: Event): string {
  const datePart = formatEventDate(event.date);
  if (!event.startTime) return datePart;
  const time = event.endTime ? `${event.startTime}-${event.endTime}` : event.startTime;
  return `${datePart} ${time}`;
}

export function OrganizerProfilePcEventCard({ event, participantCount, isPast }: Props) {
  const [saved, setSaved] = useState(() => isBookmarked(event.id));
  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : null;
  const tags = [categoryLabel, isPast ? "終了" : null].filter(Boolean) as string[];

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex gap-4 rounded-xl p-3 transition-colors hover:bg-[#fafcf8]"
      style={{ border: "1px solid #e8ede4" }}
    >
      <div
        className="relative h-[120px] w-[160px] shrink-0 overflow-hidden rounded-[10px]"
        style={{ background: "#e8f5e4" }}
      >
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        {tags.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={
                  tag === "終了"
                    ? { background: "#f0f0f0", color: "#888" }
                    : { background: "#eef5ef", color: "#3a8040" }
                }
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <h3 className="text-[16px] font-bold leading-snug" style={{ color: "#1a2818" }}>
          {event.title}
        </h3>

        {event.description ? (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.65]" style={{ color: "#607060" }}>
            {event.description}
          </p>
        ) : null}

        <div className="mt-2.5 flex flex-col gap-1 text-[12.5px]" style={{ color: "#607060" }}>
          <span>{formatSchedule(event)}</span>
          <span>{event.location}</span>
          {participantCount != null && participantCount > 0 ? (
            <span>参加者 {participantCount}人</span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setSaved(toggleBookmark(event.id));
        }}
        className="mt-1 shrink-0 self-start rounded-lg p-2 transition-colors hover:bg-[#eef5ef]"
        aria-label={saved ? "保存済み" : "あとで見る"}
      >
        <Bookmark
          className="h-5 w-5"
          style={{ color: saved ? "#3a8040" : "#98a898" }}
          fill={saved ? "#3a8040" : "none"}
        />
      </button>
    </Link>
  );
}
