import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, lookupPlayGameByJoinToken } from "@/lib/organizer/play";
import { loadTournamentView } from "@/lib/organizer/tournament-play";

type Params = { params: Promise<{ token: string }> };

/** GET: 今の対戦表。見るだけなので、参加の手続きなしで公開中のゲームなら誰でも見られる */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  const db = getPlayDb();
  if (!db) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const game = await lookupPlayGameByJoinToken(db, token);
  if (!game) return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  try {
    const view = await loadTournamentView(db, game.id);
    if (!view) return NextResponse.json({ error: "トーナメントが見つかりません" }, { status: 404 });
    return NextResponse.json({ view }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("play tournament GET:", error);
    return NextResponse.json({ error: "読み込めませんでした" }, { status: 500 });
  }
}
