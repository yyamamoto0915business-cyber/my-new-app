import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

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
