import { NextRequest, NextResponse } from "next/server";
import { getOwnedOrganizerGame } from "@/lib/organizer/games";
import { ensureGameJoinCode, getPlayDb } from "@/lib/organizer/play";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";

type Params = { params: Promise<{ id: string }> };

/** POST: このゲームの参加コードを返す（まだなければ作る） */
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;
  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  const db = getPlayDb() ?? auth.supabase;
  try {
    const result = await ensureGameJoinCode(db, game.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ code: result.code });
  } catch (e) {
    console.error("organizer join code POST:", e);
    return NextResponse.json({ error: "参加コードを作れませんでした" }, { status: 500 });
  }
}
