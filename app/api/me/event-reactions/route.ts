import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getMyReactionEventIds } from "@/lib/db/event-reactions";
import { fetchPublishedEventsByIds } from "@/lib/db/events";

/** GET: 自分の参加予定・気になるイベント一覧（マイページ用） */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ planned: [], interested: [] });
  }

  const { planned: plannedIds, interested: interestedIds } =
    await getMyReactionEventIds(supabase, user.id);

  const [plannedEvents, interestedEvents] = await Promise.all([
    fetchPublishedEventsByIds(supabase, plannedIds),
    fetchPublishedEventsByIds(supabase, interestedIds),
  ]);

  return NextResponse.json({
    planned: plannedEvents,
    interested: interestedEvents,
  });
}
