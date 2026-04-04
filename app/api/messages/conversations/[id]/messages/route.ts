import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getMessages } from "@/lib/db/messages";
import { serializeDbError } from "@/lib/api/conversations-post";
import { hasDirectPostgresEnv } from "@/lib/direct-postgres-config";
import {
  fetchConversationMessagesDirectDb,
  insertConversationMessageDirectDb,
} from "@/lib/conversation-direct-db";

const LOG_TAG = "[api/messages/conversations/.../messages]";

/**
 * POST: 会話の最初のメッセージ等を API 経由で送信（クライアントからの直接 insert を避ける）
 */
export async function POST(
  request: NextRequest,
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

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "メッセージを入力してください" }, { status: 400 });
  }

  if (hasDirectPostgresEnv()) {
    try {
      const inserted = await insertConversationMessageDirectDb(
        user.id,
        conversationId,
        content
      );
      if (inserted) {
        console.log(LOG_TAG, "message inserted (direct db)", {
          userId: user.id,
          conversationId,
        });
        return NextResponse.json({ ok: true });
      }
      console.warn(LOG_TAG, "direct db insert skipped (not a member)", {
        userId: user.id,
        conversationId,
      });
    } catch (e) {
      console.error(LOG_TAG, "direct db insert failed, trying supabase", e);
    }
  }

  const { data: memberRow, error: memberErr } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr) {
    console.error(LOG_TAG, "member check failed", {
      userId: user.id,
      conversationId,
      ...serializeDbError(memberErr),
    });
    return NextResponse.json(
      { error: "会話への参加確認に失敗しました", details: serializeDbError(memberErr) },
      { status: 500 }
    );
  }

  if (!memberRow) {
    console.warn(LOG_TAG, "not a member", { userId: user.id, conversationId });
    return NextResponse.json(
      { error: "この会話にメッセージを送る権限がありません" },
      { status: 403 }
    );
  }

  const { error: insertError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content,
  });

  if (insertError) {
    console.error(LOG_TAG, "insert failed", {
      userId: user.id,
      conversationId,
      ...serializeDbError(insertError),
    });
    return NextResponse.json(
      {
        error: "メッセージの送信に失敗しました",
        details: serializeDbError(insertError),
      },
      { status: 500 }
    );
  }

  console.log(LOG_TAG, "message inserted", { userId: user.id, conversationId });
  return NextResponse.json({ ok: true });
}

/**
 * GET: メッセージ一覧取得（created_at 昇順）
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

  if (hasDirectPostgresEnv()) {
    try {
      const rows = await fetchConversationMessagesDirectDb(user.id, conversationId);
      if (rows === null) {
        return NextResponse.json(
          { error: "この会話を表示する権限がありません" },
          { status: 403 }
        );
      }
      return NextResponse.json(rows);
    } catch (e) {
      console.error(LOG_TAG, "direct db get messages failed, falling back to supabase", e);
    }
  }

  try {
    const messages = await getMessages(supabase, conversationId);
    return NextResponse.json(messages);
  } catch (e) {
    console.error(LOG_TAG, "getMessages error:", e);
    return NextResponse.json(
      {
        error: "メッセージの取得に失敗しました",
        details: serializeDbError(e),
      },
      { status: 500 }
    );
  }
}
