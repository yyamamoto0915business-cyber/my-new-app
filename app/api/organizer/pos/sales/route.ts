import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getPosSalesSummary } from "@/lib/db/pos";

/** GET: 本日の売上サマリー＋履歴 */
export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");

  try {
    const { summary, sales } = await getPosSalesSummary(supabase, organizerId, {
      eventId: eventId || null,
    });
    return NextResponse.json({ summary, sales });
  } catch (e) {
    console.error("pos sales GET:", e);
    return NextResponse.json({ error: "売上の取得に失敗しました" }, { status: 500 });
  }
}
