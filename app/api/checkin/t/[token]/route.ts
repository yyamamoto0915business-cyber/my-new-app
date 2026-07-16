import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";

type Params = { params: Promise<{ token: string }> };

type ParticipationMode = "required" | "optional" | "none";

function resolveParticipationMode(
  participationMode: string | null | undefined,
  requiresRegistration: boolean | null | undefined
): ParticipationMode {
  if (participationMode === "required" || participationMode === "optional" || participationMode === "none") {
    return participationMode;
  }
  return requiresRegistration ? "required" : "none";
}

/** GET: トークンからイベント情報を取得（公開エンドポイント） */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB未設定" }, { status: 503 });
  }

  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, title, date, start_time, end_time, location, checkin_enabled, organizer_id, participation_mode, requires_registration"
    )
    .eq("checkin_token", token)
    .maybeSingle();

  if (error || !event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }
  if (!event.checkin_enabled) {
    return NextResponse.json({ error: "このイベントのチェックインは無効です" }, { status: 403 });
  }

  const participationMode = resolveParticipationMode(
    event.participation_mode,
    event.requires_registration
  );

  return NextResponse.json({
    id: event.id,
    title: event.title,
    date: event.date,
    startTime: event.start_time,
    endTime: event.end_time,
    location: event.location,
    participationMode,
    walkInAllowed: participationMode !== "required",
  });
}

/** POST: チェックイン登録 */
export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB未設定" }, { status: 503 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, checkin_enabled, participation_mode, requires_registration")
    .eq("checkin_token", token)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }
  if (!event.checkin_enabled) {
    return NextResponse.json({ error: "このイベントのチェックインは無効です" }, { status: 403 });
  }

  const participationMode = resolveParticipationMode(
    event.participation_mode,
    event.requires_registration
  );

  let body: Record<string, unknown> = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    // empty body OK
  }

  const guestName = typeof body.guest_name === "string" ? body.guest_name.trim() : null;
  const user = await getApiUser();
  const userId = user?.id ?? null;

  if (!userId && !guestName) {
    return NextResponse.json({ error: "お名前を入力してください" }, { status: 400 });
  }

  let participant: { id: string; status: string } | null = null;
  if (userId) {
    const { data } = await supabase
      .from("event_participants")
      .select("id, status")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .maybeSingle();
    participant = data;
  }

  // 申込必須: 未申込（ゲスト含む）は拒否
  if (participationMode === "required" && !participant) {
    return NextResponse.json(
      {
        error: "このイベントは事前申し込みが必要です",
        code: "registration_required",
      },
      { status: 403 }
    );
  }

  if (participant?.status === "declined") {
    return NextResponse.json({ error: "この参加は辞退済みです" }, { status: 403 });
  }

  // ログイン済み重複チェック
  if (userId) {
    const { data: existing } = await supabase
      .from("event_checkins")
      .select("id, checked_in_at")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .maybeSingle();

    const alreadyByStatus =
      participant?.status === "checked_in" || participant?.status === "completed";

    if (existing || alreadyByStatus) {
      return NextResponse.json(
        {
          error: "すでにチェックイン済みです",
          alreadyCheckedIn: true,
          checkedInAt: existing?.checked_in_at ?? null,
        },
        { status: 409 }
      );
    }
  }

  // ゲスト同名チェック（警告のみ、フォースフラグがなければ返す）
  if (!userId && guestName) {
    const force = body.force === true;
    if (!force) {
      const { data: sameNames } = await supabase
        .from("event_checkins")
        .select("id")
        .eq("event_id", event.id)
        .eq("guest_name", guestName)
        .limit(1);

      if (sameNames && sameNames.length > 0) {
        return NextResponse.json({ error: "duplicate_guest", guestName }, { status: 409 });
      }
    }
  }

  const { data: checkin, error: insertError } = await supabase
    .from("event_checkins")
    .insert({
      event_id: event.id,
      user_id: userId,
      guest_name: userId ? null : guestName,
    })
    .select("id, checked_in_at")
    .single();

  if (insertError) {
    console.error("checkin insert:", insertError);
    return NextResponse.json({ error: "チェックインに失敗しました" }, { status: 500 });
  }

  // 申込済みユーザーは参加者ステータスも揃える
  if (
    participant &&
    participant.status !== "checked_in" &&
    participant.status !== "completed"
  ) {
    const { error: statusError } = await supabase
      .from("event_participants")
      .update({ status: "checked_in" })
      .eq("id", participant.id)
      .eq("event_id", event.id);

    if (statusError) {
      console.error("checkin participant status:", statusError);
      // 受付記録は成功しているので続行
    }
  }

  return NextResponse.json({
    success: true,
    checkinId: checkin.id,
    checkedInAt: checkin.checked_in_at,
  });
}
