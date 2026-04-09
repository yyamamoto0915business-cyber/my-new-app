import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { createOrGetConversation, insertParticipantMessage } from "@/lib/db/messages";
import { fetchEventRowForConversation } from "@/lib/db/events";
import { ensureProfileRowForUser } from "@/lib/ensure-profile";
import { createAdminClient } from "@/lib/supabase/admin";

type PgLikeError = {
  message?: string;
  code?: string;
  hint?: string;
  details?: string;
};

export function serializeDbError(e: unknown): {
  message: string;
  code?: string;
  hint?: string;
  details?: string;
} {
  if (e instanceof Error) {
    return { message: e.message };
  }
  if (e && typeof e === "object") {
    const o = e as PgLikeError;
    return {
      message: typeof o.message === "string" ? o.message : String(e),
      code: typeof o.code === "string" ? o.code : undefined,
      hint: typeof o.hint === "string" ? o.hint : undefined,
      details: typeof o.details === "string" ? o.details : undefined,
    };
  }
  return { message: String(e) };
}

function extractSupabaseErrorText(e: unknown): string {
  const s = serializeDbError(e);
  const parts = [s.message, s.details, s.hint, s.code].filter(
    (x): x is string => typeof x === "string" && x.length > 0
  );
  return parts.length ? parts.join(" ") : String(e);
}

export type CreateConversationErrorBody = {
  ok: false;
  step: string;
  code: string | null;
  message: string;
  details: string | null;
  /** 既存クライアント向け */
  error: string;
};

export function structuredJsonError(
  status: number,
  step: string,
  technicalMessage: string,
  e?: unknown,
  extra?: Record<string, unknown>
) {
  const ser = e !== undefined ? serializeDbError(e) : null;
  const code = ser?.code ?? null;
  const message = ser?.message ?? technicalMessage;
  const details = ser?.details ?? null;
  const body: CreateConversationErrorBody & Record<string, unknown> = {
    ok: false,
    step,
    code,
    message,
    details,
    error: `${step}: ${technicalMessage}`,
    ...(ser?.hint ? { hint: ser.hint } : {}),
    ...extra,
  };
  return NextResponse.json(body, { status });
}

const LOG = "[createConversation]";

/**
 * POST: 会話を作成/取得（API 統一エントリ）
 * Body: { eventId?, kind?, organizerId?, organizerUserId?, otherUserId?, initialMessage? }
 * initialMessage を送ると同一リクエスト内で初回メッセージまで保存（失敗 step で切り分け可能）。
 */
export async function handlePostCreateConversation(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  if (!supabase) {
    console.error(LOG, "fail", { step: "supabase_config", reason: "no_client" });
    return structuredJsonError(503, "supabase_config", "supabase_not_configured");
  }

  const {
    data: { user: sessionUser },
    error: getUserError,
  } = await supabase.auth.getUser();

  let userId: string | null = sessionUser?.id ?? null;
  let userEmail: string | null = sessionUser?.email ?? null;
  let userName: string | null =
    (sessionUser?.user_metadata?.display_name as string | undefined) ??
    (sessionUser?.user_metadata?.name as string | undefined) ??
    sessionUser?.email?.split("@")[0] ??
    null;

  if (!userId) {
    const apiUser = await getApiUser();
    if (apiUser) {
      userId = apiUser.id;
      userEmail = apiUser.email;
      userName = apiUser.name;
      console.warn(LOG, "auth user via getApiUser fallback", {
        getUserError: getUserError?.message,
      });
    }
  }

  if (!userId) {
    console.error(LOG, "fail", {
      step: "auth",
      message: "auth_required",
      getUserError: getUserError?.message,
    });
    return structuredJsonError(
      401,
      "auth",
      "auth_required",
      getUserError ?? undefined,
      { hint: "セッションがサーバーに届いていない可能性があります。再ログインしてください。" }
    );
  }

  const user = {
    id: userId,
    email: userEmail,
    name: userName ?? userEmail ?? "ユーザー",
  };

  let body: {
    eventId?: string | null;
    kind?: string;
    organizerId?: string;
    organizerUserId?: string;
    otherUserId?: string;
    initialMessage?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    console.error(LOG, "fail", { step: "parse_body", message: "invalid_json" });
    return structuredJsonError(400, "parse_body", "invalid_json");
  }

  const eventIdRaw = body.eventId ?? null;
  const kind = body.kind ?? "event_inquiry";
  const participantUserId = body.otherUserId ?? user.id;
  const eventIdForLog = typeof eventIdRaw === "string" ? eventIdRaw : null;

  console.log(LOG, "start", {
    eventId: eventIdForLog,
    userId: user.id,
    sessionHadUser: !!sessionUser,
    getUserError: getUserError?.message ?? null,
  });

  console.log(LOG, "auth user resolved", { userId: user.id, eventId: eventIdForLog });

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  const safeEventId = eventIdRaw && isUuid(String(eventIdRaw)) ? String(eventIdRaw) : null;
  const rawEventId = eventIdRaw;

  const wantsInitialMessage = Object.prototype.hasOwnProperty.call(body, "initialMessage");
  const initialMessageRaw =
    typeof body.initialMessage === "string" ? body.initialMessage : "";
  const initialMessageTrimmed = initialMessageRaw.trim();

  if (wantsInitialMessage && !initialMessageTrimmed) {
    console.error(LOG, "fail", { step: "validate", message: "message_required" });
    return structuredJsonError(400, "validate", "message_required");
  }

  if (!user.id || !isUuid(user.id)) {
    console.error(LOG, "fail", { step: "auth", message: "invalid_user_id" });
    return structuredJsonError(400, "auth", "invalid_user_id");
  }

  if (!isUuid(participantUserId)) {
    console.error(LOG, "fail", { step: "validate", message: "invalid_participant_id" });
    return structuredJsonError(400, "validate", "invalid_participant_id");
  }

  const admin = createAdminClient();

  let organizerId: string | null = null;
  let eventIdForConversation: string | null = null;

  if (safeEventId) {
    const loaded = await fetchEventRowForConversation(safeEventId, supabase, admin);
    if (!loaded.ok) {
      if (loaded.reason === "event_not_found") {
        console.error(LOG, "fail", {
          step: "load_event",
          message: "event_not_found",
          eventId: safeEventId,
        });
        return structuredJsonError(404, "load_event", "event_not_found");
      }
      if (loaded.reason === "organizer_id_missing") {
        console.error(LOG, "fail", {
          step: "resolve_organizer",
          message: "organizer_id_missing_on_event",
          eventId: safeEventId,
        });
        return structuredJsonError(
          400,
          "resolve_organizer",
          "organizer_id_missing_on_event"
        );
      }
      console.error(LOG, "fail", {
        step: "load_event",
        message: "load_failed",
        eventId: safeEventId,
        ...loaded.loadError,
      });
      return structuredJsonError(
        500,
        "load_event",
        loaded.loadError?.message ?? "load_failed",
        loaded.loadError
      );
    }
    eventIdForConversation = loaded.id;
    organizerId = loaded.organizerId;
    console.log(LOG, "event loaded", {
      eventId: loaded.id,
      organizerId: loaded.organizerId,
    });
  } else {
    if (rawEventId && String(rawEventId).trim()) {
      console.warn(LOG, "invalid eventId shape", { userId: user.id, eventIdRaw: rawEventId });
      return structuredJsonError(400, "validate", "invalid_event_id_shape");
    }
    const fromBody = typeof body.organizerId === "string" ? body.organizerId.trim() : "";
    organizerId = fromBody && isUuid(fromBody) ? fromBody : null;
    eventIdForConversation = null;
  }

  if (!organizerId) {
    console.error(LOG, "fail", {
      step: "resolve_organizer",
      message: rawEventId ? "organizer_unresolved" : "organizerId_required",
      eventId: safeEventId,
    });
    if (rawEventId) {
      return structuredJsonError(404, "resolve_organizer", "organizer_unresolved", undefined, {
        eventId: safeEventId,
      });
    }
    return structuredJsonError(400, "resolve_organizer", "organizerId_required");
  }

  console.log(LOG, "organizer resolved", { organizerId, eventId: eventIdForConversation });

  const writerForRead = admin ?? supabase;

  const { data: organizerRow, error: orgRowError } = await writerForRead
    .from("organizers")
    .select("id, profile_id")
    .eq("id", organizerId)
    .maybeSingle();

  if (orgRowError) {
    console.error(LOG, "fail", {
      step: "load_organizer_row",
      ...serializeDbError(orgRowError),
      organizerId,
    });
    return structuredJsonError(
      500,
      "load_organizer_row",
      orgRowError.message ?? "organizer_lookup_failed",
      orgRowError
    );
  }

  const organizerProfileId =
    typeof organizerRow?.profile_id === "string" ? organizerRow.profile_id : null;

  if (!organizerProfileId) {
    console.error(LOG, "fail", {
      step: "resolve_organizer",
      message: "organizer_profile_missing",
      organizerId,
    });
    return structuredJsonError(500, "resolve_organizer", "organizer_profile_missing");
  }

  // 「自分宛てメッセージ」のみ禁止する。
  // 主催者が参加者との会話を開くケースは許可する。
  if (participantUserId === organizerProfileId) {
    console.warn(LOG, "fail", {
      step: "guard",
      message: "cannot_message_self",
      userId: user.id,
      organizerProfileId,
      participantUserId,
    });
    return structuredJsonError(400, "guard", "cannot_message_self");
  }

  const bodyOrganizerUserId =
    typeof body.organizerUserId === "string" ? body.organizerUserId.trim() : "";
  if (bodyOrganizerUserId && isUuid(bodyOrganizerUserId)) {
    if (bodyOrganizerUserId !== organizerProfileId) {
      console.warn(LOG, "fail", {
        step: "guard",
        message: "organizer_user_mismatch",
        organizerProfileId,
        bodyOrganizerUserId,
      });
      return structuredJsonError(400, "guard", "organizer_user_mismatch");
    }
  }

  const isParticipant = participantUserId === user.id;
  if (!isParticipant) {
    const { data: ownOrg } = await supabase
      .from("organizers")
      .select("id")
      .eq("id", organizerId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!ownOrg) {
      console.warn(LOG, "fail", {
        step: "guard",
        message: "forbidden_surrogate",
        participantUserId,
        organizerId,
      });
      return structuredJsonError(403, "guard", "forbidden_surrogate");
    }
  }

  console.log(LOG, "flow continue", {
    userId: user.id,
    eventId: eventIdForConversation,
    organizerId,
    organizerProfileId,
    participantUserId,
    kind,
    hasServiceRole: !!admin,
    wantsInitialMessage,
  });

  try {
    if (participantUserId === user.id) {
      console.log(LOG, "ensure profile", { userId: user.id });
      try {
        await ensureProfileRowForUser(supabase, user);
      } catch (pe) {
        console.error(LOG, "fail", {
          step: "ensure_profile",
          userId: user.id,
          ...serializeDbError(pe),
        });
        return structuredJsonError(
          500,
          "ensure_profile",
          serializeDbError(pe).message,
          pe
        );
      }
    }

    if (!eventIdForConversation) {
      console.log(LOG, "createOrGetConversation (no event)", { participantUserId });
      const conversationId = await createOrGetConversation(supabase, {
        callerUserId: user.id,
        eventId: eventIdForConversation,
        kind,
        organizerId,
        otherUserId: participantUserId,
      });
      console.log(LOG, "insert conversation result", {
        conversationId,
        reusedExisting: false,
        mode: "no_event",
      });

      if (wantsInitialMessage) {
        const ins = await insertParticipantMessage({
          userId: user.id,
          conversationId,
          content: initialMessageTrimmed,
          supabase,
          admin,
        });
        if (!ins.ok) {
          console.error(LOG, "insert first message result", {
            conversationId,
            source: ins.source,
            ...serializeDbError(ins.error),
          });
          return structuredJsonError(
            500,
            "insert_message",
            serializeDbError(ins.error).message,
            ins.error,
            { conversationId }
          );
        }
        console.log(LOG, "insert first message result", {
          conversationId,
          ok: true,
          viaAdminFallback: ins.viaAdminFallback,
        });
      }

      console.log(LOG, "success", { conversationId, sentMessage: wantsInitialMessage });
      return NextResponse.json({
        ok: true,
        conversationId,
        sentMessage: wantsInitialMessage,
      });
    }

    const { data: existing, error: existingError } = await writerForRead
      .from("conversations")
      .select("id")
      .eq("event_id", eventIdForConversation)
      .eq("kind", kind)
      .eq("organizer_id", organizerId)
      .eq("other_user_id", participantUserId)
      .maybeSingle();

    if (existingError) {
      console.error(LOG, "existing conversation query error", {
        ...serializeDbError(existingError),
        eventId: eventIdForConversation,
      });
      return structuredJsonError(
        500,
        "find_existing_conversation",
        existingError.message ?? "query_failed",
        existingError
      );
    }

    console.log(LOG, "existing conversation", {
      conversationId: existing?.id ?? null,
      eventId: eventIdForConversation,
    });

    const conversationId = await createOrGetConversation(supabase, {
      callerUserId: user.id,
      eventId: eventIdForConversation,
      kind,
      organizerId,
      otherUserId: participantUserId,
    });

    console.log(LOG, "insert conversation result", {
      data: { id: conversationId },
      error: null,
      reusedExisting: !!existing?.id,
    });

    if (wantsInitialMessage) {
      const ins = await insertParticipantMessage({
        userId: user.id,
        conversationId,
        content: initialMessageTrimmed,
        supabase,
        admin,
      });
      if (!ins.ok) {
        const ser = serializeDbError(ins.error);
        console.error(LOG, "insert first message result", {
          data: null,
          error: ser,
          source: ins.source,
          conversationId,
        });
        return structuredJsonError(
          500,
          "insert_message",
          ser.message,
          ins.error,
          { conversationId }
        );
      }
      console.log(LOG, "insert first message result", {
        data: { conversationId },
        error: null,
        viaAdminFallback: ins.viaAdminFallback,
      });
    }

    console.log(LOG, "update latest message result", {
      note: "no_conversations_latest_column",
      skipped: true,
    });

    console.log(LOG, "success", {
      conversationId,
      sentMessage: wantsInitialMessage,
      reusedExisting: !!existing?.id,
    });

    return NextResponse.json({
      ok: true,
      conversationId,
      sentMessage: wantsInitialMessage,
      reusedExisting: !!existing?.id,
    });
  } catch (e) {
    console.error(LOG, "fail", {
      step: "insert_conversation",
      userId: user.id,
      eventId: eventIdForConversation,
      organizerId,
      organizerProfileId,
      participantUserId,
      ...serializeDbError(e),
    });

    const errorText = extractSupabaseErrorText(e);
    const errorMessage = errorText.toLowerCase();

    if (/organizer not found/i.test(errorMessage)) {
      return structuredJsonError(404, "insert_conversation", "organizer_not_found", e);
    }

    if (/not allowed to create this conversation/i.test(errorMessage)) {
      return structuredJsonError(403, "insert_conversation", "not_allowed", e);
    }

    if (
      /permission denied for function|must be owner|42501/.test(errorMessage) ||
      (e &&
        typeof e === "object" &&
        "code" in e &&
        String((e as { code: string }).code) === "42501")
    ) {
      return structuredJsonError(
        403,
        "insert_conversation",
        "permission_denied",
        e,
        {
          hint: "RLS または RPC 実行権限。マイグレーション・service_role・再ログインを確認してください。",
        }
      );
    }

    if (/invalid input syntax for type uuid/i.test(errorMessage)) {
      return structuredJsonError(400, "validate", "invalid_uuid", e);
    }

    if (/conversation upsert did not resolve id/i.test(errorMessage)) {
      return structuredJsonError(503, "insert_conversation", "upsert_did_not_resolve_id", e);
    }

    if (
      /foreign key|violates foreign key|23503/.test(errorMessage) ||
      (e &&
        typeof e === "object" &&
        "code" in e &&
        String((e as { code: string }).code) === "23503")
    ) {
      return structuredJsonError(500, "insert_conversation", "foreign_key_violation", e);
    }

    if (
      /duplicate key|unique constraint|23505/.test(errorMessage) ||
      (e &&
        typeof e === "object" &&
        "code" in e &&
        String((e as { code: string }).code) === "23505")
    ) {
      return structuredJsonError(409, "insert_conversation", "duplicate_conversation", e);
    }

    const ser = serializeDbError(e);
    return structuredJsonError(
      500,
      "insert_conversation",
      ser.message || "unknown_error",
      e
    );
  }
}
