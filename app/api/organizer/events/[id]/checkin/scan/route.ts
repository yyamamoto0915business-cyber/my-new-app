import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByEventId } from "@/lib/db/events";
import {
  buildReceptionNumber,
  parsePassQr,
} from "@/lib/checkin/parse-pass-qr";

type Params = { params: Promise<{ id: string }> };

type ParticipantRow = {
  id: string;
  user_id: string;
  status: string;
  profiles: { display_name?: string | null } | { display_name?: string | null }[] | null;
};

function displayNameOf(row: ParticipantRow): string {
  const profiles = row.profiles;
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  return profile?.display_name?.trim() || "来場者";
}

/** POST: 参加パスQRを読み取り、主催者が受付（チェックイン）する */
export async function POST(req: NextRequest, { params }: Params) {
  const { id: eventId } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "DB未設定" }, { status: 503 });

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  const eventOrganizerId = await getOrganizerIdByEventId(supabase, eventId);
  if (!organizerId || eventOrganizerId !== organizerId) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  let body: { qr?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストが不正です" }, { status: 400 });
  }

  const raw = typeof body.qr === "string" ? body.qr : "";
  const parsed = parsePassQr(raw);
  if (!parsed) {
    return NextResponse.json(
      { error: "参加パスのQRコードとして認識できませんでした" },
      { status: 400 }
    );
  }

  const { data: rows, error: listError } = await supabase
    .from("event_participants")
    .select("id, user_id, status, profiles(display_name)")
    .eq("event_id", eventId);

  if (listError) {
    console.error("checkin scan list:", listError);
    return NextResponse.json({ error: "参加者の取得に失敗しました" }, { status: 500 });
  }

  const participants = (rows ?? []) as ParticipantRow[];
  let participant: ParticipantRow | undefined;

  if (parsed.type === "participant") {
    participant = participants.find((p) => p.id === parsed.participantId);
  } else {
    participant = participants.find(
      (p) => buildReceptionNumber(p.id) === parsed.receptionNumber
    );
  }

  if (!participant) {
    return NextResponse.json(
      { error: "このイベントの参加パスが見つかりません" },
      { status: 404 }
    );
  }

  if (participant.status === "declined") {
    return NextResponse.json({ error: "この参加は辞退済みです" }, { status: 403 });
  }

  const name = displayNameOf(participant);
  const alreadyCheckedIn =
    participant.status === "checked_in" || participant.status === "completed";

  // 既存チェックイン確認
  const { data: existingCheckin } = await supabase
    .from("event_checkins")
    .select("id, checked_in_at")
    .eq("event_id", eventId)
    .eq("user_id", participant.user_id)
    .maybeSingle();

  if (alreadyCheckedIn || existingCheckin) {
    return NextResponse.json({
      success: true,
      alreadyCheckedIn: true,
      name,
      receptionNumber: buildReceptionNumber(participant.id),
      checkedInAt: existingCheckin?.checked_in_at ?? null,
    });
  }

  // 参加者ステータス更新（主催者は RLS で update 可）
  const { error: statusError } = await supabase
    .from("event_participants")
    .update({ status: "checked_in" })
    .eq("id", participant.id)
    .eq("event_id", eventId);

  if (statusError) {
    console.error("checkin scan status:", statusError);
    return NextResponse.json({ error: "受付ステータスの更新に失敗しました" }, { status: 500 });
  }

  // event_checkins への insert は RLS が本人のみのため admin を使用
  const admin = createAdminClient();
  const writer = admin ?? supabase;
  const { data: checkin, error: insertError } = await writer
    .from("event_checkins")
    .insert({
      event_id: eventId,
      user_id: participant.user_id,
      guest_name: null,
    })
    .select("id, checked_in_at")
    .single();

  if (insertError) {
    console.error("checkin scan insert:", insertError);
    // ステータスは更新済みなので成功扱い（一覧はステータスでも拾える）
    return NextResponse.json({
      success: true,
      alreadyCheckedIn: false,
      name,
      receptionNumber: buildReceptionNumber(participant.id),
      checkedInAt: new Date().toISOString(),
      warning: "受付は完了しましたが、受付リストへの記録に失敗した可能性があります",
    });
  }

  return NextResponse.json({
    success: true,
    alreadyCheckedIn: false,
    name,
    receptionNumber: buildReceptionNumber(participant.id),
    checkedInAt: checkin.checked_in_at,
  });
}
