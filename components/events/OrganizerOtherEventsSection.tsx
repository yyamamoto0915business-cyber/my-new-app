"use client";

import Link from "next/link";
import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { formatEventDateTime } from "@/lib/format-date";

type OrganizerOtherEventsSectionProps = {
  events: Event[];
  organizerName: string;
  organizerId?: string | null;
};

export function OrganizerOtherEventsSection({
  events,
  organizerName,
  organizerId,
}: OrganizerOtherEventsSectionProps) {
  if (events.length === 0) return null;

  return (
    <section
      className="space-y-4"
      aria-labelledby="organizer-other-events-heading"
    >
      <h2
        id="organizer-other-events-heading"
        className="text-base font-semibold text-slate-900"
      >
        この主催者の他のイベント
      </h2>
      <p className="text-sm text-slate-500">
        {organizerName}
        が開催する他のイベントです。主催者の活動をもっと知りたい方はプロフィールをご覧ください。
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-slate-300/80 hover:shadow-md"
          >
            <EventThumbnail
              imageUrl={event.imageUrl}
              alt={event.title}
              rounded="none"
            />
            <div className="p-4">
              <h3 className="font-medium text-slate-900 line-clamp-2 group-hover:text-slate-700">
                {event.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {formatEventDateTime(event.date, event.startTime)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{event.location}</p>
            </div>
          </Link>
        ))}
      </div>

      {organizerId && (
        <div className="pt-2">
          <Link
            href={`/organizers/${organizerId}`}
            className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
          >
            主催者プロフィールで他イベントを見る →
          </Link>
        </div>
      )}
    </section>
  );
}
