"use client";

import { useEffect, useState } from "react";
import type { DashboardEvent } from "@/app/api/organizer/dashboard/route";
import { isManageableDayEvent } from "@/components/organizer/day/day-management-shared";

export function useManageableDayEvents() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/organizer/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (cancelled) return;
        const all: DashboardEvent[] = data.events ?? [];
        setEvents(all.filter(isManageableDayEvent));
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading };
}
