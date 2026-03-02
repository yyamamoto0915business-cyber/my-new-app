"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const POLL_INTERVAL_MS = 10000;
const BADGE_MAX = 99;

/** 未読件数を取得。RPC 優先、フォールバックで API。フォーカス時・一定間隔で再取得。 */
export function useUnreadCount(enabled = true) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!enabled) return;
    const supabase = createClient();
    if (!supabase) {
      try {
        const res = await fetch("/api/messages/unread-count");
        const data = await res.json();
        setCount(Math.min(Number(data?.count ?? 0) || 0, BADGE_MAX));
      } catch {
        setCount(0);
      }
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCount(0);
        return;
      }

      const { data, error } = await supabase.rpc("get_unread_total");
      if (!error && typeof data === "number") {
        setCount(Math.min(data, BADGE_MAX));
        return;
      }
      if (!error && typeof data === "string") {
        const n = parseInt(data, 10);
        setCount(Number.isNaN(n) ? 0 : Math.min(n, BADGE_MAX));
        return;
      }
      if (typeof data === "bigint") {
        setCount(Math.min(Number(data), BADGE_MAX));
        return;
      }

      const res = await fetch("/api/messages/unread-count");
      const json = await res.json();
      setCount(Math.min(Number(json?.count ?? 0) || 0, BADGE_MAX));
    } catch {
      setCount(0);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchCount();

    const onFocus = () => fetchCount();
    window.addEventListener("focus", onFocus);

    const pollId = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(pollId);
    };
  }, [fetchCount, enabled]);

  return count;
}
