"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EventChatButtonProps = {
  eventId: string;
};

export function EventChatButton({ eventId }: EventChatButtonProps) {
  const router = useRouter();
  const [authState, setAuthState] = useState<"loading" | "logged_in" | "logged_out" | "no_supabase">("loading");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setAuthState("no_supabase");
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthState(!!user ? "logged_in" : "logged_out");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(!!session?.user ? "logged_in" : "logged_out");
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleMessage = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          kind: "event_inquiry",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.conversationId) {
        router.push(`/messages/${data.conversationId}`);
      } else {
        router.push("/messages");
      }
    } catch {
      router.push("/messages");
    } finally {
      setCreating(false);
    }
  };

  if (authState === "loading") return null;

  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

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

  if (authState === "logged_out" && !authDisabled) {
    return (
      <Link
        href={`/auth?next=${encodeURIComponent(`/events/${eventId}`)}`}
        className="inline-flex rounded-lg border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        ログインして主催者にメッセージ
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleMessage}
      disabled={creating}
      className="inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {creating ? "作成中..." : "主催者へメッセージ"}
    </button>
  );
}
