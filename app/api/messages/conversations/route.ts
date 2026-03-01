import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { createOrGetConversation } from "@/lib/db/messages";
import { getOrganizerIdByEventId } from "@/lib/db/events";

/**
 * POST: 会話を作成/取得（eventId + kind + organizerId + otherUserId で一意）
 * Body: { eventId?: string, kind?: string, organizerId?: string, otherUserId?: string }
 * - eventId がある場合: organizerId を events から取得
 * - ない場合: organizerId, otherUserId 必須
 * - 呼び出し者は organizer または otherUserId のどちらかであること
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
  let organizerId = body.organizerId ?? null;
  const otherUserId = body.otherUserId ?? user.id;

  if (eventId) {
    const oid = await getOrganizerIdByEventId(supabase, eventId);
    if (!oid) {
      return NextResponse.json(
        { error: "イベントまたは主催者が見つかりません" },
        { status: 404 }
      );
    }
    organizerId = oid;
  }

  if (!organizerId) {
    return NextResponse.json(
      { error: "organizerId が必要です（eventId がない場合）" },
      { status: 400 }
    );
  }

  // 呼び出し者は organizer または other のどちらか
  const { data: org } = await supabase
    .from("organizers")
    .select("profile_id")
    .eq("id", organizerId)
    .single();
  const organizerProfileId = org?.profile_id ?? null;
  if (
    organizerProfileId !== user.id &&
    otherUserId !== user.id
  ) {
    return NextResponse.json(
      { error: "この会話を作成する権限がありません" },
      { status: 403 }
    );
  }

  try {
    const conversationId = await createOrGetConversation(supabase, {
      eventId,
      kind,
      organizerId,
      otherUserId,
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
