"use client";

import { useCallback, useEffect, useState } from "react";
import { isOrganizerConversation, type MessagesScope } from "@/lib/messages-scope";

const POLL_INTERVAL_MS = 30000;
const BADGE_MAX = 99;

type InboxRow = { my_role?: string | null; conversation_kind?: string | null; unread_count?: number | null };

/**
 * チャットの未読の数を、主催者として（organizer）／利用者として（member）に分けて数える。
 * 未読の合計を返すデータベースの関数は主催者・利用者を区別しないので、会話の一覧から数える。
 */
export function useScopedUnreadCount(scope: MessagesScope, enabled = true): number {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/messages/inbox", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const rows = (await res.json()) as InboxRow[];
      if (!Array.isArray(rows)) return;
      const total = rows
        .filter((r) => (scope === "organizer" ? isOrganizerConversation(r) : !isOrganizerConversation(r)))
        .reduce((sum, r) => sum + (Number(r.unread_count) || 0), 0);
      setCount(Math.min(total, BADGE_MAX));
    } catch {
      /* 数が取れなくてもナビは出す */
    }
  }, [enabled, scope]);

  useEffect(() => {
    if (!enabled) return;
    void load();
    const timer = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, load]);

  return count;
}

/** 主催者として参加している会話の未読の数（主催者の下のナビの「チャット」・ホームに出す） */
export function useOrganizerUnreadCount(enabled = true): number {
  return useScopedUnreadCount("organizer", enabled);
}
