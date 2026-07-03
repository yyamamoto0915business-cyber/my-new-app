"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getJstTodayYmd } from "@/lib/jst-date";
import { useManageableDayEvents } from "@/hooks/use-manageable-day-events";
import { DayManagementPcView } from "@/components/organizer/day/DayManagementPcView";
import { DayManagementMobileView } from "@/components/organizer/day/DayManagementMobileView";
import {
  EMPTY_DAY_EVENT,
  MOCK_EVENT,
  DayManagementModals,
  getEventDayPhase,
  eventDayPhaseLabel,
  type EventInfo,
  type EventDayPhase,
  type ModalType,
  organizerDayEventHref,
} from "@/components/organizer/day/day-management-shared";

export function DayManagementHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event")?.trim() ?? "";
  const { events, loading: eventsLoading } = useManageableDayEvents();
  const [event, setEvent] = useState<EventInfo>(MOCK_EVENT);
  const [dayPhase, setDayPhase] = useState<EventDayPhase>("live");
  const [modal, setModal] = useState<ModalType>(null);
  const [announceText, setAnnounceText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [emergencyText, setEmergencyText] = useState("");
  const [memoText, setMemoText] = useState("");
  const today = useMemo(() => getJstTodayYmd(), []);
  const redirectedRef = useRef(false);

  const emptyMode = !eventId;

  useEffect(() => {
    if (eventsLoading || redirectedRef.current || eventId) return;
    const todayPublic = events.filter((e) => e.date === today && e.status === "public");
    if (todayPublic.length === 1) {
      redirectedRef.current = true;
      router.replace(organizerDayEventHref(todayPublic[0].id), { scroll: false });
    }
  }, [eventId, events, eventsLoading, router, today]);

  useEffect(() => {
    if (!eventId) {
      setEvent(EMPTY_DAY_EVENT);
      setDayPhase("live");
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetchWithTimeout(`/api/organizer/events/${eventId}`, {
          signal: controller.signal,
        });
        if (!res.ok || controller.signal.aborted) return;
        const data = await res.json();
        if (controller.signal.aborted || !data?.title) return;
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
      controller.abort();
    };
  }, [eventId]);

  const openModal = (type: ModalType) => setModal(type);
  const closeModal = () => setModal(null);

  const displayEvent = emptyMode ? EMPTY_DAY_EVENT : event;

  return (
    <div className="min-h-0 bg-[#F5F8F5] min-[900px]:bg-transparent">
      <div className="mx-auto hidden w-full max-w-6xl min-[900px]:block">
        <DayManagementPcView
          event={displayEvent}
          eventId={eventId}
          dayPhase={dayPhase}
          allEvents={events}
          eventsLoading={eventsLoading}
          emptyMode={emptyMode}
          onOpenModal={openModal}
        />
      </div>

      <div className="mx-auto w-full min-[900px]:hidden">
        <DayManagementMobileView
          event={displayEvent}
          eventId={eventId}
          dayPhase={dayPhase}
          allEvents={events}
          eventsLoading={eventsLoading}
          emptyMode={emptyMode}
          onOpenModal={openModal}
        />
      </div>

      <DayManagementModals
        modal={modal}
        onClose={closeModal}
        eventId={eventId}
        eventTitle={displayEvent.title}
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
