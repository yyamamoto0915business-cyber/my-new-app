"use client";

import type { Event } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";
import { EventDetailPcHeroCard } from "@/components/events/detail/pc/EventDetailPcHeroCard";
import { EventDetailPcMainSections } from "@/components/events/detail/pc/EventDetailPcMainSections";
import { EventDetailPcSidebar } from "@/components/events/detail/pc/EventDetailPcSidebar";
import { EventDetailPcVolunteerBanner } from "@/components/events/detail/pc/EventDetailPcVolunteerBanner";
import { useEventVolunteerRecruitment } from "@/hooks/use-event-volunteer-recruitment";

type Props = {
  eventId: string;
  event: Event;
  organizerId?: string;
  organizerAvatarUrl?: string;
  organizerRegion?: string;
  organizerBio?: string;
  organizerName: string;
  shareUrl: string;
  receptionLabel: string;
  participationReception: string;
  pcActionsSlot?: React.ReactNode;
};

export function EventDetailPcView({
  eventId,
  event,
  organizerId,
  organizerAvatarUrl,
  organizerRegion,
  organizerBio,
  organizerName,
  shareUrl,
  receptionLabel,
  participationReception,
  pcActionsSlot,
}: Props) {
  const isAvailable = getEventStatus(event) === "available";
  const { recruitment, hasRecruitment } = useEventVolunteerRecruitment(eventId);

  return (
    <div className="hidden min-[900px]:block">
      <div className="grid grid-cols-1 items-start gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 pr-6">
          <div className="overflow-hidden rounded-2xl border border-[#e8edd8] bg-white shadow-[0_1px_4px_rgba(44,42,40,0.05)]">
            <EventDetailPcHeroCard
              event={event}
              receptionLabel={receptionLabel}
              participationReception={participationReception}
              isAvailable={isAvailable}
              embedded
            />
            {hasRecruitment ? (
              <EventDetailPcVolunteerBanner
                eventId={eventId}
                recruitmentId={recruitment?.id}
                embedded
              />
            ) : null}
          </div>

          <EventDetailPcMainSections
            eventId={eventId}
            event={event}
            organizerId={organizerId}
            organizerAvatarUrl={organizerAvatarUrl}
            organizerRegion={organizerRegion}
            organizerBio={organizerBio}
            organizerName={organizerName}
            hasVolunteerRecruitment={hasRecruitment}
            recruitment={recruitment}
          />
        </div>

        <div className="sticky top-[calc(56px+16px)] flex flex-col gap-2.5 py-2">
          <EventDetailPcSidebar
            shareUrl={shareUrl}
            date={event.date}
            startTime={event.startTime}
            endTime={event.endTime}
            recurrence={event.recurrence ?? "none"}
            recurrenceCount={event.recurrenceCount}
            location={event.location}
            address={event.address}
            participationReception={participationReception}
            receptionLabel={receptionLabel}
            price={event.price ?? 0}
            priceNote={event.priceNote}
            organizerId={organizerId}
            organizerAvatarUrl={organizerAvatarUrl}
            organizerBio={organizerBio}
            organizerName={organizerName}
            isAvailable={isAvailable}
          />
          {pcActionsSlot ? (
            <div className="rounded-2xl border border-[#e8edd8] bg-white p-4">
              {pcActionsSlot}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
