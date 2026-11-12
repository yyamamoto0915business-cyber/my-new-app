import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readPlayUserId } from "@/lib/organizer/play-user";
import { fetchMyEventPoints, usableUntilLabel } from "@/lib/points/event-points";

type Params = { params: Promise<{ token: string }> };

/**
 * GET: このゲームの対象イベントで、自分が持っているポイント（ゲームの画面の上に出す）。
 * ポイントはイベントのゲームでたまり、そのイベントの開催中だけ使える。
 * イベントにつながっていないゲーム・ログインしていない人には { linked: false } を返す。
 */
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const none = NextResponse.json({ linked: false }, { headers: { "Cache-Control": "private, no-store" } });
  if (!token || token.length < 8) return none;

  const supabase = await createClient();
  const admin = createAdminClient();
  const userId = await readPlayUserId();
  if (!supabase || !admin || !userId) return none;

  const { data } = await supabase.rpc("get_play_game_by_join_token", { p_token: token });
  const row = (Array.isArray(data) ? data[0] : data) as { id?: string } | null;
  if (!row?.id) return none;
  const { data: game } = await admin.from("organizer_games").select("event_id").eq("id", row.id).maybeSingle();
  const eventId = (game as { event_id?: string | null } | null)?.event_id;
  if (!eventId) return none;

  const mine = await fetchMyEventPoints(supabase, userId);
  const item = [...mine.usable, ...mine.ended].find((i) => i.eventId === eventId);
  if (!item) {
    // まだこのイベントでためていない
    const { data: ev } = await admin.from("events").select("title").eq("id", eventId).maybeSingle();
    return NextResponse.json(
      { linked: true, eventTitle: (ev as { title?: string } | null)?.title ?? "イベント", balance: 0, status: null, until: null },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }
  return NextResponse.json(
    {
      linked: true,
      eventTitle: item.title,
      balance: item.status === "ended" ? 0 : item.balance,
      status: item.status,
      until: item.status === "ended" ? null : usableUntilLabel(item),
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
