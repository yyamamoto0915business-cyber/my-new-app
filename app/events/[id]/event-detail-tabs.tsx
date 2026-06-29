"use client";

import type { Event } from "@/lib/db/types";
import { MobileEventDetailView } from "@/components/events/detail/MobileEventDetailView";
import { EventDetailPcView } from "@/components/events/detail/EventDetailPcView";
import { EventQnASection } from "@/components/event-qna-section";
import { EventOrganizerConsultProvider } from "./event-organizer-consult-provider";

type Props = {
  eventId: string;
  eventTitle: string;
  shareUrl: string;
  event: Event;
  organizerId?: string;
  organizerProfileId?: string | null;
  organizerAvatarUrl?: string;
  organizerRegion?: string;
  organizerBio?: string;
  organizerName: string;
  primaryActionsSlot: React.ReactNode;
  pcActionsSlot: React.ReactNode;
  overviewChildren: React.ReactNode;
  participationChildren: React.ReactNode;
  supportBannerSlot?: React.ReactNode;
  receptionLabel: string;
  participationReception: string;
};

export function EventDetailTabs({
  eventId,
  eventTitle,
  shareUrl,
  event,
  organizerId,
  organizerProfileId,
  organizerAvatarUrl,
  organizerRegion,
  organizerBio,
  organizerName,
  primaryActionsSlot,
  pcActionsSlot,
  overviewChildren,
  participationChildren,
  supportBannerSlot,
  receptionLabel,
  participationReception,
}: Props) {
  const qnaPanel = <EventQnASection eventId={eventId} />;

  return (
    <EventOrganizerConsultProvider
      eventId={eventId}
      eventTitle={eventTitle}
      organizerId={organizerId}
      organizerUserId={organizerProfileId}
      organizerName={organizerName}
    >
      <MobileEventDetailView
        eventId={eventId}
        eventTitle={eventTitle}
        shareUrl={shareUrl}
        event={event}
        primaryActionsSlot={primaryActionsSlot}
        overviewChildren={overviewChildren}
        participationChildren={participationChildren}
        qnaChildren={qnaPanel}
        participationReception={participationReception}
        receptionLabel={receptionLabel}
      />

      <EventDetailPcView
        eventId={eventId}
        event={event}
        organizerId={organizerId}
        organizerAvatarUrl={organizerAvatarUrl}
        organizerRegion={organizerRegion}
        organizerBio={organizerBio}
        organizerName={organizerName}
        shareUrl={shareUrl}
        receptionLabel={receptionLabel}
        participationReception={participationReception}
        pcActionsSlot={pcActionsSlot}
      />
    </EventOrganizerConsultProvider>
  );
}
