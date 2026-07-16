import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByEventId } from "@/lib/db/events";
import { buildReceptionNumber } from "@/lib/checkin/parse-pass-qr";
import {
  checkInVolunteerApplication,
  resolvePassQr,
} from "@/lib/checkin/resolve-pass-qr";

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

async function fetchDisplayName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  fallback: string
): Promise<string> {
  if (!supabase) return fallback;
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name?.trim() || fallback;
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
  const resolved = await resolvePassQr(supabase, raw, eventId);
  if (!resolved) {
    return NextResponse.json(
      { error: "このイベントの参加パスが見つかりません" },
      { status: 404 }
    );
  }

  // ── ボランティア分岐 ──
  if (resolved.kind === "volunteer") {
    const name = await fetchDisplayName(supabase, resolved.userId, "スタッフ");
    const receptionNumber = buildReceptionNumber(resolved.applicationId);
    const alreadyCheckedIn =
      resolved.status === "checked_in" ||
      resolved.status === "completed" ||
      Boolean(resolved.checkedInAt);

    if (alreadyCheckedIn) {
      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        kind: "volunteer",
        name,
        receptionNumber,
        roleLabel: resolved.roleAssigned,
        checkedInAt: resolved.checkedInAt,
      });
    }

    try {
      const { checkedInAt } = await checkInVolunteerApplication(
        supabase,
        resolved.applicationId
      );
      return NextResponse.json({
        success: true,
        alreadyCheckedIn: false,
        kind: "volunteer",
        name,
        receptionNumber,
        roleLabel: resolved.roleAssigned,
        checkedInAt,
      });
    } catch (err) {
      console.error("checkin scan volunteer:", err);
      return NextResponse.json(
        { error: "スタッフ受付に失敗しました" },
        { status: 500 }
      );
    }
  }

  // ── 来場者分岐（既存） ──
  const { data: rows, error: listError } = await supabase
    .from("event_participants")
    .select("id, user_id, status, profiles(display_name)")
    .eq("event_id", eventId)
    .eq("id", resolved.participantId)
    .maybeSingle();

  if (listError) {
    console.error("checkin scan list:", listError);
    return NextResponse.json({ error: "参加者の取得に失敗しました" }, { status: 500 });
  }

  const participant = rows as ParticipantRow | null;
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
      kind: "visitor",
      name,
      receptionNumber: buildReceptionNumber(participant.id),
      checkedInAt: existingCheckin?.checked_in_at ?? null,
    });
  }

  const { error: statusError } = await supabase
    .from("event_participants")
    .update({ status: "checked_in" })
    .eq("id", participant.id)
    .eq("event_id", eventId);

  if (statusError) {
    console.error("checkin scan status:", statusError);
    return NextResponse.json({ error: "受付ステータスの更新に失敗しました" }, { status: 500 });
  }

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
    return NextResponse.json({
      success: true,
      alreadyCheckedIn: false,
      kind: "visitor",
      name,
      receptionNumber: buildReceptionNumber(participant.id),
      checkedInAt: new Date().toISOString(),
      warning: "受付は完了しましたが、受付リストへの記録に失敗した可能性があります",
    });
  }

  return NextResponse.json({
    success: true,
    alreadyCheckedIn: false,
    kind: "visitor",
    name,
    receptionNumber: buildReceptionNumber(participant.id),
    checkedInAt: checkin.checked_in_at,
  });
}
