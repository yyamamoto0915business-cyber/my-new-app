import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, pairPlayMission } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";

type Params = { params: Promise<{ token: string }> };

/** POST: ミッションの「友だちと参加」で、ふたりで決めた合言葉を入れる */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }
  let body: { deviceToken?: unknown; missionIndex?: unknown; word?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const result = await pairPlayMission(
      db,
      token,
      typeof body.deviceToken === "string" ? body.deviceToken : "",
      typeof body.missionIndex === "number" ? body.missionIndex : -1,
      typeof body.word === "string" ? body.word.slice(0, 40) : "",
      await readPlayUserId(),
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ done: result.done, waiting: result.waiting, progress: result.progress });
  } catch (error) {
    console.error("play mission pair POST:", error);
    return NextResponse.json({ error: "合言葉を確かめられませんでした" }, { status: 500 });
  }
}
