import { NextRequest, NextResponse } from "next/server";
import { getOwnedOrganizerGame } from "@/lib/organizer/games";
import { listOrganizerCouponPlayers, markOrganizerCouponUsed } from "@/lib/organizer/play";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";

type Params = { params: Promise<{ id: string }> };

const PLAYER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET: クリアした人のクーポン使用状況 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  try {
    const desk = await listOrganizerCouponPlayers(auth.supabase, game.id);
    return NextResponse.json(desk);
  } catch (e) {
    console.error("organizer coupon uses GET:", e);
    return NextResponse.json({ error: "使用状況を読み込めませんでした" }, { status: 500 });
  }
}

/** POST: クリアした人のクーポンを使用済みにする */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  let body: { playerId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const playerId = typeof body.playerId === "string" ? body.playerId : "";
  if (!PLAYER_ID_RE.test(playerId)) {
    return NextResponse.json({ error: "参加者が見つかりません" }, { status: 400 });
  }

  try {
    const result = await markOrganizerCouponUsed(auth.supabase, game.id, playerId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ player: result.player });
  } catch (e) {
    console.error("organizer coupon uses POST:", e);
    return NextResponse.json({ error: "使用済みにできませんでした" }, { status: 500 });
  }
}
