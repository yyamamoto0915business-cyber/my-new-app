"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { useManageableDayEvents } from "@/hooks/use-manageable-day-events";
import { DayManagementPcView } from "@/components/organizer/day/DayManagementPcView";
import { DayManagementMobileView } from "@/components/organizer/day/DayManagementMobileView";
import {
  MOCK_EVENT,
  DayManagementModals,
  getEventDayPhase,
  eventDayPhaseLabel,
  type EventInfo,
  type EventDayPhase,
  type ModalType,
} from "@/components/organizer/day/day-management-shared";

export default function DayManagementPage() {
  const params = useParams();
  const [eventId, setEventId] = useState("");
  const [event, setEvent] = useState<EventInfo>(MOCK_EVENT);
  const [dayPhase, setDayPhase] = useState<EventDayPhase>("live");
  const [modal, setModal] = useState<ModalType>(null);
  const [announceText, setAnnounceText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [emergencyText, setEmergencyText] = useState("");
  const [memoText, setMemoText] = useState("");
  const { events: allEvents, loading: eventsLoading } = useManageableDayEvents();

  useEffect(() => {
    const id =
      typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
    setEventId(id);
  }, [params]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout(`/api/organizer/events/${eventId}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled || !data?.title) return;
        const phase = getEventDayPhase({
          date: data.date ?? "",
          status: data.status,
          endTime: data.endTime,
          startTime: data.startTime,
        });
        setDayPhase(phase);
        setEvent({
          title: data.title ?? MOCK_EVENT.title,
          date: data.date
            ? `${data.date} ${data.startTime ?? ""}〜${data.endTime ?? ""}`
            : MOCK_EVENT.date,
          venue: data.location ?? MOCK_EVENT.venue,
          status: eventDayPhaseLabel(phase),
        });
      } catch {
        // mock fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const openModal = (type: ModalType) => setModal(type);
  const closeModal = () => setModal(null);

  return (
    <div className="min-h-0 bg-[#F5F8F5] min-[900px]:bg-transparent">
      <div className="mx-auto hidden w-full max-w-6xl min-[900px]:block">
        <DayManagementPcView
          event={event}
          eventId={eventId}
          dayPhase={dayPhase}
          allEvents={allEvents}
          eventsLoading={eventsLoading}
          onOpenModal={openModal}
        />
      </div>

      <div className="mx-auto w-full min-[900px]:hidden">
        <DayManagementMobileView
          event={event}
          eventId={eventId}
          dayPhase={dayPhase}
          allEvents={allEvents}
          eventsLoading={eventsLoading}
          onOpenModal={openModal}
        />
      </div>

      <DayManagementModals
        modal={modal}
        onClose={closeModal}
        eventId={eventId}
        announceText={announceText}
        onAnnounceChange={setAnnounceText}
        messageText={messageText}
        onMessageChange={setMessageText}
        emergencyText={emergencyText}
        onEmergencyChange={setEmergencyText}
        memoText={memoText}
        onMemoChange={setMemoText}
      />
    </div>
  );
}
