"use client";

import { useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export type EventVolunteerRecruitment = {
  id: string;
  event_id: string | null;
  title: string;
  description: string;
  start_at: string | null;
  end_at: string | null;
  meeting_place: string | null;
  roles: { name: string; count: number }[];
  capacity: number | null;
  items_to_bring: string | null;
  provisions: string | null;
  notes: string | null;
  status: string;
};

export function useEventVolunteerRecruitment(eventId: string) {
  const [recruitment, setRecruitment] = useState<EventVolunteerRecruitment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWithTimeout("/api/recruitments")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: EventVolunteerRecruitment[]) => {
        if (cancelled) return;
        const match = Array.isArray(list)
          ? list.find((r) => r.event_id === eventId && r.status === "public")
          : null;
        setRecruitment(match ?? null);
      })
      .catch(() => {
        if (!cancelled) setRecruitment(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return {
    recruitment,
    hasRecruitment: recruitment != null,
    loading,
  };
}
