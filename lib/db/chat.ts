import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, ChatRoom, ChatRoomWithParticipant } from "./types";

/** イベント×参加者の1:1ルームを取得 or 作成 */
export async function getOrCreateEventChatRoom(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
  userId: string
): Promise<ChatRoom | null> {
  const { data: existing } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("event_id", eventId)
    .eq("participant_id", participantId)
    .eq("type", "event")
    .maybeSingle();

  if (existing) return existing as ChatRoom;

  const { data: inserted, error } = await supabase
    .from("chat_rooms")
    .insert({
      event_id: eventId,
      type: "event",
      participant_id: participantId,
    })
    .select()
    .single();

  if (error) return null;
  return inserted as ChatRoom;
}

/** 主催者向け: イベントの参加者一覧と各ルーム */
export async function getEventChatRoomsForOrganizer(
  supabase: SupabaseClient,
  eventId: string
): Promise<ChatRoomWithParticipant[]> {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select(
      `
      *,
      participant:profiles (
        id,
        email,
        display_name,
        avatar_url
      )
    `
    )
    .eq("event_id", eventId)
    .eq("type", "event")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as ChatRoomWithParticipant[];
}

/** 参加者向け: 自分の1ルーム取得 */
export async function getEventChatRoomForParticipant(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<ChatRoom | null> {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("event_id", eventId)
    .eq("participant_id", userId)
    .eq("type", "event")
    .maybeSingle();

  if (error || !data) return null;
  return data as ChatRoom;
}

/** ルーム詳細（アクセス可否は RLS で判定） */
export async function getChatRoomById(
  supabase: SupabaseClient,
  roomId: string
): Promise<
  | (ChatRoom & {
      event?: { title: string };
      participant?: { display_name: string | null };
    })
  | null
> {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error || !data) return null;

  const room = data as ChatRoom;
  const eventId = room.event_id;
  const participantId = room.participant_id;

  let eventTitle: string | undefined;
  let participantName: string | null = null;

  if (eventId) {
    const { data: ev } = await supabase
      .from("events")
      .select("title")
      .eq("id", eventId)
      .single();
    eventTitle = ev?.title;
  }
  if (participantId) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", participantId)
      .single();
    participantName = prof?.display_name ?? null;
  }

  return {
    ...room,
    event: eventTitle ? { title: eventTitle } : undefined,
    participant: { display_name: participantName },
  };
}

/** メッセージ一覧 */
export async function fetchMessages(
  supabase: SupabaseClient,
  roomId: string,
  limit = 100
): Promise<(ChatMessage & { sender?: { display_name: string | null; email: string | null } })[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      `
      *,
      sender:profiles (display_name, email)
    `
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as (ChatMessage & { sender?: { display_name: string | null; email: string | null } })[];
}

/** メッセージ送信 */
export async function sendMessage(
  supabase: SupabaseClient,
  roomId: string,
  senderId: string,
  content: string
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      sender_id: senderId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return null;
  return data as ChatMessage;
}
