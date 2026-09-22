import { NextResponse } from "next/server";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import { getOwnedOrganizerGame } from "@/lib/organizer/games";
import { resetOrganizerGamePlay } from "@/lib/organizer/play";

type Params = { params: Promise<{ id: string }> };

/** POST: 合言葉と端末の再開を無効にする。スタンプは残る */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  try {
    const playEpoch = await resetOrganizerGamePlay(auth.supabase, game.id, auth.organizerId);
    return NextResponse.json({ playEpoch });
  } catch (e) {
    console.error("organizer game play-reset:", e);
    return NextResponse.json({ error: "リセットに失敗しました" }, { status: 500 });
  }
}
