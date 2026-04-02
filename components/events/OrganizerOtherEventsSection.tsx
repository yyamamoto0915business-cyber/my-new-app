"use client";

import type { Event } from "@/lib/db/types";
import { CompactEventListSection } from "@/components/events/CompactEventListSection";

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
    <CompactEventListSection
      title="この主催者の他のイベント"
      subtitle={`${organizerName}が開催する他のイベントです。`}
      events={events.slice(0, 4)}
      moreHref={organizerId ? `/organizers/${organizerId}` : undefined}
      moreLabel="主催者ページへ"
    />
  );
}
