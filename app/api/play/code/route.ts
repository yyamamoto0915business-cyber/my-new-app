import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, lookupGameByJoinCode } from "@/lib/organizer/play";

/** POST: 参加コードから、ゲームの参加ページを探す */
export async function POST(request: NextRequest) {
  const db = getPlayDb();
  if (!db) return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const found = await lookupGameByJoinCode(db, typeof body.code === "string" ? body.code : "");
  if (!found) {
    return NextResponse.json({ error: "参加コードが見つかりません。もう一度お確かめください。" }, { status: 404 });
  }
  return NextResponse.json(found);
}
