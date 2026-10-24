import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, openPlayMysteryCheckpoint } from "@/lib/organizer/play";
import { readQuizArrivalProof } from "@/lib/organizer/quiz-arrival";

type Params = { params: Promise<{ token: string }> };

/** POST: 謎解きで、その場所に着いたことを確かめて、その謎を開く */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let body: { deviceToken?: unknown; stepIndex?: unknown; here?: unknown; keyword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";
  const stepIndex = typeof body.stepIndex === "number" ? body.stepIndex : -1;

  try {
    const result = await openPlayMysteryCheckpoint(db, token, deviceToken, stepIndex, readQuizArrivalProof(body));
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    }
    return NextResponse.json({ step: result.step });
  } catch (error) {
    console.error("play mystery open POST:", error);
    return NextResponse.json({ error: "その場所に着いたか確かめられませんでした" }, { status: 500 });
  }
}
