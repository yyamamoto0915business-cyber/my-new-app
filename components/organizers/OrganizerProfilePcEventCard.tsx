"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarDays, MapPin, Users } from "lucide-react";
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
  // SSR と一致させるため初期は false。localStorage はマウント後に読む
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setSaved(isBookmarked(event.id));
  }, [event.id]);
  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : null;
  const tags = [categoryLabel, isPast ? "終了" : null].filter(Boolean) as string[];

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#fafcf8]"
      style={{ border: "1px solid #e8ede4" }}
    >
      <div
        className="relative h-[84px] w-[112px] shrink-0 overflow-hidden rounded-[8px]"
        style={{ background: "#e8f5e4" }}
      >
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        {tags.length > 0 ? (
          <div className="mb-1 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
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

        <h3
          className="line-clamp-1 text-[15px] font-bold leading-snug"
          style={{ color: "#1a2818" }}
          title={event.title}
        >
          {event.title}
        </h3>

        <div
          className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px]"
          style={{ color: "#3a4a38" }}
        >
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#3a8040]" aria-hidden />
            {formatSchedule(event)}
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#3a8040]" aria-hidden />
            <span className="truncate">{event.location}</span>
          </span>
          {participantCount != null && participantCount > 0 ? (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 shrink-0 text-[#3a8040]" aria-hidden />
              参加者 {participantCount}人
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setSaved(toggleBookmark(event.id));
        }}
        className="mt-0.5 shrink-0 self-start rounded-lg p-1.5 transition-colors hover:bg-[#eef5ef]"
        aria-label={saved ? "保存済み" : "あとで見る"}
      >
        <Bookmark
          className="h-4 w-4"
          style={{ color: saved ? "#3a8040" : "#98a898" }}
          fill={saved ? "#3a8040" : "none"}
        />
      </button>
    </Link>
  );
}
