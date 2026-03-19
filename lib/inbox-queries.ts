import type { SupabaseClient } from "@supabase/supabase-js";

export type InboxItem = {
  conversation_id: string;
  event_id: string | null;
  event_title: string | null;
  other_user_id: string;
  other_display_name: string | null;
  other_avatar_url: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  unread_count: number;
};

/**
 * RPC get_inbox の代替: テーブルクエリでトーク一覧を取得
 * （get_inbox がスキーマキャッシュで認識されない場合のフォールバック）
 */
export async function fetchInboxByQueries(
  supabase: SupabaseClient,
  currentUserId: string,
  limit = 50
): Promise<InboxItem[]> {
  // 1. 自分の conversation_members を取得（RLS で自分行のみ）
  const { data: members, error: memErr } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at")
    .eq("user_id", currentUserId);

  if (memErr) throw memErr;
  if (!members?.length) return [];

  const convIds = members.map((m) => m.conversation_id);
  const lastReadMap = new Map(
    members.map((m) => [m.conversation_id, m.last_read_at])
  );

  // 2. conversations + organizers を取得
  const { data: convs, error: convErr } = await supabase
    .from("conversations")
    .select(
      `
      id,
      event_id,
      organizer_id,
      other_user_id,
      organizers (profile_id)
    `
    )
    .in("id", convIds);

  if (convErr) throw convErr;
  if (!convs?.length) return [];

  // 3. 各会話の「相手」user_id を決定
  type ConvRow = {
    id: string;
    event_id: string | null;
    organizer_id: string;
    other_user_id: string;
    organizers: { profile_id: string } | { profile_id: string }[] | null;
  };
  const otherUserIds = (convs as ConvRow[]).map((c) => {
    const org = c.organizers;
    const orgProfileId = Array.isArray(org)
      ? org[0]?.profile_id
      : (org as { profile_id: string } | null)?.profile_id;
    return orgProfileId === currentUserId ? c.other_user_id : orgProfileId;
  });
  const uniqueOtherIds = [...new Set(otherUserIds)].filter(Boolean);

  // 4b. イベントタイトル取得（event_id -> events.title）
  const eventIds = (convs as ConvRow[])
    .map((c) => c.event_id)
    .filter((id): id is string => !!id);
  const uniqueEventIds = [...new Set(eventIds)];
  const { data: events } = uniqueEventIds.length
    ? await supabase.from("events").select("id, title").in("id", uniqueEventIds)
    : { data: [] as { id: string; title: string }[] };

  const eventMap = new Map(
    (events ?? []).map((e) => [e.id, e.title] as const)
  );

  // 4. 相手の profiles を取得
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", uniqueOtherIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
  );

  // 5. 各会話の最終メッセージを取得（サブクエリ代わりに messages を conversation_id で取得してクライアントで集約）
  const { data: allMessages } = await supabase
    .from("messages")
    .select("id, conversation_id, content, created_at, sender_id")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  const lastMsgMap = new Map<
    string,
    { content: string; created_at: string }
  >();
  const unreadMap = new Map<string, number>();

  for (const m of allMessages ?? []) {
    if (!lastMsgMap.has(m.conversation_id)) {
      lastMsgMap.set(m.conversation_id, {
        content: m.content,
        created_at: m.created_at,
      });
    }
    // 未読: 相手からのメッセージで、last_read_at より新しい
    if (m.sender_id !== currentUserId) {
      const lastRead = lastReadMap.get(m.conversation_id);
      const isUnread = !lastRead || m.created_at > lastRead;
      if (isUnread) {
        unreadMap.set(
          m.conversation_id,
          (unreadMap.get(m.conversation_id) ?? 0) + 1
        );
      }
    }
  }

  // 6. 結果を組み立て（last_message_at 降順）
  const items: InboxItem[] = (convs as ConvRow[]).map((c) => {
    const org = c.organizers;
    const orgProfileId = Array.isArray(org)
      ? org[0]?.profile_id
      : (org as { profile_id: string } | null)?.profile_id;
    const otherId =
      orgProfileId === currentUserId ? c.other_user_id : orgProfileId ?? c.other_user_id;
    const prof = profileMap.get(otherId);
    const lastMsg = lastMsgMap.get(c.id);
    return {
      conversation_id: c.id,
      event_id: c.event_id ?? null,
      event_title: c.event_id ? eventMap.get(c.event_id) ?? null : null,
      other_user_id: otherId,
      other_display_name: prof?.display_name ?? null,
      other_avatar_url: prof?.avatar_url ?? null,
      last_message_content: lastMsg?.content ?? null,
      last_message_at: lastMsg?.created_at ?? null,
      unread_count: unreadMap.get(c.id) ?? 0,
    };
  });

  items.sort((a, b) => {
    const aAt = a.last_message_at ?? "";
    const bAt = b.last_message_at ?? "";
    return bAt.localeCompare(aAt);
  });

  return items.slice(0, limit);
}
