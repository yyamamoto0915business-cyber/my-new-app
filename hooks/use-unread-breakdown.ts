"use client";

import { useState, useEffect, useCallback } from "react";

export type UnreadBreakdown = {
  volunteer: number;
  participant: number;
};

/** 主催モード用: 未読内訳（ボランティア/参加者） */
export function useUnreadBreakdown(enabled: boolean) {
  const [breakdown, setBreakdown] = useState<UnreadBreakdown>({
    volunteer: 0,
    participant: 0,
  });

  const fetchBreakdown = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/messages/unread-breakdown");
      const data = await res.json();
      setBreakdown({
        volunteer: Number(data?.volunteer ?? 0) || 0,
        participant: Number(data?.participant ?? 0) || 0,
      });
    } catch {
      setBreakdown({ volunteer: 0, participant: 0 });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchBreakdown();
    const id = setInterval(fetchBreakdown, 10000);
    return () => clearInterval(id);
  }, [fetchBreakdown, enabled]);

  return breakdown;
}
