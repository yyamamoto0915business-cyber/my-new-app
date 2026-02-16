// DB型定義（Supabase のテーブルに対応）

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Organizer = {
  id: string;
  profile_id: string;
  plan: "free" | "light" | "standard";
  organization_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
};

export type DbEvent = {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  address: string;
  price: number;
  price_note: string | null;
  rain_policy: string | null;
  items_to_bring: string[] | null;
  access: string | null;
  child_friendly: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type EventParticipantStatus =
  | "applied"
  | "confirmed"
  | "checked_in"
  | "completed";

export type EventParticipant = {
  id: string;
  event_id: string;
  user_id: string;
  status: EventParticipantStatus;
  created_at: string;
};

// アプリで使うイベント型（organizer情報含む）
export type Event = {
  id: string;
  title: string;
  imageUrl?: string;
  description: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  address: string;
  price: number;
  priceNote?: string;
  organizerName: string;
  organizerContact?: string;
  childFriendly: boolean;
  rainPolicy?: string;
  itemsToBring?: string[];
  access?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
};

export type EventFormData = Omit<
  Event,
  "id" | "createdAt" | "organizerName" | "organizerContact"
> & {
  organizerName?: string;
  organizerContact?: string;
};

// チャット
export type ChatRoom = {
  id: string;
  event_id: string | null;
  recruitment_id: string | null;
  type: "event" | "recruitment";
  participant_id: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
};

export type ChatRoomWithParticipant = ChatRoom & {
  participant?: Profile | null;
  event?: { title: string } | null;
};
