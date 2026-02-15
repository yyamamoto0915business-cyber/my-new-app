import { createClient } from "@/lib/supabase/server";
import { getChatRoomById } from "@/lib/db/chat";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "チャットは Supabase 連携時にご利用ください" },
      { status: 503 }
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { roomId } = await params;
  const room = await getChatRoomById(supabase, roomId);
  if (!room) {
    return NextResponse.json({ error: "ルームが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(room);
}
