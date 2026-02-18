/**
 * Supabase 未設定時のモックチャット用インメモリストア
 */

export const MOCK_USER_ID = "mock-demo-user";
export const MOCK_ORGANIZER_ID = "mock-organizer";

type MockRoom = {
  id: string;
  event_id: string;
  participant_id: string;
  type: "event";
  created_at: string;
};

type MockMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
  sender?: { display_name: string | null; email: string | null };
};

const rooms = new Map<string, MockRoom>();
const messages = new Map<string, MockMessage[]>();

function uuid() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fallback
  }
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateMockRoom(eventId: string, participantId: string): MockRoom {
  const existing = Array.from(rooms.values()).find(
    (r) => r.event_id === eventId && r.participant_id === participantId
  );
  if (existing) return existing;

  const room: MockRoom = {
    id: uuid(),
    event_id: eventId,
    participant_id: participantId,
    type: "event",
    created_at: new Date().toISOString(),
  };
  rooms.set(room.id, room);
  messages.set(room.id, []);
  return room;
}

export function getMockRoomsByEvent(eventId: string): (MockRoom & { participant?: { display_name: string | null; email: string | null } })[] {
  const list = Array.from(rooms.values()).filter((r) => r.event_id === eventId);
  return list.map((r) => ({
    ...r,
    participant: { display_name: "参加者（デモ）", email: "demo@example.com" },
  }));
}

export function getMockRoomForParticipant(eventId: string, userId: string): MockRoom | null {
  return Array.from(rooms.values()).find(
    (r) => r.event_id === eventId && r.participant_id === userId
  ) ?? null;
}

export function getMockRoomById(
  roomId: string,
  eventTitle?: string
): (MockRoom & { event?: { title: string }; participant?: { display_name: string | null } }) | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  return {
    ...room,
    event: { title: eventTitle ?? "イベント（デモ）" },
    participant: { display_name: "参加者（デモ）" },
  };
}

export function getMockMessages(roomId: string): MockMessage[] {
  const list = messages.get(roomId) ?? [];
  return list.map((m) => ({
    ...m,
    sender: m.sender_id === MOCK_ORGANIZER_ID
      ? { display_name: "主催者", email: null }
      : { display_name: "自分", email: null },
  }));
}

export function addMockMessage(roomId: string, senderId: string, content: string): MockMessage | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const list = messages.get(roomId) ?? [];
  const msg: MockMessage = {
    id: uuid(),
    room_id: roomId,
    sender_id: senderId,
    content: content.trim(),
    pinned: false,
    created_at: new Date().toISOString(),
  };
  list.push(msg);
  messages.set(roomId, list);
  return {
    ...msg,
    sender: senderId === MOCK_ORGANIZER_ID
      ? { display_name: "主催者", email: null }
      : { display_name: "自分", email: null },
  };
}
