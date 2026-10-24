import { NextRequest, NextResponse } from "next/server";
import { completePlayMystery, getPlayDb } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";
import { readQuizArrivalProof } from "@/lib/organizer/quiz-arrival";

type Params = { params: Promise<{ token: string }> };

/** POST: 参加中の謎解きで、いまの謎に答える */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let body: { deviceToken?: unknown; stepIndex?: unknown; answer?: unknown; here?: unknown; keyword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";
  const stepIndex = typeof body.stepIndex === "number" ? body.stepIndex : -1;
  const answer = typeof body.answer === "string" ? body.answer : "";

  try {
    const result = await completePlayMystery(
      db,
      token,
      deviceToken,
      stepIndex,
      answer,
      await readPlayUserId(),
      readQuizArrivalProof(body),
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      done: result.done,
      already: result.already,
      note: result.note,
      hint: result.hint,
      progress: result.progress,
    });
  } catch (error) {
    console.error("play mystery POST:", error);
    return NextResponse.json({ error: "答えを保存できませんでした" }, { status: 500 });
  }
}
