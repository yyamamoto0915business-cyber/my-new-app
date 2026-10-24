import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, joinPlayGameByEventEntry } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";

type Params = { params: Promise<{ token: string }> };

/** POST: 対象イベントに申し込んだアカウントで、ニックネーム・合言葉なしで参加する */
export async function POST(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }
  try {
    const result = await joinPlayGameByEventEntry(db, token, await readPlayUserId());
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code ?? null }, { status: result.status });
    }
    return NextResponse.json(result.session);
  } catch (e) {
    console.error("play entry POST:", e);
    return NextResponse.json({ error: "参加に失敗しました" }, { status: 500 });
  }
}
