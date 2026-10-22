import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, openPlayQuizCheckpoint } from "@/lib/organizer/play";
import { readQuizArrivalProof } from "@/lib/organizer/quiz-arrival";

type Params = { params: Promise<{ token: string }> };

/** POST: クイズのチェックポイントに着いたことを確かめて、その問題を開く */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let body: { deviceToken?: unknown; questionIndex?: unknown; here?: unknown; keyword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";
  const questionIndex = typeof body.questionIndex === "number" ? body.questionIndex : -1;

  try {
    const result = await openPlayQuizCheckpoint(db, token, deviceToken, questionIndex, readQuizArrivalProof(body));
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    }
    return NextResponse.json({ question: result.question });
  } catch (error) {
    console.error("play quiz open POST:", error);
    return NextResponse.json({ error: "チェックポイントを確かめられませんでした" }, { status: 500 });
  }
}
