import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { createOrGetConversation } from "@/lib/db/messages";
import { getOrganizerIdByEventId } from "@/lib/db/events";
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

function jsonError(
  status: number,
  userMessage: string,
  e?: unknown,
  extra?: Record<string, unknown>
) {
  const details = e !== undefined ? serializeDbError(e) : undefined;
  return NextResponse.json(
    {
      error: userMessage,
      ...(details ? { details } : {}),
      ...extra,
    },
    { status }
  );
}

const LOG_TAG = "[api/conversations]";

/**
 * POST: 会話を作成/取得（API 統一エントリ）
 * Body: { eventId?: string, kind?: string, organizerId?: string, organizerUserId?: string, otherUserId?: string }
 */
export async function handlePostCreateConversation(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  if (!supabase) {
    return jsonError(503, "Supabase が設定されていません");
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
      console.warn(LOG_TAG, "auth.getUser() empty; using getApiUser fallback", {
        getUserError: getUserError?.message,
      });
    }
  }

  if (!userId) {
    console.warn(LOG_TAG, "unauthorized", {
      getUserError: getUserError?.message,
      sessionHadUser: !!sessionUser,
    });
    return jsonError(401, "未ログイン", getUserError ?? undefined, {
      hint: "セッションがサーバーに届いていない可能性があります。再ログインしてください。",
    });
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
    /** 主催者の auth.users.id（profiles.id）。検証用 */
    organizerUserId?: string;
    otherUserId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "不正なリクエスト");
  }

  const eventIdRaw = body.eventId ?? null;
  const kind = body.kind ?? "event_inquiry";
  const participantUserId = body.otherUserId ?? user.id;

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  const safeEventId = eventIdRaw && isUuid(eventIdRaw) ? eventIdRaw : null;
  const rawEventId = eventIdRaw;

  const admin = createAdminClient();

  let organizerId: string | null = null;
  let eventIdForConversation: string | null = null;

  if (safeEventId) {
    eventIdForConversation = safeEventId;
    organizerId = await getOrganizerIdByEventId(supabase, safeEventId);
    if (!organizerId && admin) {
      organizerId = await getOrganizerIdByEventId(admin, safeEventId);
    }
  } else {
    if (rawEventId && String(rawEventId).trim()) {
      console.warn(LOG_TAG, "invalid eventId shape", { userId: user.id, eventIdRaw: rawEventId });
      return jsonError(400, "イベントIDの形式が不正です");
    }
    const fromBody = typeof body.organizerId === "string" ? body.organizerId.trim() : "";
    organizerId = fromBody && isUuid(fromBody) ? fromBody : null;
    eventIdForConversation = null;
  }

  if (!organizerId) {
    console.warn(LOG_TAG, "organizer not resolved", {
      userId: user.id,
      eventId: safeEventId,
    });
    if (rawEventId) {
      return jsonError(
        404,
        "イベントまたは主催者が見つかりません",
        undefined,
        { eventId: safeEventId }
      );
    }
    return jsonError(400, "organizerId が必要です（eventId がない場合）");
  }

  const writerForRead = admin ?? supabase;

  const { data: organizerRow, error: orgRowError } = await writerForRead
    .from("organizers")
    .select("id, profile_id")
    .eq("id", organizerId)
    .maybeSingle();

  if (orgRowError) {
    console.error(LOG_TAG, "organizers lookup failed", {
      userId: user.id,
      eventId: safeEventId,
      organizerId,
      ...serializeDbError(orgRowError),
    });
    return jsonError(500, "主催者情報の取得に失敗しました", orgRowError);
  }

  const organizerProfileId =
    typeof organizerRow?.profile_id === "string" ? organizerRow.profile_id : null;

  if (!organizerProfileId) {
    console.error(LOG_TAG, "organizer missing profile_id", {
      userId: user.id,
      eventId: safeEventId,
      organizerId,
    });
    return jsonError(500, "主催者プロフィールが未設定です");
  }

  if (user.id === organizerProfileId) {
    console.warn(LOG_TAG, "self-message blocked", { userId: user.id, organizerProfileId });
    return jsonError(400, "自分が主催するイベントには、相談メッセージを送れません");
  }

  const bodyOrganizerUserId =
    typeof body.organizerUserId === "string" ? body.organizerUserId.trim() : "";
  if (bodyOrganizerUserId && isUuid(bodyOrganizerUserId)) {
    if (bodyOrganizerUserId !== organizerProfileId) {
      console.warn(LOG_TAG, "organizerUserId mismatch", {
        userId: user.id,
        eventId: safeEventId,
        organizerProfileId,
        bodyOrganizerUserId,
      });
      return jsonError(400, "主催者情報がイベントと一致しません");
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
      console.warn(LOG_TAG, "forbidden surrogate create", {
        userId: user.id,
        participantUserId,
        organizerId,
      });
      return jsonError(403, "この会話を作成する権限がありません");
    }
  }

  console.log(LOG_TAG, "create flow start", {
    userId: user.id,
    eventId: eventIdForConversation,
    organizerId,
    organizerProfileId,
    participantUserId,
    kind,
    hasServiceRole: !!admin,
  });

  try {
    if (participantUserId === user.id) {
      await ensureProfileRowForUser(supabase, user);
    }

    if (!eventIdForConversation) {
      const conversationId = await createOrGetConversation(supabase, {
        callerUserId: user.id,
        eventId: eventIdForConversation,
        kind,
        organizerId,
        otherUserId: participantUserId,
      });
      console.log(LOG_TAG, "createOrGetConversation ok (no event id)", {
        userId: user.id,
        conversationId,
      });
      return NextResponse.json({ conversationId });
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
      console.error(LOG_TAG, "existing conversation query error", {
        userId: user.id,
        eventId: eventIdForConversation,
        organizerId,
        participantUserId,
        ...serializeDbError(existingError),
      });
      throw existingError;
    }

    console.log(LOG_TAG, "existing conversation lookup", {
      userId: user.id,
      eventId: eventIdForConversation,
      foundConversationId: existing?.id ?? null,
    });

    const conversationId = await createOrGetConversation(supabase, {
      callerUserId: user.id,
      eventId: eventIdForConversation,
      kind,
      organizerId,
      otherUserId: participantUserId,
    });

    console.log(LOG_TAG, "createOrGetConversation ok", {
      userId: user.id,
      conversationId,
      reusedExisting: !!existing?.id,
    });

    return NextResponse.json({ conversationId });
  } catch (e) {
    console.error(LOG_TAG, "createOrGetConversation error", {
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
      return jsonError(404, "イベントまたは主催者が見つかりません", e);
    }

    if (/not allowed to create this conversation/i.test(errorMessage)) {
      return jsonError(403, "この会話を作成する権限がありません", e);
    }

    if (
      /permission denied for function|must be owner|42501/.test(errorMessage) ||
      (e &&
        typeof e === "object" &&
        "code" in e &&
        String((e as { code: string }).code) === "42501")
    ) {
      return jsonError(
        403,
        "会話の作成権限がありません。ログアウトして再度ログインしてからお試しください。",
        e
      );
    }

    if (/invalid input syntax for type uuid/i.test(errorMessage)) {
      return jsonError(400, "イベントIDの形式が不正です", e);
    }

    if (/conversation upsert did not resolve id/i.test(errorMessage)) {
      return jsonError(
        503,
        "会話の初期化に失敗しました。時間をおいて再度お試しください。解消しない場合はサポートへお問い合わせください。",
        e
      );
    }

    if (
      /foreign key|violates foreign key|23503/.test(errorMessage) ||
      (e &&
        typeof e === "object" &&
        "code" in e &&
        String((e as { code: string }).code) === "23503")
    ) {
      return jsonError(
        400,
        "プロフィールまたは主催者情報の参照に失敗しました。マイページを開いて保存してから、再度お試しください。",
        e
      );
    }

    if (
      /duplicate key|unique constraint|23505/.test(errorMessage) ||
      (e &&
        typeof e === "object" &&
        "code" in e &&
        String((e as { code: string }).code) === "23505")
    ) {
      return jsonError(
        409,
        "同じ会話が既に存在します。一覧から開き直してください。",
        e
      );
    }

    return jsonError(500, "会話の作成に失敗しました", e);
  }
}
