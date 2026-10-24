import { NextRequest, NextResponse } from "next/server";
import { completePlayCheckin, getPlayDb } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";
import { readQuizArrivalProof } from "@/lib/organizer/quiz-arrival";

type Params = { params: Promise<{ token: string }> };

/** POST: 参加中のチェックインで、その場所を記録する */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let body: { deviceToken?: unknown; spotIndex?: unknown; keyword?: unknown; here?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";
  const spotIndex = typeof body.spotIndex === "number" ? body.spotIndex : -1;
  const keyword = typeof body.keyword === "string" ? body.keyword : "";

  try {
    const result = await completePlayCheckin(
      db,
      token,
      deviceToken,
      spotIndex,
      keyword,
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
      progress: result.progress,
    });
  } catch (error) {
    console.error("play checkin POST:", error);
    return NextResponse.json({ error: "記録を保存できませんでした" }, { status: 500 });
  }
}
