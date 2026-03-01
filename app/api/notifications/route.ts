import { createClient } from "@/lib/supabase/server";
import { fetchNotifications, getUnreadCount } from "@/lib/db/notifications";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get("count") === "true";

  if (countOnly) {
    const unreadCount = await getUnreadCount(supabase, user.id);
    return NextResponse.json({ unreadCount });
  }

  const [notifications, unreadCount] = await Promise.all([
    fetchNotifications(supabase, user.id),
    getUnreadCount(supabase, user.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
