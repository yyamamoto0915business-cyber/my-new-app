import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "new_message"
  | "system_message"
  | "participation_confirmed"
  | "status_updated"
  | "other";

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
