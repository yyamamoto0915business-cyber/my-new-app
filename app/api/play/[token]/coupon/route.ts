import { NextRequest, NextResponse } from "next/server";
import { completePlayCoupon, getPlayDb } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";

type Params = { params: Promise<{ token: string }> };

/** POST: 参加中のクーポンラリーで、その店に寄ったことを残す */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let body: { deviceToken?: unknown; storeIndex?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";
  const storeIndex = typeof body.storeIndex === "number" ? body.storeIndex : -1;

  try {
    const result = await completePlayCoupon(db, token, deviceToken, storeIndex, await readPlayUserId());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      done: result.done,
      already: result.already,
      progress: result.progress,
    });
  } catch (error) {
    console.error("play coupon POST:", error);
    return NextResponse.json({ error: "記録を保存できませんでした" }, { status: 500 });
  }
}
