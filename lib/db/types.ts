// DB型定義（Supabase のテーブルに対応）

export type ProfileRole = "user" | "organizer" | "developer_admin";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  participant_avatar_url?: string | null;
  organizer_avatar_url?: string | null;
  active_profile_role?: "participant" | "organizer" | null;
  phone: string | null;
  address: string | null;
  region: string | null;
  bio: string | null;
  role?: ProfileRole | null;
  created_at: string;
  updated_at: string;
};

export type Organizer = {
  id: string;
  profile_id: string;
  plan: "free" | "light" | "standard" | "trial" | "starter";
  organization_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
  earlybird_eligible?: boolean;
  full_feature_trial_end_at?: string | null;
  founder30_granted_at?: string | null;
  founder30_end_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
  stripe_account_id?: string | null;
  stripe_account_charges_enabled?: boolean;
  stripe_account_details_submitted?: boolean;
  // 開発者管理画面用の手動付与情報・課金ソース
  manual_grant_active?: boolean;
  manual_grant_plan?: string | null;
  manual_grant_expires_at?: string | null;
  manual_grant_reason?: string | null;
  billing_source?: string | null;
  updated_by_admin?: string | null;
};

export type Sponsorship = {
  id: string;
  created_at: string;
  event_id: string;
  organizer_id: string;
  amount_jpy: number;
  platform_fee_jpy: number;
  organizer_net_jpy: number;
  currency: string;
  sponsor_name: string | null;
  sponsor_company: string | null;
  sponsor_email: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: "pending" | "paid" | "refunded" | "failed";
  receipt_url: string | null;
};

export type DbEvent = {
  id: string;
  organizer_id: string;
  /** イベントの公開状態（下書き / 公開中 / アーカイブ） */
  status?: "draft" | "published" | "archived";
  published_at?: string | null;
  /** 公開可否（将来の制御用 / NULL は公開扱い） */
  is_public?: boolean | null;
  /** サンプル / シードデータ判定用フラグ（NULL は false 扱い） */
  is_sample?: boolean | null;
  /** シード由来かどうかのメタデータ（"seed" など） */
  seed_source?: string | null;
  sponsor_enabled?: boolean;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  address: string;
  /** 開催店舗（任意。stores.id） */
  store_id?: string | null;
  price: number;
  price_note: string | null;
  /** イベント単位の主催者表示名（NULL 時は organizers をフォールバック） */
  organizer_display_name?: string | null;
  /** イベント単位の連絡先（NULL 時は organizers をフォールバック） */
  organizer_contact?: string | null;
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
  requires_registration?: boolean | null;
  participation_mode?: "required" | "optional" | "none" | null;
  payment_method?: "online" | "onsite" | "both" | null;
  check_in_method?: "qr" | "manual" | null;
  pass_configured?: boolean | null;
  registration_deadline?: string | null;
  registration_note?: string | null;
  /** 開催パターン: none=単発, weekly=毎週, monthly=毎月 */
  recurrence?: string | null;
  /** 繰り返し回数（初回を含む。単発のときは NULL） */
  recurrence_count?: number | null;
  /** 開催形式: onsite / online / hybrid（未設定は onsite） */
  event_format?: "onsite" | "online" | "hybrid" | null;
  online_service?: string | null;
  online_join_url?: string | null;
  online_meeting_id?: string | null;
  online_passcode?: string | null;
  online_guide_message?: string | null;
  online_link_visibility?: string | null;
  online_link_display_timing?: string | null;
  public_page_link_visible?: boolean | null;
  created_at: string;
  updated_at: string;
};

export type EventParticipantStatus =
  | "applied"
  | "confirmed"
  | "declined"
  | "change_requested"
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
  /** イベントの公開状態（下書き / 公開中 / アーカイブ） */
  status?: "draft" | "published" | "archived";
  publishedAt?: string | null;
  title: string;
  imageUrl: string | null;
  /** 詳細ギャラリー用の追加画像（代表 imageUrl とは別・最大5枚） */
  galleryImages?: string[];
  description: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  address: string;
  /** 開催店舗 ID（任意） */
  storeId?: string | null;
  price: number;
  priceNote?: string;
  organizerName: string;
  organizerContact?: string;
  /** 主催者プロフィールへのリンク用（APIレスポンスで付与） */
  organizerId?: string | null;
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
  requiresRegistration?: boolean;
  /** 参加方式: 申込必須 / 申込任意 / 申込不要 */
  participationMode?: "required" | "optional" | "none";
  /** 参加パス: 支払い方法（無料・申込不要時は null） */
  paymentMethod?: "online" | "onsite" | "both" | null;
  /** 参加パス: 当日受付方法 */
  checkInMethod?: "qr" | "manual" | null;
  /** 参加パス設定画面で保存済みか */
  passConfigured?: boolean;
  registrationDeadline?: string;
  registrationNote?: string;
  /** 開催パターン: none=単発, weekly=毎週, monthly=毎月 */
  recurrence?: "none" | "weekly" | "monthly";
  /** 繰り返し回数（初回を含む。単発のときは未設定） */
  recurrenceCount?: number | null;
  /** 開催形式（未設定は onsite）。公開レスポンスにも含めてよい非機密 */
  eventFormat?: "onsite" | "online" | "hybrid";
  /**
   * 以下は主催者向け / 参加パス専用APIのみ。公開ページ用 Event には載せない。
   * 型上は optional だが公開マッパーでは付与しない。
   */
  onlineService?:
    | "zoom"
    | "google_meet"
    | "microsoft_teams"
    | "youtube_live"
    | "other"
    | null;
  onlineJoinUrl?: string | null;
  onlineMeetingId?: string | null;
  onlinePasscode?: string | null;
  onlineGuideMessage?: string | null;
  onlineLinkVisibility?: "pass_holders_only" | null;
  onlineLinkDisplayTiming?:
    | "immediately"
    | "60_minutes_before"
    | "30_minutes_before"
    | "15_minutes_before"
    | "5_minutes_before"
    | null;
  publicPageLinkVisible?: boolean | null;
  createdAt: string;
  participantCount?: number;
  avgRating?: number;
  /** 一般公開から除外したい内部イベント（サロン限定など） */
  salonOnly?: boolean;
  /** 公開可否（NULL は公開扱い・公開APIでは false を除外） */
  isPublic?: boolean | null;
  /** サンプル/テンプレ/seed データを示すフラグ（NULL は false 扱い） */
  isSample?: boolean | null;
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
  organizer_memo?: string | null;
  created_at: string;
};

export type ChatMessageType = "user" | "system";

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  pinned: boolean;
  type?: ChatMessageType;
  created_at: string;
};

export type ChatRoomWithParticipant = ChatRoom & {
  participant?: Profile | null;
  event?: { title: string } | null;
};

// 応援/スポンサー
export type SponsorTierType = "individual" | "company";

export type SponsorTier = {
  id: string;
  eventId: string;
  type: SponsorTierType;
  price: number;
  name: string;
  description?: string | null;
  benefits: string[];
  sortOrder: number;
  isActive: boolean;
};

export type SponsorPurchaseStatus = "pending" | "paid" | "refunded" | "failed";

export type SponsorPurchase = {
  id: string;
  eventId: string;
  tierId: string;
  amount: number;
  quantity: number;
  displayName?: string | null;
  isAnonymous: boolean;
  comment?: string | null;
  status: SponsorPurchaseStatus;
  stripeSessionId?: string | null;
  createdAt: string;
};

export type SponsorApplicationStatus = "pending" | "approved" | "rejected";

export type SponsorApplication = {
  id: string;
  eventId: string;
  tierId: string;
  companyName: string;
  personName: string;
  email: string;
  phone?: string | null;
  invoiceInfo?: string | null;
  message?: string | null;
  logoUrl?: string | null;
  status: SponsorApplicationStatus;
  createdAt: string;
};
