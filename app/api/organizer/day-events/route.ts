import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { fetchDayManageableEvents } from "@/lib/organizer/day-manageable-events";

/** GET: 当日運営用の軽量イベント一覧（切替 UI 専用） */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase が未設定です" }, { status: 500 });
  }

  try {
    const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
    if (!organizerId) {
      return NextResponse.json({ events: [] });
    }

    const events = await fetchDayManageableEvents(supabase, organizerId);
    return NextResponse.json({ events });
  } catch (e) {
    console.error("organizer day-events GET:", e);
    return NextResponse.json({ error: "イベント一覧の取得に失敗しました" }, { status: 500 });
  }
}
