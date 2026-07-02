import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByEventId } from "@/lib/db/events";

type Params = { params: Promise<{ id: string }> };

function generateCheckinToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

function generateCheckinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** GET: チェックインQRトークン取得（なければ生成）+ チェックイン一覧 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "DB未設定" }, { status: 503 });

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  const eventOrganizerId = await getOrganizerIdByEventId(supabase, id);
  if (!organizerId || eventOrganizerId !== organizerId) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, checkin_token, checkin_code, checkin_enabled")
    .eq("id", id)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  let token = event.checkin_token;
  let code = event.checkin_code;
  const needsIssue = !token || !code;

  if (needsIssue) {
    if (!token) token = generateCheckinToken();
    if (!code) code = generateCheckinCode();
    await supabase
      .from("events")
      .update({
        checkin_token: token,
        checkin_code: code,
        checkin_enabled: true,
      })
      .eq("id", id);
  } else if (!event.checkin_enabled) {
    await supabase.from("events").update({ checkin_enabled: true }).eq("id", id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.machiglyph.jp";

  const { data: checkins } = await supabase
    .from("event_checkins")
    .select("id, user_id, guest_name, checked_in_at, profiles(display_name)")
    .eq("event_id", id)
    .order("checked_in_at", { ascending: false })
    .limit(100);

  const checkinCount = checkins?.length ?? 0;

  const list = (checkins ?? []).map((c) => ({
    id: c.id,
    name: (c.profiles as { display_name?: string | null } | null)?.display_name ?? c.guest_name ?? "ゲスト",
    checkedInAt: c.checked_in_at,
    type: c.user_id ? "login" : "guest",
  }));

  return NextResponse.json({
    token,
    code,
    checkinEnabled: true,
    checkinUrl: `${siteUrl}/checkin/t/${token}`,
    checkinCount,
    list,
  });
}
