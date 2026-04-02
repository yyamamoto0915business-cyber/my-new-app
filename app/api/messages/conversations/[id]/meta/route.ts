import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";

/**
 * GET: conversation のイベント名 / 主催者名などメタ情報
 * - RLS: conversations の member policy により、会話メンバー以外は 401/403 相当で弾かれる
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id: conversationId } = await params;
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId が必要です" },
      { status: 400 }
    );
  }

  try {
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("event_id, organizer_id")
      .eq("id", conversationId)
      .single();

    if (convError || !conv) {
      return NextResponse.json(
        { error: "会話が見つかりません" },
        { status: 404 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title")
      .eq("id", conv.event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "イベントが見つかりません" },
        { status: 404 }
      );
    }

    const { data: organizer, error: organizerError } = await supabase
      .from("organizers")
      .select("profile:profile_id(display_name, avatar_url)")
      .eq("id", conv.organizer_id)
      .single();

    type ProfileRel = { display_name: string | null; avatar_url: string | null };
    const profile = organizer?.profile as ProfileRel | null | undefined;
    const organizerName = profile?.display_name ?? null;
    const organizerAvatarUrl = profile?.avatar_url ?? null;

    if (organizerError || !organizer) {
      return NextResponse.json(
        { error: "主催者が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      eventId: conv.event_id as string,
      eventTitle: event.title as string,
      organizerDisplayName: organizerName ?? "主催者",
      organizerAvatarUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "メタ情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

