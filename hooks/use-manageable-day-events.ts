"use client";

import { useEffect, useState } from "react";
import type { DashboardEvent } from "@/app/api/organizer/dashboard/route";
import { isManageableDayEvent } from "@/components/organizer/day/day-management-shared";
import { isAbortLikeError } from "@/lib/is-abort-like-error";

export function useManageableDayEvents() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/organizer/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (controller.signal.aborted) return;
        const all: DashboardEvent[] = data.events ?? [];
        setEvents(all.filter(isManageableDayEvent));
      } catch (err) {
        if (controller.signal.aborted || isAbortLikeError(err)) return;
        setEvents([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  return { events, loading };
}
