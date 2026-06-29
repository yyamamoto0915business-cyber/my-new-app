"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EventOrganizerConsultModal } from "@/components/events/detail/EventOrganizerConsultModal";
import { createClient } from "@/lib/supabase/client";
import { useEventOrganizerConsultOptional } from "./event-organizer-consult-provider";

const CREATE_CONVERSATION_URL = "/api/conversations";

const API_CREDENTIALS: RequestInit = { credentials: "include" };

type EventChatButtonProps = {
  eventId: string;
  eventTitle?: string;
  organizerId?: string | null;
  /** 主催者の auth.users.id（DB の organizers.profile_id と一致させる） */
  organizerUserId?: string | null;
  organizerName?: string;
  ctaLabel?: string;
  ctaHelper?: string;
  openSignal?: number;
  openIntentId?: string;
};

function logConversationApiError(
  context: string,
  status: number,
  data: Record<string, unknown>
) {
  console.error(`[EventChatButton] ${context}`, {
    status,
    error: data.error,
    step: data.step,
    message: data.message,
    code: data.code,
    details: data.details,
    full: data,
  });
}

function formatStructuredFailure(data: Record<string, unknown>): string {
  const step = typeof data.step === "string" ? data.step : null;
  const msg =
    typeof data.message === "string"
      ? data.message
      : typeof data.error === "string"
        ? data.error
        : "リクエストに失敗しました";
  if (step) return `${step}: ${msg}`;
  return msg;
}

export function EventChatButton({
  eventId,
  eventTitle,
  organizerId,
  organizerUserId,
  organizerName,
  ctaLabel = "このイベントについて相談する",
  ctaHelper = "参加前の質問や相談ができます。主催者へ直接確認できます。",
  openSignal,
  openIntentId,
}: EventChatButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consultCtx = useEventOrganizerConsultOptional();

  const [authState, setAuthState] = useState<
    "loading" | "logged_in" | "logged_out" | "no_supabase"
  >("loading");
  const [modalOpen, setModalOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [modalIntentId, setModalIntentId] = useState<string>("question");
  const [openError, setOpenError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setAuthState("no_supabase");
      return;
    }
    void supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setAuthState(user ? "logged_in" : "logged_out");
      })
      .catch(() => {
        setAuthState("logged_out");
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(!!session?.user ? "logged_in" : "logged_out");
    });
    return () => subscription.unsubscribe();
  }, []);

  const currentEventUrl = `${pathname ?? `/events/${eventId}`}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

  const handleOpenModal = async (intentId?: string) => {
    if (consultCtx) {
      consultCtx.openConsult(intentId);
      return;
    }

    if (opening) return;
    setOpening(true);
    setOpenError(null);
    setModalIntentId(intentId ?? "question");
    try {
      const res = await fetch(CREATE_CONVERSATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventId,
          kind: "event_inquiry",
          ...(organizerId ? { organizerId } : {}),
          ...(organizerUserId ? { organizerUserId } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok || data.ok === false) {
        logConversationApiError("create conversation (open)", res.status, data);
        throw new Error(formatStructuredFailure(data));
      }
      const conversationId = data.conversationId as string | undefined;
      if (!conversationId) throw new Error("会話IDが返ってきませんでした");

      const msgRes = await fetch(
        `/api/messages/conversations/${conversationId}/messages`,
        API_CREDENTIALS
      );
      const msgs = (await msgRes.json().catch(() => [])) as unknown;
      const hasAnyMessages = Array.isArray(msgs) ? msgs.length > 0 : false;

      if (hasAnyMessages) {
        router.push(`/messages/${conversationId}`);
        return;
      }

      setModalOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "開けませんでした。もう一度お試しください。";
      setOpenError(msg);
    } finally {
      setOpening(false);
    }
  };

  const handleSend = async (draft: string) => {
    if (sending) return;
    if (!draft.trim()) {
      setSendError("メッセージを入力してください");
      return;
    }

    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(CREATE_CONVERSATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventId,
          kind: "event_inquiry",
          initialMessage: draft.trim(),
          ...(organizerId ? { organizerId } : {}),
          ...(organizerUserId ? { organizerUserId } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok || data.ok === false) {
        logConversationApiError("create conversation + first message", res.status, data);
        throw new Error(formatStructuredFailure(data));
      }

      const cid = data.conversationId as string | undefined;
      if (!cid) throw new Error("会話IDが返ってきませんでした");

      setModalOpen(false);
      router.push(`/messages/${cid}`);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "送信に失敗しました。もう一度お試しください";
      setSendError(msg);
    } finally {
      setSending(false);
    }
  };

  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  useEffect(() => {
    if (!openSignal || openSignal <= 0) return;
    if (authState === "no_supabase") return;

    if (authState === "logged_out" && !authDisabled) {
      window.location.href = `/auth?next=${encodeURIComponent(currentEventUrl)}`;
      return;
    }

    handleOpenModal(openIntentId ?? "question");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal, openIntentId, authState, authDisabled]);

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

  if (authState === "logged_out" && !authDisabled) {
    return (
      <div className="w-full">
        <Link
          href={`/auth?next=${encodeURIComponent(currentEventUrl)}`}
          className="flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {ctaLabel}
        </Link>
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">{ctaHelper}</p>
      </div>
    );
  }

  const isOpening = opening || consultCtx?.opening;

  return (
    <>
      <div className="w-full">
        <button
          type="button"
          onClick={() => handleOpenModal()}
          disabled={isOpening}
          className="flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {isOpening ? "準備中..." : ctaLabel}
        </button>
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">{ctaHelper}</p>
        {openError && <p className="mt-2 text-xs text-red-600">{openError}</p>}
      </div>

      {!consultCtx && (
        <EventOrganizerConsultModal
          open={modalOpen}
          eventTitle={eventTitle}
          organizerName={organizerName}
          initialIntentId={modalIntentId}
          sending={sending}
          error={sendError}
          onClose={() => {
            setModalOpen(false);
            setSendError(null);
          }}
          onSend={handleSend}
        />
      )}
    </>
  );
}
