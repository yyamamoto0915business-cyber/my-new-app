import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { createOrGetConversation } from "@/lib/db/messages";
import { getOrganizerIdByEventId } from "@/lib/db/events";
import { ensureProfileRowForUser } from "@/lib/ensure-profile";

function extractSupabaseErrorText(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [o.message, o.details, o.hint, o.code].filter(
      (x): x is string => typeof x === "string" && x.length > 0
    );
    if (parts.length) return parts.join(" ");
  }
  return String(e);
}

/**
 * POST: 会話を作成/取得（event_id + organizer_user_id + participant_user_id で一意）
 * Body: { eventId: string, kind?: string }
 * - 未ログイン: 401
 * - ログイン済みなら:
 *   1) 既存conversationを検索
 *   2) 無ければ作成（membersも登録）
 *   3) conversationId を返す
 */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase が設定されていません" },
      { status: 503 }
    );
  }

  let body: {
    eventId?: string | null;
    kind?: string;
    organizerId?: string;
    otherUserId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "不正なリクエスト" },
      { status: 400 }
    );
  }

  const eventId = body.eventId ?? null;
  const kind = body.kind ?? "event_inquiry";
  // participant_user_id は常に current user
  const participantUserId = body.otherUserId ?? user.id;
  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  // Supabase の UUID カラムに無効な値を投げないため、イベントIDは UUID 形式なら採用する
  const rawEventId = eventId;
  const safeEventId = rawEventId && isUuid(rawEventId) ? rawEventId : null;

  // eventId があるときは必ず DB の events.organizer_id を正とする（クライアントの誤値・改ざんを防ぐ）
  let organizerId: string | null = null;
  if (safeEventId) {
    organizerId = await getOrganizerIdByEventId(supabase, safeEventId);
  } else {
    const fromBody = typeof body.organizerId === "string" ? body.organizerId.trim() : "";
    organizerId = fromBody && isUuid(fromBody) ? fromBody : null;
  }

  // 既存挙動に合わせ、eventId が来ているのに organizerId が引けない場合は 404
  if (!organizerId) {
    if (rawEventId) {
      return NextResponse.json(
        { error: "イベントまたは主催者が見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "organizerId が必要です（eventId がない場合）" },
      { status: 400 }
    );
  }

  const eventIdForConversation = safeEventId;

  // 参加者は他主催者の organizers 行を RLS で読めないため、profile_id で突合しない。
  // 参加者本人 or 当該主催者本人のみ許可する。
  const isParticipant = participantUserId === user.id;
  if (!isParticipant) {
    const { data: ownOrg } = await supabase
      .from("organizers")
      .select("id")
      .eq("id", organizerId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!ownOrg) {
      return NextResponse.json(
        { error: "この会話を作成する権限がありません" },
        { status: 403 }
      );
    }
  }

  try {
    // other_user_id → profiles(id) の FK 用。profiles 欠損だと create_or_get_conversation が失敗する。
    if (participantUserId === user.id) {
      await ensureProfileRowForUser(supabase, user);
    }

    if (!eventIdForConversation) {
      // 互換性: eventId が無いケースは既存の createOrGetConversation を利用
      const conversationId = await createOrGetConversation(supabase, {
        eventId: eventIdForConversation,
        kind,
        organizerId,
        otherUserId: participantUserId,
      });
      return NextResponse.json({ conversationId });
    }

    // 1) existing を event_id + organizer_user_id + participant_user_id で検索
    // organizer_user_id は organizers.profile_id に対応するので organizerId を使って突合
    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select("id")
      .eq("event_id", eventIdForConversation)
      .eq("kind", kind)
      .eq("organizer_id", organizerId)
      .eq("other_user_id", participantUserId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing?.id) {
      // 既存が見つかっても、過去の失敗で conversation_members が欠けている可能性があるため
      // createOrGetConversation で members 登録も再試行する（会話自体は upsert なので新規作成されない）
      const conversationId = await createOrGetConversation(supabase, {
        eventId: eventIdForConversation,
        kind,
        organizerId,
        otherUserId: participantUserId,
      });
      return NextResponse.json({ conversationId });
    }

    // 2) 無ければ新規作成（membersも2人分登録）
    const conversationId = await createOrGetConversation(supabase, {
      eventId: eventIdForConversation,
      kind,
      organizerId,
      otherUserId: participantUserId,
    });

    return NextResponse.json({ conversationId });
  } catch (e) {
    console.error("createOrGetConversation error:", e);

    const errorText = extractSupabaseErrorText(e);
    const errorMessage = errorText.toLowerCase();

    if (/organizer not found/i.test(errorMessage)) {
      return NextResponse.json(
        { error: "イベントまたは主催者が見つかりません" },
        { status: 404 }
      );
    }

    if (/not allowed to create this conversation/i.test(errorMessage)) {
      return NextResponse.json(
        { error: "この会話を作成する権限がありません" },
        { status: 403 }
      );
    }

    if (/invalid input syntax for type uuid/i.test(errorMessage)) {
      return NextResponse.json(
        { error: "イベントIDの形式が不正です" },
        { status: 400 }
      );
    }

    if (
      /foreign key|violates foreign key|23503/.test(errorMessage) ||
      (e &&
        typeof e === "object" &&
        "code" in e &&
        String((e as { code: string }).code) === "23503")
    ) {
      return NextResponse.json(
        {
          error:
            "プロフィールまたは主催者情報の参照に失敗しました。マイページを開いて保存してから、再度お試しください。",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "会話の作成に失敗しました" },
      { status: 500 }
    );
  }
}
