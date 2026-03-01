import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  getApplicationStatus,
  getOrganizerIdByProfileId,
} from "@/lib/db/recruitments-mvp";
import {
  getOrCreateRecruitmentChatRoom,
  getRecruitmentChatRoom,
} from "@/lib/db/chat";
import { fetchRecruitmentById } from "@/lib/db/recruitments-mvp";

type Params = { params: Promise<{ id: string }> };

/** GET: 現在ユーザーの募集チャットルームを取得（応募者用）or 主催者用は participantId で指定 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: recruitmentId } = await params;
  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get("participantId"); // 主催者が特定応募者のルームを見る時

  if (!recruitmentId) {
    return NextResponse.json({ error: "募集IDが必要です" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "チャットはSupabase接続時のみ利用可能です" }, { status: 503 });
  }

  try {
    const recruitment = await fetchRecruitmentById(supabase, recruitmentId);
    if (!recruitment) {
      return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
    }

    const organizerId = await getOrganizerIdByProfileId(supabase, user.id);

    if (participantId && organizerId && recruitment.organizer_id === organizerId) {
      const room = await getRecruitmentChatRoom(
        supabase,
        recruitmentId,
        participantId
      );
      if (!room) {
        return NextResponse.json({ error: "ルームが見つかりません" }, { status: 404 });
      }
      return NextResponse.json({ roomId: room.id });
    }

    const status = await getApplicationStatus(supabase, recruitmentId, user.id);
    if (!status) {
      return NextResponse.json({ error: "応募していないためチャットを利用できません" }, { status: 403 });
    }

    const room = await getOrCreateRecruitmentChatRoom(
      supabase,
      recruitmentId,
      user.id,
      user.id
    );
    if (!room) {
      return NextResponse.json({ error: "ルームの取得に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ roomId: room.id });
  } catch (e) {
    console.error("chat-room GET:", e);
    return NextResponse.json(
      { error: "ルームの取得に失敗しました" },
      { status: 500 }
    );
  }
}
