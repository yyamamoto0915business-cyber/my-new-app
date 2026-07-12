import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByEventId } from "@/lib/db/events";
import { getTicketSalesAttendanceSummary } from "@/lib/organizer/day-ops";

type Params = { params: Promise<{ id: string }> };

/** GET: 当日運営向け チケット販売・来場状況サマリー */
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

  try {
    const summary = await getTicketSalesAttendanceSummary(supabase, id);
    if (!summary) {
      return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
    }
    return NextResponse.json(summary);
  } catch (e) {
    console.error("day-ops GET:", e);
    return NextResponse.json({ error: "集計の取得に失敗しました" }, { status: 500 });
  }
}
