import { createClient } from "@/lib/supabase/server";
import { fetchMessages, sendMessage } from "@/lib/db/chat";
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
  const messages = await fetchMessages(supabase, roomId);
  return NextResponse.json(messages);
}

export async function POST(request: Request, { params }: Params) {
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
  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json(
      { error: "メッセージを入力してください" },
      { status: 400 }
    );
  }

  const message = await sendMessage(supabase, roomId, user.id, content);
  if (!message) {
    return NextResponse.json(
      { error: "送信に失敗しました" },
      { status: 500 }
    );
  }
  return NextResponse.json(message);
}
