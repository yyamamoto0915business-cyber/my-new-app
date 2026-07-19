import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getParticipantStatus } from "@/lib/db/events";
import {
  REMINDER_MINUTES_BEFORE,
  resolveReminderAtIso,
} from "@/lib/event-online";
import { formatTimeToHm } from "@/lib/format-date";

type Params = { params: Promise<{ id: string }> };

const PASS_ELIGIBLE = new Set([
  "applied",
  "confirmed",
  "checked_in",
  "completed",
]);

async function assertHasPass(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  eventId: string,
  userId: string
): Promise<boolean> {
  const status = await getParticipantStatus(supabase, eventId, userId);
  return Boolean(status && PASS_ELIGIBLE.has(status));
}

/** GET: リマインダー設定の取得 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id: eventId } = await params;
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ enabled: false });
  }

  if (!(await assertHasPass(supabase, eventId, user.id))) {
    return NextResponse.json({ error: "有効な参加パスがありません" }, { status: 403 });
  }

  const { data } = await supabase
    .from("event_reminder_prefs")
    .select("enabled, remind_at, notified_at")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    enabled: Boolean(data?.enabled),
    remindAt: data?.remind_at ?? null,
    notifiedAt: data?.notified_at ?? null,
  });
}

/** POST: リマインダー ON/OFF */
export async function POST(request: NextRequest, { params }: Params) {
  const { id: eventId } = await params;
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: { enabled?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストが不正です" }, { status: 400 });
  }

  const enabled = Boolean(body.enabled);
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "データベースに接続できません" },
      { status: 503 }
    );
  }

  if (!(await assertHasPass(supabase, eventId, user.id))) {
    return NextResponse.json({ error: "有効な参加パスがありません" }, { status: 403 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("date, start_time")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  const startTime = formatTimeToHm(String(event.start_time ?? ""));
  const remindAt = resolveReminderAtIso(String(event.date), startTime);
  if (!remindAt) {
    return NextResponse.json(
      { error: "開催日時が正しくありません" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("event_reminder_prefs").upsert(
    {
      user_id: user.id,
      event_id: eventId,
      enabled,
      remind_minutes_before: REMINDER_MINUTES_BEFORE,
      remind_at: remindAt,
      notified_at: null,
      updated_at: now,
    },
    { onConflict: "user_id,event_id" }
  );

  if (error) {
    console.error("reminder upsert:", error);
    return NextResponse.json(
      { error: "リマインダーの保存に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ enabled, remindAt });
}
