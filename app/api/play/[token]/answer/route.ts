import { NextRequest, NextResponse } from "next/server";
import { answerPlayQuiz, getPlayDb } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";
import { readQuizArrivalProof } from "@/lib/organizer/quiz-arrival";

type Params = { params: Promise<{ token: string }> };

/** POST: 参加中のクイズに答える */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let body: { deviceToken?: unknown; questionIndex?: unknown; choiceIndex?: unknown; here?: unknown; keyword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";
  const questionIndex = typeof body.questionIndex === "number" ? body.questionIndex : -1;
  const choiceIndex = typeof body.choiceIndex === "number" ? body.choiceIndex : -1;

  try {
    const result = await answerPlayQuiz(
      db,
      token,
      deviceToken,
      questionIndex,
      choiceIndex,
      await readPlayUserId(),
      readQuizArrivalProof(body),
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      correct: result.correct,
      already: result.already,
      hint: result.hint,
      progress: result.progress,
    });
  } catch (error) {
    console.error("play quiz answer POST:", error);
    return NextResponse.json({ error: "回答を保存できませんでした" }, { status: 500 });
  }
}
