import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, resolvePlayPlayer } from "@/lib/organizer/play";
import { loadSurveyPlayState, submitSurveyAnswers } from "@/lib/organizer/survey-play";

type Params = { params: Promise<{ token: string }> };

/** POST: アンケートの状態を読む（action: state）・答えを送る（action: answer）。端末の印で参加者を確かめる */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  const db = getPlayDb();
  if (!db) return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as
    | { deviceToken?: unknown; action?: unknown; answers?: unknown }
    | null;
  const deviceToken = typeof body?.deviceToken === "string" ? body.deviceToken : "";
  const resolved = await resolvePlayPlayer(db, token, deviceToken);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  try {
    if (body?.action === "answer") {
      const result = await submitSurveyAnswers(db, resolved.game.id, resolved.player.id, body.answers);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    } else if (body?.action !== undefined && body.action !== "state") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    const state = await loadSurveyPlayState(db, resolved.game.id, resolved.player.id);
    if (!state) return NextResponse.json({ error: "アンケートが見つかりません" }, { status: 404 });
    return NextResponse.json({ state });
  } catch (error) {
    console.error("play survey POST:", error);
    return NextResponse.json({ error: "保存できませんでした。もう一度お試しください" }, { status: 500 });
  }
}
