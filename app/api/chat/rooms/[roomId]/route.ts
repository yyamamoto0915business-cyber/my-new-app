import { createClient } from "@/lib/supabase/server";
import { getChatRoomById } from "@/lib/db/chat";
import { getEventById } from "@/lib/events";
import { getMockRoomById } from "@/lib/chat-mock";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const supabase = await createClient();
  const { roomId } = await params;

  // Supabase 未設定時: モックモード
  if (!supabase) {
    const room = getMockRoomById(roomId);
    if (!room) {
      return NextResponse.json({ error: "ルームが見つかりません" }, { status: 404 });
    }
    const event = getEventById(room.event_id ?? "");
    const eventTitle = event?.title ?? "イベント（デモ）";
    const mockRoom = getMockRoomById(roomId, eventTitle);
    return NextResponse.json(mockRoom);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const room = await getChatRoomById(supabase, roomId);
  if (!room) {
    return NextResponse.json({ error: "ルームが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(room);
}
