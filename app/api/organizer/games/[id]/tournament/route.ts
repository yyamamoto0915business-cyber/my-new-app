import { NextRequest, NextResponse } from "next/server";
import { getOwnedOrganizerGame } from "@/lib/organizer/games";
import { getPlayDb } from "@/lib/organizer/play";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import {
  clearTournamentResult,
  loadTournamentView,
  renameTournamentEntrant,
  resetTournament,
  setTournamentResult,
} from "@/lib/organizer/tournament-play";

type Params = { params: Promise<{ id: string }> };

const KEY_RE = /^(K\d{1,2}-\d{1,3}|L\d{1,3}-\d{1,3})$/;

async function ownedTournamentGame(id: string) {
  const auth = await requireOrganizerApi();
  if (!auth.ok) return { response: auth.response } as const;
  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game || game.type !== "tournament") {
    return { response: NextResponse.json({ error: "トーナメントが見つかりません" }, { status: 404 }) } as const;
  }
  const db = getPlayDb();
  if (!db) return { response: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) } as const;
  return { game, db } as const;
}

async function respond(db: NonNullable<ReturnType<typeof getPlayDb>>, gameId: string) {
  const view = await loadTournamentView(db, gameId);
  if (!view) return NextResponse.json({ error: "出場者が2人以上いません" }, { status: 404 });
  return NextResponse.json({ view });
}

/** GET: 今の対戦表 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownedTournamentGame(id);
  if ("response" in owned) return owned.response;
  try {
    return await respond(owned.db, owned.game.id);
  } catch (e) {
    console.error("organizer tournament GET:", e);
    return NextResponse.json({ error: "読み込めませんでした" }, { status: 500 });
  }
}

/** POST: 結果を入れる（result）・消す（clear）・名前を直す（rename）・はじめから（reset） */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownedTournamentGame(id);
  if ("response" in owned) return owned.response;
  const body = (await request.json().catch(() => null)) as
    | { action?: unknown; key?: unknown; winner?: unknown; draw?: unknown; scoreA?: unknown; scoreB?: unknown; index?: unknown; name?: unknown }
    | null;
  const key = typeof body?.key === "string" && KEY_RE.test(body.key) ? body.key : null;
  try {
    let result: { ok: true } | { ok: false; status: number; error: string };
    if (body?.action === "result" && key) {
      result = await setTournamentResult(owned.db, owned.game.id, key, body);
    } else if (body?.action === "clear" && key) {
      result = await clearTournamentResult(owned.db, owned.game.id, key);
    } else if (body?.action === "rename" && typeof body.index === "number") {
      result = await renameTournamentEntrant(owned.db, owned.game.id, body.index, body.name);
    } else if (body?.action === "reset") {
      result = await resetTournament(owned.db, owned.game.id);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return await respond(owned.db, owned.game.id);
  } catch (e) {
    console.error("organizer tournament POST:", e);
    return NextResponse.json({ error: "保存できませんでした" }, { status: 500 });
  }
}
