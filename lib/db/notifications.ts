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
