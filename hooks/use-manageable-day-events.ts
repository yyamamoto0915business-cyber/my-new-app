"use client";

import { useEffect, useState } from "react";
import type { DayManageableEvent } from "@/lib/organizer/day-manageable-events";
import { isAbortLikeError } from "@/lib/is-abort-like-error";

export function useManageableDayEvents(initialEvents?: DayManageableEvent[]) {
  const hasInitial = initialEvents !== undefined;
  const [events, setEvents] = useState<DayManageableEvent[]>(() => initialEvents ?? []);
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    if (hasInitial) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/organizer/day-events", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (controller.signal.aborted) return;
        const all: DayManageableEvent[] = Array.isArray(data.events) ? data.events : [];
        setEvents(all);
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
  }, [hasInitial]);

  return { events, loading };
}
