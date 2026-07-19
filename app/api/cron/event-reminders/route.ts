import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/db/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron: 開始30分前リマインダーを既存ベル通知へ配信
 * Authorization: Bearer ${CRON_SECRET}
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Admin client unavailable" },
      { status: 503 }
    );
  }

  const nowIso = new Date().toISOString();
  const { data: due, error } = await admin
    .from("event_reminder_prefs")
    .select("id, user_id, event_id")
    .eq("enabled", true)
    .is("notified_at", null)
    .lte("remind_at", nowIso)
    .limit(100);

  if (error) {
    console.error("event-reminders cron select:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const row of due ?? []) {
    const { data: event } = await admin
      .from("events")
      .select("title")
      .eq("id", row.event_id)
      .maybeSingle();

    const title = event?.title
      ? `まもなく開始です：${event.title}`
      : "まもなく開始です";

    const notif = await createNotification(
      admin,
      row.user_id,
      "system_message",
      title,
      {
        body: "開始30分前です。参加パスからご確認ください",
        link: "/pass",
      }
    );

    if (notif) {
      await admin
        .from("event_reminder_prefs")
        .update({ notified_at: nowIso, updated_at: nowIso })
        .eq("id", row.id);
      sent++;
    }
  }

  return NextResponse.json({
    processed: due?.length ?? 0,
    sent,
  });
}
