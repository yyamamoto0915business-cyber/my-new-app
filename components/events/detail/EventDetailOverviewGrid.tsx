"use client";

import { useState } from "react";
import { EventOrganizerCard } from "@/components/events/EventOrganizerCard";
import { EventParticipationMethodCards } from "@/components/events/detail/EventParticipationMethodCards";
import { EventDetailAccessBlock } from "@/components/events/detail/EventDetailAccessBlock";
import { EventDetailVolunteerPromo } from "@/components/events/detail/EventDetailVolunteerPromo";
import { EventDetailSectionCard } from "@/components/events/detail/EventDetailSectionCard";
import type { EventRecurrence } from "@/lib/event-recurrence";

type Props = {
  eventId: string;
  description?: string | null;
  location: string;
  address?: string;
  access?: string | null;
  latitude?: number;
  longitude?: number;
  date: string;
  startTime: string;
  endTime?: string;
  recurrence?: EventRecurrence;
  recurrenceCount?: number | null;
  receptionLabel: string;
  price: number;
  priceNote?: string | null;
  organizerName: string;
  organizerId?: string;
  organizerAvatarUrl?: string;
  organizerRegion?: string;
  organizerBio?: string;
  eventCount?: number;
  /** false = 参加方法は別タブに任せ、概要＋アクセス＋主催者＋ボラのみ */
  showParticipationSummary?: boolean;
};

export function EventDetailOverviewGrid({
  eventId,
  description,
  location,
  address,
  access,
  latitude,
  longitude,
  date,
  startTime,
  endTime,
  recurrence = "none",
  recurrenceCount,
  receptionLabel,
  price,
  priceNote,
  organizerName,
  organizerId,
  organizerAvatarUrl,
  organizerRegion,
  organizerBio,
  eventCount,
  showParticipationSummary = true,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const desc = description?.trim() ?? "";
  const isLong = desc.length > 120;

  return (
    <div className="grid gap-3 min-[900px]:grid-cols-6">
      {desc ? (
        <EventDetailSectionCard
          title="概要"
          className={showParticipationSummary ? "min-[900px]:col-span-3" : "min-[900px]:col-span-6"}
          compact
        >
          <p
            className={
              expanded
                ? "whitespace-pre-wrap text-[13px] leading-6 text-[var(--mg-muted)]"
                : "line-clamp-3 whitespace-pre-wrap text-[13px] leading-6 text-[var(--mg-muted)]"
            }
          >
            {desc}
          </p>
          {isLong ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              {expanded ? "閉じる" : "続きを読む"}
            </button>
          ) : null}
        </EventDetailSectionCard>
      ) : null}

      {showParticipationSummary ? (
        <EventDetailSectionCard
          title="参加方法"
          className={desc ? "min-[900px]:col-span-3" : "min-[900px]:col-span-6"}
          compact
        >
          <EventParticipationMethodCards
            location={location}
            date={date}
            startTime={startTime}
            endTime={endTime}
            recurrence={recurrence}
            recurrenceCount={recurrenceCount}
            receptionLabel={receptionLabel}
            price={price}
            priceNote={priceNote}
            layout="inline"
            compact
          />
        </EventDetailSectionCard>
      ) : null}

      <EventDetailSectionCard title="アクセス" className="min-[900px]:col-span-2" compact>
        <EventDetailAccessBlock
          location={location}
          address={address}
          access={access}
          latitude={latitude}
          longitude={longitude}
          variant="compact"
        />
      </EventDetailSectionCard>

      <EventDetailSectionCard title="このイベントの主催者" className="min-[900px]:col-span-2" compact>
        <EventOrganizerCard
          variant="embedded"
          organizerName={organizerName}
          organizerId={organizerId}
          organizerAvatarUrl={organizerAvatarUrl}
          organizerRegion={organizerRegion}
          organizerBio={organizerBio}
          eventCount={eventCount}
        />
      </EventDetailSectionCard>

      <EventDetailSectionCard title="ボランティア募集" className="min-[900px]:col-span-2" compact>
        <EventDetailVolunteerPromo
          eventId={eventId}
          returnTo={`/events/${eventId}`}
          variant="embedded"
        />
      </EventDetailSectionCard>
    </div>
  );
}
