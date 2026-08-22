import type { SupabaseClient } from "@supabase/supabase-js";
import { applicationFormPath } from "@/lib/recruitment-application-form";

export type NotificationType =
  | "new_message"
  | "system_message"
  | "participation_confirmed"
  | "status_updated"
  | "other"
  | "follow_request"
  | "follow_accepted"
  | "post_like";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  type: NotificationType,
  title: string,
  options?: { body?: string; link?: string }
): Promise<Notification | null> {
  const { data, error } = await supabase.rpc("create_notification_for_user", {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_body: options?.body ?? null,
    p_link: options?.link ?? null,
  });

  if (error || !data) return null;
  const { data: notif } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", data)
    .single();
  return notif as Notification | null;
}

export async function fetchNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 50
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as Notification[];
}

export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function markAsRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

export async function markAllAsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  return !error;
}

export type EventParticipantNotifyKind = "message" | "emergency";

const STAFF_ACTIVE_STATUSES = ["accepted", "confirmed", "checked_in", "completed"] as const;

export async function fetchEventParticipantUserIds(
  supabase: SupabaseClient,
  eventId: string
): Promise<string[]> {
  const [{ data: participants }, { data: checkins }] = await Promise.all([
    supabase
      .from("event_participants")
      .select("user_id")
      .eq("event_id", eventId)
      .not("status", "eq", "declined"),
    supabase
      .from("event_checkins")
      .select("user_id")
      .eq("event_id", eventId)
      .not("user_id", "is", null),
  ]);

  const ids = new Set<string>();
  for (const row of participants ?? []) {
    if (row.user_id) ids.add(row.user_id);
  }
  for (const row of checkins ?? []) {
    if (row.user_id) ids.add(row.user_id);
  }
  return Array.from(ids);
}

/** このイベントのスタッフ募集で採用済みのユーザーID */
export async function fetchEventStaffUserIds(
  supabase: SupabaseClient,
  eventId: string
): Promise<string[]> {
  const { data: recruitments, error: recError } = await supabase
    .from("recruitments")
    .select("id")
    .eq("event_id", eventId);

  if (recError || !recruitments?.length) return [];

  const recruitmentIds = recruitments.map((r) => r.id as string);
  const { data: applications, error: appError } = await supabase
    .from("recruitment_applications")
    .select("user_id, status")
    .in("recruitment_id", recruitmentIds)
    .in("status", [...STAFF_ACTIVE_STATUSES]);

  if (appError || !applications?.length) return [];

  const ids = new Set<string>();
  for (const row of applications) {
    if (row.user_id) ids.add(row.user_id as string);
  }
  return Array.from(ids);
}

export async function notifyEventParticipants(
  supabase: SupabaseClient,
  input: {
    eventId: string;
    eventTitle: string;
    kind: EventParticipantNotifyKind;
    content: string;
    excludeUserId?: string;
  }
): Promise<{ sent: number; total: number }> {
  const recipientIds = await fetchEventParticipantUserIds(supabase, input.eventId);
  const targets = input.excludeUserId
    ? recipientIds.filter((id) => id !== input.excludeUserId)
    : recipientIds;

  const title =
    input.kind === "emergency"
      ? `【重要】${input.eventTitle}`
      : `${input.eventTitle}からのお知らせ`;
  const link = `/events/${input.eventId}`;

  let sent = 0;
  for (const userId of targets) {
    const notif = await createNotification(supabase, userId, "system_message", title, {
      body: input.content,
      link,
    });
    if (notif) sent++;
  }

  return { sent, total: targets.length };
}

/** イベントに登録されたスタッフへお知らせ通知を送信 */
export async function notifyEventStaff(
  supabase: SupabaseClient,
  input: {
    eventId: string;
    eventTitle: string;
    content: string;
    excludeUserId?: string;
  }
): Promise<{ sent: number; total: number }> {
  const recipientIds = await fetchEventStaffUserIds(supabase, input.eventId);
  const targets = input.excludeUserId
    ? recipientIds.filter((id) => id !== input.excludeUserId)
    : recipientIds;

  const title = `【スタッフ連絡】${input.eventTitle}`;
  const link = `/events/${input.eventId}`;

  let sent = 0;
  for (const userId of targets) {
    const notif = await createNotification(supabase, userId, "system_message", title, {
      body: input.content,
      link,
    });
    if (notif) sent++;
  }

  return { sent, total: targets.length };
}

/** 募集の承認済みスタッフへお知らせ通知を送信（ダッシュボードお知らせと同じ通知経路） */
export async function notifyRecruitmentStaff(
  supabase: SupabaseClient,
  input: {
    recruitmentId: string;
    recruitmentTitle: string;
    eventId?: string | null;
    content: string;
    excludeUserId?: string;
    targetUserIds?: string[];
  }
): Promise<{ sent: number; total: number; failedParticipantIds: string[] }> {
  const { data: applications, error } = await supabase
    .from("recruitment_applications")
    .select("user_id, status")
    .eq("recruitment_id", input.recruitmentId)
    .in("status", [...STAFF_ACTIVE_STATUSES]);

  if (error) {
    throw error;
  }

  const acceptedIds = new Set<string>();
  for (const row of applications ?? []) {
    if (row.user_id) acceptedIds.add(row.user_id as string);
  }

  let recipientIds =
    input.targetUserIds && input.targetUserIds.length > 0
      ? input.targetUserIds.filter((id) => acceptedIds.has(id))
      : Array.from(acceptedIds);

  if (input.excludeUserId) {
    recipientIds = recipientIds.filter((id) => id !== input.excludeUserId);
  }

  const title = `【スタッフ連絡】${input.recruitmentTitle}`;
  const link = input.eventId
    ? `/events/${input.eventId}`
    : `/volunteer/${input.recruitmentId}`;

  let sent = 0;
  const failedParticipantIds: string[] = [];
  for (const userId of recipientIds) {
    const notif = await createNotification(supabase, userId, "system_message", title, {
      body: input.content,
      link,
    });
    if (notif) sent++;
    else failedParticipantIds.push(userId);
  }

  return { sent, total: recipientIds.length, failedParticipantIds };
}

/** 応募後: フォーム入力を促すお知らせ */
export async function notifyApplicationFormRequired(
  supabase: SupabaseClient,
  userId: string,
  recruitment: { id: string; title: string }
): Promise<boolean> {
  const notif = await createNotification(
    supabase,
    userId,
    "system_message",
    "応募フォームの入力が必要です",
    {
      body: "必須項目を入力して提出しないと、応募は完了しません。",
      link: applicationFormPath(recruitment.id),
    }
  );
  return Boolean(notif);
}
