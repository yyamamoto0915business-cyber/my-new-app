import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchRecruitmentById,
  createApplication,
  getApplicationStatus,
  getOrganizerIdByProfileId,
} from "@/lib/db/recruitments-mvp";
import {
  getOrCreateRecruitmentChatRoom,
  sendSystemMessage,
} from "@/lib/db/chat";
import {
  getStoreRecruitmentById,
  addStoreApplication,
  getStoreApplicationStatus,
  getDevOrganizerId,
} from "@/lib/created-recruitments-store";

type Params = { params: Promise<{ id: string }> };

/** POST: 応募（1タップ応募 + 自動返信投入） */
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
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    // 空body OK
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  const supabase = await createClient();

  if (supabase) {
    try {
      const recruitment = await fetchRecruitmentById(supabase, recruitmentId);
      if (!recruitment) {
        return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
      }
      if (recruitment.status !== "public") {
        return NextResponse.json({ error: "この募集は受付中ではありません" }, { status: 400 });
      }

      const existingStatus = await getApplicationStatus(supabase, recruitmentId, user.id);
      if (existingStatus) {
        return NextResponse.json(
          { error: "すでに応募済みです", status: existingStatus },
          { status: 400 }
        );
      }

      await createApplication(supabase, recruitmentId, user.id, message || undefined);

      const room = await getOrCreateRecruitmentChatRoom(
        supabase,
        recruitmentId,
        user.id,
        user.id
      );

      if (room) {
        const { data: org } = await supabase
          .from("organizers")
          .select("profile_id")
          .eq("id", recruitment.organizer_id)
          .single();
        const senderId = org?.profile_id ?? user.id;

        const meetingTime =
          recruitment.start_at != null
            ? new Date(recruitment.start_at).toLocaleString("ja-JP", {
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "未定";
        const place = recruitment.meeting_place ?? "未定";
        const items = recruitment.items_to_bring ?? "特になし";

        const autoReply = `応募ありがとうございます。集合は${meetingTime}に${place}です。持ち物は${items}。遅刻はこのチャットで連絡してください。`;
        await sendSystemMessage(supabase, room.id, autoReply, senderId);
      }

      return NextResponse.json({
        success: true,
        status: "pending",
        message: "応募を受け付けました",
      });
    } catch (e) {
      console.error("recruitments/[id]/apply POST:", e);
      return NextResponse.json(
        { error: "応募に失敗しました" },
        { status: 500 }
      );
    }
  }

  // フォールバック: ストア
  const recruitment = getStoreRecruitmentById(recruitmentId);
  if (!recruitment) {
    return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
  }
  if (recruitment.status !== "public") {
    return NextResponse.json({ error: "この募集は受付中ではありません" }, { status: 400 });
  }

  const existingStatus = getStoreApplicationStatus(recruitmentId, user.id);
  if (existingStatus) {
    return NextResponse.json(
      { error: "すでに応募済みです", status: existingStatus },
      { status: 400 }
    );
  }

  addStoreApplication(recruitmentId, user.id, message || undefined);

  return NextResponse.json({
    success: true,
    status: "pending",
    message: "応募を受け付けました（開発モード：チャットはSupabase接続時に利用可能）",
  });
}
