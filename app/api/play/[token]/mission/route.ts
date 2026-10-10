import { NextRequest, NextResponse } from "next/server";
import { completePlayMission, getPlayDb } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";

type Params = { params: Promise<{ token: string }> };

/** POST: 参加中のミッションを達成する */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let body: { deviceToken?: unknown; missionIndex?: unknown; keyword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";
  const missionIndex = typeof body.missionIndex === "number" ? body.missionIndex : -1;
  const keyword = typeof body.keyword === "string" ? body.keyword : "";

  try {
    const result = await completePlayMission(
      db,
      token,
      deviceToken,
      missionIndex,
      keyword,
      await readPlayUserId(),
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      done: result.done,
      already: result.already,
      note: result.note,
      progress: result.progress,
    });
  } catch (error) {
    console.error("play mission POST:", error);
    return NextResponse.json({ error: "達成を保存できませんでした" }, { status: 500 });
  }
}
