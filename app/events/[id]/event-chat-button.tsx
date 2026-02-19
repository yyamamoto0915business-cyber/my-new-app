"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EventChatButtonProps = {
  eventId: string;
};

export function EventChatButton({ eventId }: EventChatButtonProps) {
  const [authState, setAuthState] = useState<"loading" | "logged_in" | "logged_out" | "no_supabase">("loading");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setAuthState("no_supabase");
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthState(!!user ? "logged_in" : "logged_out");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState(!!session?.user ? "logged_in" : "logged_out");
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  if (authState === "loading") return null;

  if (authState === "no_supabase") {
    return (
      <p className="text-sm text-zinc-500">
        主催者への質問は Supabase 連携時にご利用ください。{" "}
        <Link
          href={`/events/${eventId}/chat`}
          className="text-[var(--accent)] underline-offset-2 hover:underline"
        >
          設定方法を見る
        </Link>
      </p>
    );
  }

  if (authState === "logged_out") {
    return (
      <Link
        href={`/login?returnTo=${encodeURIComponent(`/events/${eventId}/chat`)}`}
        className="inline-flex rounded-lg border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        ログインして質問する
      </Link>
    );
  }

  return (
    <Link
      href={`/events/${eventId}/chat`}
      className="inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
    >
      主催者への質問（Q&A）
    </Link>
  );
}
