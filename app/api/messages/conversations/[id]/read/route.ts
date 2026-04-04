import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { markConversationAsRead } from "@/lib/db/messages";
import { hasDirectPostgresEnv } from "@/lib/direct-postgres-config";
import { markConversationReadDirectDb } from "@/lib/conversation-direct-db";

const LOG_TAG = "[api/messages/conversations/.../read]";

/** POST: 既読にする（conversation_members.last_read_at を now() に更新） */
export async function POST(
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

  if (hasDirectPostgresEnv()) {
    try {
      const ok = await markConversationReadDirectDb(user.id, conversationId);
      if (ok) {
        return NextResponse.json({ ok: true });
      }
    } catch (e) {
      console.error(LOG_TAG, "direct db read failed, falling back to supabase", e);
    }
  }

  try {
    await markConversationAsRead(supabase, conversationId, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(LOG_TAG, "markConversationAsRead error:", e);
    return NextResponse.json(
      { error: "既読の更新に失敗しました" },
      { status: 500 }
    );
  }
}
