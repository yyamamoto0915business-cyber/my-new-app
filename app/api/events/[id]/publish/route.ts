import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerByProfileId } from "@/lib/db/organizers";
import { publishEvent, getOrganizerIdByEventId } from "@/lib/db/events";
import { canPublishEvent } from "@/lib/billing";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST: イベントを公開
 * ガード: 月間公開枠チェック → 402で課金導線
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  if (!eventId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  }

  const eventOrganizerId = await getOrganizerIdByEventId(supabase, eventId);
  if (eventOrganizerId !== organizerId) {
    return NextResponse.json({ error: "このイベントの主催者ではありません" }, { status: 403 });
  }

  const organizer = await getOrganizerByProfileId(supabase, user.id);
  if (!organizer) {
    return NextResponse.json({ error: "主催者情報を取得できません" }, { status: 500 });
  }

  const check = await canPublishEvent(supabase, organizerId, organizer);
  if (!check.ok) {
    return NextResponse.json(
      { error: check.message, code: "PUBLISH_LIMIT_EXCEEDED", limit: check.limit, current: check.current },
      { status: 402 }
    );
  }

  try {
    await publishEvent(supabase, eventId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("publish event:", e);
    return NextResponse.json({ error: "公開に失敗しました" }, { status: 500 });
  }
}
