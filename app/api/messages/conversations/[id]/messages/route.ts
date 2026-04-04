import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getMessages, insertParticipantMessage } from "@/lib/db/messages";
import {
  serializeDbError,
  structuredJsonError,
} from "@/lib/api/conversations-post";
import { hasDirectPostgresEnv } from "@/lib/direct-postgres-config";
import {
  fetchConversationMessagesDirectDb,
  insertConversationMessageDirectDb,
} from "@/lib/conversation-direct-db";
import { createAdminClient } from "@/lib/supabase/admin";

const LOG_TAG = "[api/messages/conversations/.../messages]";

async function resolveApiUserId(): Promise<{
  userId: string;
  getUserError: string | null;
  usedFallback: boolean;
} | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user: sessionUser },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (sessionUser?.id) {
    return {
      userId: sessionUser.id,
      getUserError: getUserError?.message ?? null,
      usedFallback: false,
    };
  }

  const apiUser = await getApiUser();
  if (apiUser) {
    console.warn(LOG_TAG, "auth.getUser empty; using getApiUser", {
      getUserError: getUserError?.message,
    });
    return {
      userId: apiUser.id,
      getUserError: getUserError?.message ?? null,
      usedFallback: true,
    };
  }

  return null;
}

/**
 * POST: 会話の最初のメッセージ等を API 経由で送信（クライアントからの直接 insert を避ける）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(LOG_TAG, "POST start");

  const auth = await resolveApiUserId();
  if (!auth) {
    console.error(LOG_TAG, "fail", { step: "auth", message: "auth_required" });
    return structuredJsonError(401, "auth", "auth_required");
  }

  const { userId, getUserError, usedFallback } = auth;
  console.log(LOG_TAG, "auth user", {
    userId,
    getUserError,
    usedFallback,
  });

  const supabase = await createClient();
  if (!supabase) {
    console.error(LOG_TAG, "fail", { step: "supabase_config" });
    return structuredJsonError(503, "supabase_config", "supabase_not_configured");
  }

  const { id: conversationId } = await params;
  if (!conversationId) {
    return structuredJsonError(400, "validate", "conversation_id_required");
  }

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return structuredJsonError(400, "parse_body", "invalid_json");
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    console.error(LOG_TAG, "fail", { step: "validate", message: "message_required" });
    return structuredJsonError(400, "validate", "message_required");
  }

  const admin = createAdminClient();

  if (hasDirectPostgresEnv()) {
    try {
      const inserted = await insertConversationMessageDirectDb(
        userId,
        conversationId,
        content
      );
      if (inserted) {
        console.log(LOG_TAG, "insert message result", {
          userId,
          conversationId,
          path: "direct_db",
          ok: true,
        });
        return NextResponse.json({ ok: true });
      }
      console.warn(LOG_TAG, "direct db insert skipped (not a member)", {
        userId,
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
    .eq("user_id", userId)
    .maybeSingle();

  if (memberErr) {
    console.error(LOG_TAG, "fail", {
      step: "check_membership",
      ...serializeDbError(memberErr),
      userId,
      conversationId,
    });
    return structuredJsonError(
      500,
      "check_membership",
      memberErr.message ?? "member_check_failed",
      memberErr
    );
  }

  if (!memberRow) {
    console.warn(LOG_TAG, "fail", {
      step: "check_membership",
      message: "not_a_member",
      userId,
      conversationId,
    });
    return structuredJsonError(403, "check_membership", "not_a_member");
  }

  const ins = await insertParticipantMessage({
    userId,
    conversationId,
    content,
    supabase,
    admin,
  });

  if (!ins.ok) {
    console.error(LOG_TAG, "insert message result", {
      data: null,
      error: serializeDbError(ins.error),
      source: ins.source,
      conversationId,
    });
    return structuredJsonError(
      500,
      "insert_message",
      serializeDbError(ins.error).message,
      ins.error,
      { conversationId }
    );
  }

  console.log(LOG_TAG, "insert message result", {
    data: { conversationId },
    error: null,
    viaAdminFallback: ins.viaAdminFallback,
  });

  return NextResponse.json({
    ok: true,
    viaAdminFallback: ins.viaAdminFallback,
  });
}

/**
 * GET: メッセージ一覧取得（created_at 昇順）
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await resolveApiUserId();
  if (!auth) {
    return structuredJsonError(401, "auth", "auth_required");
  }

  const supabase = await createClient();
  if (!supabase) {
    return structuredJsonError(503, "supabase_config", "supabase_not_configured");
  }

  const { id: conversationId } = await params;
  if (!conversationId) {
    return structuredJsonError(400, "validate", "conversation_id_required");
  }

  if (hasDirectPostgresEnv()) {
    try {
      const rows = await fetchConversationMessagesDirectDb(auth.userId, conversationId);
      if (rows === null) {
        return structuredJsonError(403, "load_messages", "forbidden");
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
    return structuredJsonError(
      500,
      "load_messages",
      serializeDbError(e).message,
      e
    );
  }
}
