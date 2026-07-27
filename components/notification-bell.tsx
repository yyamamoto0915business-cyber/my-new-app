"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type Props = {
  className?: string;
  /** PC向け: ベルアイコンの横に「お知らせ」を表示 */
  showLabel?: boolean;
};

export function NotificationBell({ className, showLabel = false }: Props) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setUnreadCount(0);
          return;
        }
        const res = await fetchWithTimeout("/api/notifications?count=true");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch {
        if (!cancelled) setUnreadCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  return (
    <Link
      href="/notifications"
      className={cn(
        showLabel
          ? "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[20px] border border-[#c8dcd0] bg-white px-3.5 text-[13px] font-medium text-[#1e3848] transition hover:bg-[#ecf6ee]"
          : "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
        className
      )}
      aria-label={`お知らせ${unreadCount > 0 ? `（${unreadCount}件未読）` : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={showLabel ? "h-[18px] w-[18px] shrink-0" : "h-6 w-6"}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {showLabel && <span>お知らせ</span>}
      {unreadCount > 0 && (
        <span
          className={cn(
            "absolute flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white",
            showLabel ? "-right-1 -top-1" : "-right-0.5 -top-0.5"
          )}
          aria-hidden
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
