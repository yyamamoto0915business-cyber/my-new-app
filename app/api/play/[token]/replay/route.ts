import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, replayPlayGame } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";

type Params = { params: Promise<{ token: string }> };

/** POST: 何度でも参加できるラリーを、クリア後にもう一周する */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "もう一周できません" }, { status: 503 });
  }

  let body: { deviceToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";

  try {
    const result = await replayPlayGame(db, token, deviceToken, await readPlayUserId());
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code ?? null },
        { status: result.status },
      );
    }
    return NextResponse.json(result.session);
  } catch (e) {
    console.error("play replay POST:", e);
    return NextResponse.json({ error: "もう一周できませんでした" }, { status: 500 });
  }
}
