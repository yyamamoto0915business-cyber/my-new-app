"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getJstTodayYmd } from "@/lib/jst-date";
import { useManageableDayEvents } from "@/hooks/use-manageable-day-events";
import { DayManagementPcView } from "@/components/organizer/day/DayManagementPcView";
import { DayManagementMobileView } from "@/components/organizer/day/DayManagementMobileView";
import {
  EMPTY_DAY_EVENT,
  DayManagementModals,
  type ModalType,
} from "@/components/organizer/day/day-management-shared";

export function DayManagementHub() {
  const router = useRouter();
  const { events, loading } = useManageableDayEvents();
  const [modal, setModal] = useState<ModalType>(null);
  const [announceText, setAnnounceText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [emergencyText, setEmergencyText] = useState("");
  const [memoText, setMemoText] = useState("");
  const today = useMemo(() => getJstTodayYmd(), []);

  useEffect(() => {
    if (loading) return;
    const todayPublic = events.filter((e) => e.date === today && e.status === "public");
    if (todayPublic.length === 1) {
      router.replace(`/organizer/events/${todayPublic[0].id}/day`);
    }
  }, [events, loading, router, today]);

  const openModal = (type: ModalType) => setModal(type);
  const closeModal = () => setModal(null);

  if (!loading && events.filter((e) => e.date === today && e.status === "public").length === 1) {
    return null;
  }

  return (
    <div className="min-h-0 bg-[#F5F8F5] min-[900px]:bg-transparent">
      <div className="mx-auto hidden w-full max-w-6xl min-[900px]:block">
        <DayManagementPcView
          event={EMPTY_DAY_EVENT}
          eventId=""
          dayPhase="live"
          allEvents={events}
          eventsLoading={loading}
          emptyMode
          onOpenModal={openModal}
        />
      </div>

      <div className="mx-auto w-full min-[900px]:hidden">
        <DayManagementMobileView
          event={EMPTY_DAY_EVENT}
          eventId=""
          dayPhase="live"
          allEvents={events}
          eventsLoading={loading}
          emptyMode
          onOpenModal={openModal}
        />
      </div>

      <DayManagementModals
        modal={modal}
        onClose={closeModal}
        eventId=""
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
