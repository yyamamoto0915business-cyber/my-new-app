import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { fetchEventById, getOrganizerIdByEventId } from "@/lib/db/events";
import { notifyEventParticipants } from "@/lib/db/notifications";

type Params = { params: Promise<{ id: string }> };

/** POST: イベント参加者へお知らせ通知を送信 */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "イベントIDが必要です" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なJSONです" }, { status: 400 });
  }

  const kind = body.kind === "emergency" ? "emergency" : body.kind === "message" ? "message" : null;
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!kind) {
    return NextResponse.json(
      { error: "kind（message または emergency）を指定してください" },
      { status: 400 }
    );
  }
  if (!content) {
    return NextResponse.json({ error: "メッセージ内容を入力してください" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "通知送信はSupabase接続時のみ利用可能です" },
      { status: 503 }
    );
  }

  try {
    const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
    const eventOrganizerId = await getOrganizerIdByEventId(supabase, eventId);
    if (!organizerId || eventOrganizerId !== organizerId) {
      return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
    }

    const event = await fetchEventById(supabase, eventId);
    if (!event) {
      return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
    }

    const { sent, total } = await notifyEventParticipants(supabase, {
      eventId,
      eventTitle: event.title,
      kind,
      content,
      excludeUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      sent,
      total,
      message:
        total === 0
          ? "通知対象の参加者がいません"
          : `${sent}件の参加者にお知らせを送信しました`,
    });
  } catch (e) {
    console.error("notify-participants POST:", e);
    return NextResponse.json({ error: "通知の送信に失敗しました" }, { status: 500 });
  }
}
