"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { DayOpsTicketSalesSummary } from "@/lib/organizer/day-ops-types";

const POLL_MS = 20_000;

type Options = {
  eventId: string;
  emptyMode?: boolean;
  /** 自動再取得間隔。0 で無効 */
  pollMs?: number;
};

export function useDayOpsSummary({
  eventId,
  emptyMode = false,
  pollMs = POLL_MS,
}: Options) {
  const [data, setData] = useState<DayOpsTicketSalesSummary | null>(null);
  const [loading, setLoading] = useState(!emptyMode && Boolean(eventId));
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!eventId || emptyMode) {
        setData(null);
        setLoading(false);
        setError(null);
        return;
      }
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await fetchWithTimeout(`/api/organizer/events/${eventId}/day-ops`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(typeof body.error === "string" ? body.error : "取得に失敗しました");
        }
        const json = (await res.json()) as DayOpsTicketSalesSummary;
        setData(json);
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

  return { data, loading, error, refreshing, reload: load };
}

export function attendanceToCheckinKpi(summary: DayOpsTicketSalesSummary | null) {
  if (!summary) {
    return { checkedIn: 0, notChecked: 0, cancelled: 0, total: 0 };
  }
  const { checkedIn, notCheckedIn, cancelled } = summary.attendance;
  return {
    checkedIn,
    notChecked: notCheckedIn,
    cancelled,
    total: checkedIn + notCheckedIn + cancelled,
  };
}
