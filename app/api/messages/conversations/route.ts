import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { createOrGetConversation } from "@/lib/db/messages";
import { getOrganizerIdByEventId, getOrganizerProfileId } from "@/lib/db/events";

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
  // organizer_user_id は event の主催者 profile_id
  const organizerUserIdFromEvent = eventId ? await getOrganizerProfileId(supabase, eventId) : null;

  let organizerId = body.organizerId ?? null;
  if (!organizerId && eventId) {
    organizerId = await getOrganizerIdByEventId(supabase, eventId);
  }

  if (eventId) {
    if (!organizerId || !organizerUserIdFromEvent) {
      return NextResponse.json(
        { error: "イベントまたは主催者が見つかりません" },
        { status: 404 }
      );
    }
  }

  if (!organizerId) {
    return NextResponse.json(
      { error: "organizerId が必要です（eventId がない場合）" },
      { status: 400 }
    );
  }

  // 呼び出し者は organizer(profile) または participant のどちらかであること
  const { data: org } = await supabase
    .from("organizers")
    .select("profile_id")
    .eq("id", organizerId)
    .single();
  const organizerProfileId = org?.profile_id ?? null;
  if (
    organizerProfileId !== user.id &&
    participantUserId !== user.id
  ) {
    return NextResponse.json(
      { error: "この会話を作成する権限がありません" },
      { status: 403 }
    );
  }

  try {
    if (!eventId) {
      // 互換性: eventId が無いケースは既存の createOrGetConversation を利用
      const conversationId = await createOrGetConversation(supabase, {
        eventId,
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
      .eq("event_id", eventId)
      .eq("kind", kind)
      .eq("organizer_id", organizerId)
      .eq("other_user_id", participantUserId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing?.id) {
      // 既存が見つかっても、過去の失敗で conversation_members が欠けている可能性があるため
      // createOrGetConversation で members 登録も再試行する（会話自体は upsert なので新規作成されない）
      const conversationId = await createOrGetConversation(supabase, {
        eventId,
        kind,
        organizerId,
        otherUserId: participantUserId,
      });
      return NextResponse.json({ conversationId });
    }

    // 2) 無ければ新規作成（membersも2人分登録）
    const conversationId = await createOrGetConversation(supabase, {
      eventId,
      kind,
      organizerId,
      otherUserId: participantUserId,
    });

    return NextResponse.json({ conversationId });
  } catch (e) {
    console.error("createOrGetConversation error:", e);
    return NextResponse.json(
      { error: "会話の作成に失敗しました" },
      { status: 500 }
    );
  }
}
