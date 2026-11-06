import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, resolvePlayPlayer } from "@/lib/organizer/play";
import { loadLotteryPlayState } from "@/lib/organizer/lottery-play";

type Params = { params: Promise<{ token: string }> };

/** POST: 抽選の今の状態（受付中なら自分の番号、結果発表なら当たり・はずれ）。端末の印で参加者を確かめる */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  const db = getPlayDb();
  if (!db) return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { deviceToken?: unknown } | null;
  const deviceToken = typeof body?.deviceToken === "string" ? body.deviceToken : "";
  const resolved = await resolvePlayPlayer(db, token, deviceToken);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  try {
    const state = await loadLotteryPlayState(db, resolved.game.id, resolved.player.id);
    if (!state) return NextResponse.json({ error: "抽選が見つかりません" }, { status: 404 });
    return NextResponse.json({ state });
  } catch (error) {
    console.error("play lottery POST:", error);
    return NextResponse.json({ error: "読み込めませんでした。もう一度お試しください" }, { status: 500 });
  }
}
