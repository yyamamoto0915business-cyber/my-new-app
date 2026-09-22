import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, resumePlayGame } from "@/lib/organizer/play";

type Params = { params: Promise<{ token: string }> };

/** POST: 同じ端末の参加を再開する */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let body: { deviceToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";

  try {
    const session = await resumePlayGame(db, token, deviceToken);
    if (!session) {
      return NextResponse.json({ error: "再開できませんでした" }, { status: 401 });
    }
    return NextResponse.json(session);
  } catch (e) {
    console.error("play resume POST:", e);
    return NextResponse.json({ error: "再開に失敗しました" }, { status: 500 });
  }
}
