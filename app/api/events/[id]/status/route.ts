import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerByProfileId } from "@/lib/db/organizers";
import { canPublishEvent, isEventPublishedThisMonthJst } from "@/lib/billing";
import { getOrganizerIdByEventId, updateEventStatus } from "@/lib/db/events";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

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

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が正しくありません" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "draft" && status !== "published" && status !== "archived") {
    return NextResponse.json({ error: "status が不正です" }, { status: 400 });
  }

  if (status === "published") {
    // 同月内に一度公開済みのイベントは「再公開」扱いにして枠チェックをスキップ
    const alreadyPublishedThisMonth = await isEventPublishedThisMonthJst(supabase, eventId);
    if (!alreadyPublishedThisMonth) {
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
    }
  }

  try {
    await updateEventStatus(supabase, eventId, status);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("events status PATCH:", e);
    return NextResponse.json({ error: "ステータス更新に失敗しました" }, { status: 500 });
  }
}
