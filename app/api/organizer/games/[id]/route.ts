import { NextRequest, NextResponse } from "next/server";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import { getOwnedOrganizerGame, listOrganizerGameSpots } from "@/lib/organizer/games";
import { countOrganizerGamePlayers } from "@/lib/organizer/play";

type Params = { params: Promise<{ id: string }> };

/** GET: ゲーム詳細とスポット */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  try {
    const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
    if (!game) {
      return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
    }
    let spots: Awaited<ReturnType<typeof listOrganizerGameSpots>> = [];
    try {
      spots = await listOrganizerGameSpots(auth.supabase, game.id);
    } catch (spotError) {
      console.error("organizer game spots GET:", spotError);
    }
    const playerCount = await countOrganizerGamePlayers(auth.supabase, game.id);
    return NextResponse.json({ game, spots, playerCount });
  } catch (e) {
    console.error("organizer game GET:", e);
    return NextResponse.json({ error: "ゲームの取得に失敗しました" }, { status: 500 });
  }
}
