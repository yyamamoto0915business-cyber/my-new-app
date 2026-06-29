"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EventOrganizerConsultModal } from "@/components/events/detail/EventOrganizerConsultModal";
import { createClient } from "@/lib/supabase/client";

const CREATE_CONVERSATION_URL = "/api/conversations";
const API_CREDENTIALS: RequestInit = { credentials: "include" };

type EventOrganizerConsultContextValue = {
  openConsult: (intentId?: string) => void;
  opening: boolean;
};

const EventOrganizerConsultContext =
  createContext<EventOrganizerConsultContextValue | null>(null);

export function useEventOrganizerConsult(): EventOrganizerConsultContextValue {
  const ctx = useContext(EventOrganizerConsultContext);
  if (!ctx) {
    throw new Error(
      "useEventOrganizerConsult must be used within EventOrganizerConsultProvider"
    );
  }
  return ctx;
}

/** Provider 外では null（EventChatButton 等のフォールバック用） */
export function useEventOrganizerConsultOptional(): EventOrganizerConsultContextValue | null {
  return useContext(EventOrganizerConsultContext);
}

function logConversationApiError(
  context: string,
  status: number,
  data: Record<string, unknown>
) {
  console.error(`[EventOrganizerConsult] ${context}`, {
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

type ProviderProps = {
  children: ReactNode;
  eventId: string;
  eventTitle: string;
  organizerId?: string | null;
  organizerUserId?: string | null;
  organizerName?: string | null;
};

export function EventOrganizerConsultProvider({
  children,
  eventId,
  eventTitle,
  organizerId,
  organizerUserId,
  organizerName,
}: ProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  const [authState, setAuthState] = useState<
    "loading" | "logged_in" | "logged_out" | "no_supabase"
  >("loading");
  const [modalOpen, setModalOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [modalIntentId, setModalIntentId] = useState("question");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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
      .catch(() => setAuthState("logged_out"));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(!!session?.user ? "logged_in" : "logged_out");
    });
    return () => subscription.unsubscribe();
  }, []);

  const currentEventUrl = `${pathname ?? `/events/${eventId}`}${
    searchParams?.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const openConsult = useCallback(
    async (intentId?: string) => {
      if (opening || authState === "loading") return;

      if (authState === "no_supabase") {
        window.alert("主催者への質問は Supabase 連携時にご利用ください。");
        return;
      }

      if (authState === "logged_out" && !authDisabled) {
        window.location.href = `/auth?next=${encodeURIComponent(currentEventUrl)}`;
        return;
      }

      setOpening(true);
      setSendError(null);
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
        const msg =
          e instanceof Error ? e.message : "開けませんでした。もう一度お試しください。";
        window.alert(msg);
      } finally {
        setOpening(false);
      }
    },
    [
      opening,
      authState,
      authDisabled,
      currentEventUrl,
      eventId,
      organizerId,
      organizerUserId,
      router,
    ]
  );

  const handleClose = useCallback(() => {
    setModalOpen(false);
    setSendError(null);
  }, []);

  const handleSend = useCallback(
    async (draft: string) => {
      if (sending || !draft.trim()) {
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
    },
    [sending, eventId, organizerId, organizerUserId, router]
  );

  const value = useMemo(
    () => ({ openConsult, opening }),
    [openConsult, opening]
  );

  return (
    <EventOrganizerConsultContext.Provider value={value}>
      {children}
      <EventOrganizerConsultModal
        open={modalOpen}
        eventTitle={eventTitle}
        organizerName={organizerName ?? undefined}
        initialIntentId={modalIntentId}
        sending={sending}
        error={sendError}
        onClose={handleClose}
        onSend={handleSend}
      />
    </EventOrganizerConsultContext.Provider>
  );
}
