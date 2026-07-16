"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { DashboardStaffMember } from "@/lib/organizer/day-ops-types";

const POLL_MS = 20_000;

type Options = {
  eventId: string;
  emptyMode?: boolean;
  pollMs?: number;
};

export function useStaffStatus({
  eventId,
  emptyMode = false,
  pollMs = POLL_MS,
}: Options) {
  const [members, setMembers] = useState<DashboardStaffMember[]>([]);
  const [loading, setLoading] = useState(!emptyMode && Boolean(eventId));
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!eventId || emptyMode) {
        setMembers([]);
        setLoading(false);
        setError(null);
        return;
      }
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await fetchWithTimeout(
          `/api/organizer/events/${eventId}/staff-status`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.error === "string" ? body.error : "取得に失敗しました"
          );
        }
        const json = (await res.json()) as { members?: DashboardStaffMember[] };
        setMembers(Array.isArray(json.members) ? json.members : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "取得に失敗しました");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId, emptyMode]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!eventId || emptyMode || pollMs <= 0) return;
    const id = window.setInterval(() => {
      void load({ silent: true });
    }, pollMs);
    return () => window.clearInterval(id);
  }, [eventId, emptyMode, pollMs, load]);

  return { members, loading, error, refreshing, reload: load };
}
