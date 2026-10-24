import { NextRequest, NextResponse } from "next/server";
import { getOwnedOrganizerGame } from "@/lib/organizer/games";
import { listOrganizerMissionPhotos } from "@/lib/organizer/play";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";

type Params = { params: Promise<{ id: string }> };

/** GET: ミッションで参加者から届いた写真 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  try {
    return NextResponse.json(await listOrganizerMissionPhotos(auth.supabase, game.id));
  } catch (e) {
    console.error("organizer mission photos GET:", e);
    return NextResponse.json({ error: "写真を読み込めませんでした" }, { status: 500 });
  }
}
