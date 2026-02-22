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
  prefecture?: string | null;
  city?: string | null;
  area?: string | null;
  tags?: string[] | null;
  sponsor_ticket_prices?: number[] | null;
  sponsor_perks?: Record<number, string> | null;
  priority_slots?: number | null;
  english_guide_available?: boolean | null;
  capacity?: number | null;
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

// タグ定数
export const EVENT_TAGS = [
  { id: "free", label: "無料" },
  { id: "kids", label: "子供向け" },
  { id: "beginner", label: "初心者歓迎" },
  { id: "rain_ok", label: "雨天OK" },
  { id: "indoor", label: "屋内" },
  { id: "english", label: "英語対応" },
  { id: "tourist", label: "観光客向け" },
  { id: "student", label: "学生限定" },
] as const;

export const EVENT_TAG_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_TAGS.map((t) => [t.id, t.label])
);

export const getTagLabel = (tagId: string): string =>
  EVENT_TAG_LABELS[tagId] ?? tagId;

export type EventTagId = (typeof EVENT_TAGS)[number]["id"];

// アプリで使うイベント型（organizer情報含む）
export type Event = {
  id: string;
  title: string;
  imageUrl: string | null;
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
  prefecture?: string;
  city?: string;
  area?: string;
  tags?: string[];
  sponsorTicketPrices?: number[];
  sponsorPerks?: Record<number, string>;
  prioritySlots?: number;
  englishGuideAvailable?: boolean;
  capacity?: number;
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
