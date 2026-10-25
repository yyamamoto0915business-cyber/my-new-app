import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerGameType, isOrganizerGameTypeId } from "@/lib/organizer/game-types";
import { isEventMemberStatus, publicPlayParticipation, type GameParticipation } from "@/lib/organizer/game-experience";
import { organizerGameJoinPath } from "@/lib/organizer/game-tokens";
import { ensureGameJoinCode, getPlayDb } from "@/lib/organizer/play";

type Params = { params: Promise<{ id: string }> };

export type EventPassGame = {
  id: string;
  name: string;
  typeLabel: string;
  participation: GameParticipation;
  joinPath: string;
  /** どこからでも参加できるゲームだけ。参加コードで始める。 */
  joinCode: string | null;
};

/** GET: 申し込んだ人の参加パスに出す、このイベントのゲーム。 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id: eventId } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const db = getPlayDb();
  if (!db) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });

  const { data: member } = await db
    .from("event_participants")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!isEventMemberStatus(typeof member?.status === "string" ? member.status : null)) {
    return NextResponse.json({ games: [] });
  }

  const { data, error } = await db
    .from("organizer_games")
    .select("id, name, type, join_token, settings, ends_at")
    .eq("event_id", eventId)
    .eq("status", "published")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("event games GET:", error);
    return NextResponse.json({ error: "ゲームを読み込めませんでした" }, { status: 500 });
  }

  const now = Date.now();
  const games: EventPassGame[] = [];
  for (const row of (data ?? []) as {
    id: string;
    name: string | null;
    type: string;
    join_token: string | null;
    settings: unknown;
    ends_at: string | null;
  }[]) {
    if (!row.join_token) continue;
    if (row.ends_at && Date.parse(row.ends_at) < now) continue;
    const type = isOrganizerGameTypeId(row.type) ? row.type : "stamp";
    const participation = publicPlayParticipation(row.settings, type);
    let joinCode: string | null = null;
    if (participation === "remote") {
      const ensured = await ensureGameJoinCode(db, row.id);
      joinCode = ensured.ok ? ensured.code : null;
    }
    games.push({
      id: row.id,
      name: row.name ?? "ゲーム",
      typeLabel: getOrganizerGameType(type).label,
      participation,
      joinPath: organizerGameJoinPath(row.join_token),
      joinCode,
    });
  }
  return NextResponse.json({ games });
}
