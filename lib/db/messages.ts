import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasDirectPostgresEnv } from "@/lib/direct-postgres-config";
import { createOrGetConversationDirectDb } from "@/lib/conversation-direct-db";

export type InboxItem = {
  conversation_id: string;
  other_user_id: string;
  other_display_name: string | null;
  other_avatar_url: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

/** get_inbox RPC でトーク一覧を取得 */
export async function getInbox(
  supabase: SupabaseClient,
  limit = 50
): Promise<InboxItem[]> {
  const { data, error } = await supabase.rpc("get_inbox", { p_limit: limit });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    conversation_id: row.conversation_id as string,
    other_user_id: row.other_user_id as string,
    other_display_name: (row.other_display_name as string) ?? null,
    other_avatar_url: (row.other_avatar_url as string) ?? null,
    last_message_content: (row.last_message_content as string) ?? null,
    last_message_at: (row.last_message_at as string) ?? null,
    unread_count: Number(row.unread_count ?? 0),
  }));
}

/**
 * admin クライアントで conversations / conversation_members を直接操作。
 * create_or_get_conversation_for_user RPC がスキーマキャッシュにない場合のフォールバック。
 */
async function createOrGetConversationAdminDirect(
  admin: SupabaseClient,
  params: {
    callerUserId: string;
    eventId: string;
    kind: string;
    organizerId: string;
    otherUserId: string;
  }
): Promise<string> {
  const { callerUserId, eventId, kind, organizerId, otherUserId } = params;

  const { data: org, error: orgErr } = await admin
    .from("organizers")
    .select("profile_id")
    .eq("id", organizerId)
    .maybeSingle();
  if (orgErr) throw orgErr;
  const organizerProfileId = org?.profile_id as string | undefined;
  if (!organizerProfileId) throw new Error("organizer not found");

  if (callerUserId !== organizerProfileId && callerUserId !== otherUserId) {
    throw new Error("not allowed to create this conversation");
  }

  const eventValue =
    eventId === "00000000-0000-0000-0000-000000000000" ? null : eventId;

  // INSERT, 重複は 23505 で無視
  const { error: insertError } = await admin.from("conversations").insert({
    event_id: eventValue,
    kind,
    organizer_id: organizerId,
    other_user_id: otherUserId,
  });
  if (insertError && insertError.code !== "23505") throw insertError;

  // SELECT（admin は RLS バイパスなので必ず取得できる）
  const baseQuery = admin
    .from("conversations")
    .select("id")
    .eq("kind", kind)
    .eq("organizer_id", organizerId)
    .eq("other_user_id", otherUserId);

  const { data: conv, error: convErr } = await (eventValue
    ? baseQuery.eq("event_id", eventValue)
    : baseQuery.is("event_id", null)
  ).maybeSingle();

  if (convErr) throw convErr;
  if (!conv?.id) throw new Error("conversation upsert did not resolve id");
  const convId = conv.id as string;

  // conversation_members を upsert（ON CONFLICT DO NOTHING 相当）
  await admin
    .from("conversation_members")
    .upsert(
      [
        { conversation_id: convId, user_id: organizerProfileId },
        { conversation_id: convId, user_id: otherUserId },
      ],
      { onConflict: "conversation_id,user_id", ignoreDuplicates: true }
    );

  return convId;
}

/**
 * 会話を作成/取得。
 * 本番では Service Role 専用 RPC（caller を明示）を優先し、JWT が RPC に乗らない環境でも動かす。
 * マイグレーション未適用時は従来の create_or_get_conversation にフォールバック。
 */
export async function createOrGetConversation(
  supabase: SupabaseClient,
  params: {
    callerUserId: string;
    eventId: string | null;
    kind: string;
    organizerId: string;
    otherUserId: string;
  }
): Promise<string> {
  const eventId =
    params.eventId ?? "00000000-0000-0000-0000-000000000000";

  if (hasDirectPostgresEnv()) {
    try {
      return await createOrGetConversationDirectDb({
        callerUserId: params.callerUserId,
        eventId,
        kind: params.kind,
        organizerId: params.organizerId,
        otherUserId: params.otherUserId,
      });
    } catch (e) {
      console.error(
        "[createOrGetConversation] direct postgres failed, falling back to RPC",
        e
      );
    }
  }

  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin.rpc("create_or_get_conversation_for_user", {
      p_caller: params.callerUserId,
      p_event_id: eventId,
      p_kind: params.kind,
      p_organizer_id: params.organizerId,
      p_other_user_id: params.otherUserId,
    });
    if (!error && data != null) {
      return data as string;
    }
    const msg = (error?.message ?? "").toLowerCase();
    const missingFn =
      /does not exist|could not find|schema cache|42883|pgrst202/i.test(msg);
    if (!missingFn) throw error;

    // RPC がスキーマキャッシュに存在しない場合、admin で直接 INSERT/SELECT にフォールバック
    console.warn(
      "[createOrGetConversation] admin RPC not found in schema cache, trying direct admin insert"
    );
    try {
      return await createOrGetConversationAdminDirect(admin, {
        callerUserId: params.callerUserId,
        eventId,
        kind: params.kind,
        organizerId: params.organizerId,
        otherUserId: params.otherUserId,
      });
    } catch (e) {
      const errMsg = (e instanceof Error ? e.message : String(e)).toLowerCase();
      // ビジネスロジックエラー（organizer not found 等）はそのまま投げる
      if (/organizer not found|not allowed to create/.test(errMsg)) throw e;
      console.error(
        "[createOrGetConversation] admin direct failed, falling back to user RPC",
        e
      );
    }
  }

  const { data, error } = await supabase.rpc("create_or_get_conversation", {
    p_event_id: eventId,
    p_kind: params.kind,
    p_organizer_id: params.organizerId,
    p_other_user_id: params.otherUserId,
  });
  if (error) throw error;
  return data as string;
}

/** メッセージ一覧取得（created_at 昇順） */
export async function getMessages(
  supabase: SupabaseClient,
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    content: row.content,
    created_at: row.created_at,
  }));
}

/** 自分の last_read_at を更新 */
export async function markConversationAsRead(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * 参加者として messages に INSERT。ユーザー JWT で RLS に阻まれた場合のみ、
 * メンバー確認のうえ service role で再試行（本番で JWT/RLS 不整合時の切り分け用）。
 */
export async function insertParticipantMessage(opts: {
  userId: string;
  conversationId: string;
  content: string;
  supabase: SupabaseClient;
  admin: SupabaseClient | null;
}): Promise<
  | { ok: true; viaAdminFallback: boolean }
  | { ok: false; source: "user_insert" | "member_check" | "admin_insert"; error: unknown }
> {
  const { userId, conversationId, content, supabase, admin } = opts;

  const { error: insertError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    content,
  });

  if (!insertError) {
    return { ok: true, viaAdminFallback: false };
  }

  const msg = (insertError.message ?? "").toLowerCase();
  const rlsLike =
    insertError.code === "42501" ||
    /permission denied|row-level security|new row violates row-level security/i.test(
      msg
    );

  if (!admin || !rlsLike) {
    return { ok: false, source: "user_insert", error: insertError };
  }

  const { data: mem, error: memErr } = await admin
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memErr) {
    return { ok: false, source: "member_check", error: memErr };
  }
  if (!mem) {
    return {
      ok: false,
      source: "member_check",
      error: new Error("not_conversation_member"),
    };
  }

  const { error: adminErr } = await admin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    content,
  });

  if (adminErr) {
    return { ok: false, source: "admin_insert", error: adminErr };
  }

  return { ok: true, viaAdminFallback: true };
}
