import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchRecruitmentById,
  fetchApplicationsByRecruitment,
  getOrganizerIdByProfileId,
} from "@/lib/db/recruitments-mvp";
import { createOrGetConversation, insertParticipantMessage } from "@/lib/db/messages";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

const TEMPLATES: Record<string, string> = {
  reminder: "【前日リマインド】明日の集合をお忘れなく。集合時刻・場所を再度確認の上、余裕を持ってお越しください。",
  venue_change: "【集合場所変更】大変お手数ですが、集合場所が変更になりました。このチャットの最新メッセージでご確認ください。",
  thanks: "【お礼】本日はお疲れさまでした。ご協力ありがとうございました。",
};

/** POST: 採用者のみに一斉連絡 */
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
      { error: "メッセージ内容または template（reminder/venue_change/thanks）を指定してください" },
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

    const apps = await fetchApplicationsByRecruitment(supabase, recruitmentId);
    const acceptedUserIds = new Set(
      apps
        .filter((a) => a.status === "accepted" || a.status === "confirmed")
        .map((a) => a.user_id)
    );
    const recipientIds =
      targetUserIds.length > 0
        ? new Set(targetUserIds.filter((id) => acceptedUserIds.has(id)))
        : acceptedUserIds;

    if (recipientIds.size === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "採用者がいません",
      });
    }

    const admin = createAdminClient();
    let sent = 0;
    const failedParticipantIds: string[] = [];
    for (const participantId of recipientIds) {
      let conversationId: string | null = null;
      try {
        conversationId = await createOrGetConversation(supabase, {
          callerUserId: user.id,
          eventId: null,
          kind: "general",
          organizerId,
          otherUserId: participantId,
        });
      } catch {
        failedParticipantIds.push(participantId);
        continue;
      }
      if (!conversationId) {
        failedParticipantIds.push(participantId);
        continue;
      }
      const ins = await insertParticipantMessage({
        userId: user.id,
        conversationId,
        content,
        supabase,
        admin,
      });
      if (ins.ok) {
        sent++;
      } else {
        failedParticipantIds.push(participantId);
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      total: recipientIds.size,
      failed: failedParticipantIds.length,
      failedParticipantIds,
      message: `${sent}件送信しました`,
    });
  } catch (e) {
    console.error("bulk-message POST:", e);
    return NextResponse.json(
      { error: "一斉連絡に失敗しました" },
      { status: 500 }
    );
  }
}
