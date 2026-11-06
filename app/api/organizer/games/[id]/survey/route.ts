import { NextRequest, NextResponse } from "next/server";
import { getOwnedOrganizerGame } from "@/lib/organizer/games";
import { getPlayDb } from "@/lib/organizer/play";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import { isSurveyPhase } from "@/lib/organizer/survey";
import { loadSurveyAdminState, setSurveyPhase, setSurveyShareResults } from "@/lib/organizer/survey-play";

type Params = { params: Promise<{ id: string }> };

/** 持ち主のアンケートか確かめて、サービスロールの DB を返す */
async function ownedSurveyGame(id: string) {
  const auth = await requireOrganizerApi();
  if (!auth.ok) return { response: auth.response } as const;
  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game || game.type !== "survey") {
    return { response: NextResponse.json({ error: "アンケートが見つかりません" }, { status: 404 }) } as const;
  }
  const db = getPlayDb();
  if (!db) return { response: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) } as const;
  return { game, db } as const;
}

/** GET: 答えの集計と一覧 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownedSurveyGame(id);
  if ("response" in owned) return owned.response;
  try {
    return NextResponse.json(await loadSurveyAdminState(owned.db, owned.game.id));
  } catch (e) {
    console.error("organizer survey GET:", e);
    return NextResponse.json({ error: "読み込めませんでした" }, { status: 500 });
  }
}

/** POST: 締め切る・再開する（phase）、答えた人に結果を見せる・見せない（share） */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownedSurveyGame(id);
  if ("response" in owned) return owned.response;
  const body = (await request.json().catch(() => null)) as
    | { action?: unknown; phase?: unknown; shareResults?: unknown }
    | null;
  try {
    if (body?.action === "phase" && isSurveyPhase(body.phase)) {
      await setSurveyPhase(owned.db, owned.game.id, body.phase);
    } else if (body?.action === "share" && typeof body.shareResults === "boolean") {
      await setSurveyShareResults(owned.db, owned.game.id, body.shareResults);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json(await loadSurveyAdminState(owned.db, owned.game.id));
  } catch (e) {
    console.error("organizer survey POST:", e);
    return NextResponse.json({ error: "保存できませんでした" }, { status: 500 });
  }
}
