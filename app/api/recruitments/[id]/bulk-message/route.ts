import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchRecruitmentById,
  getOrganizerIdByProfileId,
} from "@/lib/db/recruitments-mvp";
import { notifyRecruitmentStaff } from "@/lib/db/notifications";

type Params = { params: Promise<{ id: string }> };

const TEMPLATES: Record<string, string> = {
  reminder:
    "【前日リマインド】明日の集合をお忘れなく。集合時刻・場所を再度確認の上、余裕を持ってお越しください。",
  venue_change:
    "【集合場所変更】大変お手数ですが、集合場所が変更になりました。最新のお知らせをご確認ください。",
  thanks: "【お礼】本日はお疲れさまでした。ご協力ありがとうございました。",
};

/** POST: 採用者へ一斉連絡（通知配信・ダッシュボードお知らせと同じ経路） */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: recruitmentId } = await params;
  if (!recruitmentId) {
    return NextResponse.json({ error: "募集IDが必要です" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なJSONです" }, { status: 400 });
  }

  const template = typeof body.template === "string" ? body.template : "";
  const customContent = typeof body.content === "string" ? body.content.trim() : "";
  const content = customContent || (TEMPLATES[template] ?? "");
  const targetUserIds = Array.isArray(body.targetUserIds)
    ? body.targetUserIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  if (!content) {
    return NextResponse.json(
      {
        error:
          "メッセージ内容または template（reminder/venue_change/thanks）を指定してください",
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "一斉連絡はSupabase接続時のみ利用可能です" },
      { status: 503 }
    );
  }

  try {
    const recruitment = await fetchRecruitmentById(supabase, recruitmentId);
    if (!recruitment) {
      return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
    }

    const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
    if (!organizerId || recruitment.organizer_id !== organizerId) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { sent, total, failedParticipantIds } = await notifyRecruitmentStaff(supabase, {
      recruitmentId,
      recruitmentTitle: recruitment.title,
      eventId: recruitment.event_id,
      content,
      excludeUserId: user.id,
      targetUserIds: targetUserIds.length > 0 ? targetUserIds : undefined,
    });

    return NextResponse.json({
      success: true,
      sent,
      total,
      failed: failedParticipantIds.length,
      failedParticipantIds,
      message:
        total === 0
          ? "採用者がいません"
          : `${sent}件のスタッフに通知を送信しました`,
    });
  } catch (e) {
    console.error("bulk-message POST:", e);
    return NextResponse.json({ error: "一斉連絡に失敗しました" }, { status: 500 });
  }
}
