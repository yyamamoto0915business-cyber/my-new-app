import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByEventId } from "@/lib/db/events";
import { fetchEventStaffMembers } from "@/lib/organizer/staff-status";

type Params = { params: Promise<{ id: string }> };

/** GET: イベントに紐づくスタッフ応募・当日状況 */
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
    const members = await fetchEventStaffMembers(supabase, id);
    return NextResponse.json({
      members,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("staff-status GET:", e);
    return NextResponse.json({ error: "スタッフ状況の取得に失敗しました" }, { status: 500 });
  }
}
