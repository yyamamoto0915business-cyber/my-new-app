import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerGameType, isOrganizerGameTypeId } from "@/lib/organizer/game-types";
import { getPlayDb, joinPlayGame } from "@/lib/organizer/play";

type Params = { params: Promise<{ token: string }> };

type PlayGameRow = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  starts_at: string | null;
  ends_at: string | null;
  spot_count: number;
};

/** GET: 参加用QRの公開情報 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const { data, error } = await supabase.rpc("get_play_game_by_join_token", {
    p_token: token,
  });
  if (error) {
    console.error("play game GET:", error);
    return NextResponse.json({ error: "ゲームの取得に失敗しました" }, { status: 500 });
  }

  const row = (Array.isArray(data) ? data[0] : data) as PlayGameRow | null;
  if (!row?.id) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const type = isOrganizerGameTypeId(row.type) ? row.type : "stamp";
  return NextResponse.json({
    name: row.name,
    description: row.description ?? "",
    type,
    typeLabel: getOrganizerGameType(type).label,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    spotCount: row.spot_count ?? 0,
  });
}

/** POST: ニックネーム＋合言葉で参加／再開 */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let body: { nickname?: unknown; passphrase?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nickname = typeof body.nickname === "string" ? body.nickname : "";
  const passphrase = typeof body.passphrase === "string" ? body.passphrase : "";

  try {
    const result = await joinPlayGame(db, token, nickname, passphrase);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.session);
  } catch (e) {
    console.error("play join POST:", e);
    return NextResponse.json({ error: "参加に失敗しました" }, { status: 500 });
  }
}
