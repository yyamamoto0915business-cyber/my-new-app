import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerGameType, isOrganizerGameTypeId } from "@/lib/organizer/game-types";
import {
  ORGANIZER_GAME_SPOT_KIND_LABEL,
  isOrganizerGameSpotKind,
  organizerGameJoinPath,
} from "@/lib/organizer/game-tokens";
import { getPlayDb, stampPlaySpot } from "@/lib/organizer/play";

type Params = { params: Promise<{ token: string }> };

type PlaySpotRow = {
  spot_id: string;
  spot_name: string;
  spot_kind: string;
  game_id: string;
  game_name: string;
  game_type: string;
  join_token?: string | null;
};

/** GET: スポットQRの公開情報 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "スポットが見つかりません" }, { status: 404 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const { data, error } = await supabase.rpc("get_play_spot_by_token", {
    p_token: token,
  });
  if (error) {
    console.error("play spot GET:", error);
    return NextResponse.json({ error: "スポットの取得に失敗しました" }, { status: 500 });
  }

  const row = (Array.isArray(data) ? data[0] : data) as PlaySpotRow | null;
  if (!row?.spot_id) {
    return NextResponse.json({ error: "スポットが見つかりません" }, { status: 404 });
  }

  const kind = isOrganizerGameSpotKind(row.spot_kind) ? row.spot_kind : "stamp";
  const type = isOrganizerGameTypeId(row.game_type) ? row.game_type : "stamp";
  const joinToken = row.join_token?.trim() || "";
  return NextResponse.json({
    spotName: row.spot_name,
    kind,
    kindLabel: ORGANIZER_GAME_SPOT_KIND_LABEL[kind],
    gameName: row.game_name,
    typeLabel: getOrganizerGameType(type).label,
    joinToken,
    joinPath: joinToken ? organizerGameJoinPath(joinToken) : "",
  });
}

/** POST: スポットにスタンプする */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "スポットが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "スタンプを押せません" }, { status: 503 });
  }

  let body: { deviceToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";

  try {
    const result = await stampPlaySpot(db, token, deviceToken);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, joinPath: result.joinPath ?? null },
        { status: result.status }
      );
    }
    return NextResponse.json(result.result);
  } catch (e) {
    console.error("play stamp POST:", e);
    return NextResponse.json({ error: "スタンプに失敗しました" }, { status: 500 });
  }
}
