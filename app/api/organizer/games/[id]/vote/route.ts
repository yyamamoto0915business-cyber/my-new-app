import { NextRequest, NextResponse } from "next/server";
import { getOwnedOrganizerGame } from "@/lib/organizer/games";
import { getPlayDb } from "@/lib/organizer/play";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import { isVotePhase } from "@/lib/organizer/vote";
import {
  addVoteCandidate,
  loadVoteAdminState,
  setVotePhase,
  syncPresetVoteCandidates,
  updateVoteIdea,
} from "@/lib/organizer/vote-play";

type Params = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 持ち主の投票ゲームか確かめて、サービスロールの DB を返す（案・票の表は参加者も主催者も直接は読めない） */
async function ownedVoteGame(id: string) {
  const auth = await requireOrganizerApi();
  if (!auth.ok) return { response: auth.response } as const;
  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game || game.type !== "vote") {
    return { response: NextResponse.json({ error: "投票が見つかりません" }, { status: 404 }) } as const;
  }
  const db = getPlayDb();
  if (!db) return { response: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) } as const;
  return { game, db } as const;
}

/** GET: 届いた案・候補・票の数 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownedVoteGame(id);
  if ("response" in owned) return owned.response;
  try {
    return NextResponse.json(await loadVoteAdminState(owned.db, owned.game.id));
  } catch (e) {
    console.error("organizer vote GET:", e);
    return NextResponse.json({ error: "読み込めませんでした" }, { status: 500 });
  }
}

/** PATCH: 案を隠す・戻す、候補にする・外す */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownedVoteGame(id);
  if ("response" in owned) return owned.response;
  const body = (await request.json().catch(() => null)) as
    | { ideaId?: unknown; hidden?: unknown; isCandidate?: unknown }
    | null;
  const ideaId = typeof body?.ideaId === "string" && UUID_RE.test(body.ideaId) ? body.ideaId : null;
  if (!ideaId) return NextResponse.json({ error: "案が見つかりません" }, { status: 400 });
  try {
    await updateVoteIdea(owned.db, owned.game.id, ideaId, {
      hidden: typeof body?.hidden === "boolean" ? body.hidden : undefined,
      isCandidate: typeof body?.isCandidate === "boolean" ? body.isCandidate : undefined,
    });
    return NextResponse.json(await loadVoteAdminState(owned.db, owned.game.id));
  } catch (e) {
    console.error("organizer vote PATCH:", e);
    return NextResponse.json({ error: "保存できませんでした" }, { status: 500 });
  }
}

/** POST: 候補を足す（action: candidate）・段階を切りかえる（action: phase）・決まった候補をそろえる（action: sync-preset） */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownedVoteGame(id);
  if ("response" in owned) return owned.response;
  const body = (await request.json().catch(() => null)) as
    | { action?: unknown; body?: unknown; phase?: unknown }
    | null;
  try {
    let result: { ok: true } | { ok: false; status: number; error: string };
    if (body?.action === "candidate") {
      result = await addVoteCandidate(owned.db, owned.game.id, body.body);
    } else if (body?.action === "phase" && isVotePhase(body.phase)) {
      result = await setVotePhase(owned.db, owned.game.id, body.phase);
    } else if (body?.action === "sync-preset") {
      result = await syncPresetVoteCandidates(owned.db, owned.game.id);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(await loadVoteAdminState(owned.db, owned.game.id));
  } catch (e) {
    console.error("organizer vote POST:", e);
    return NextResponse.json({ error: "保存できませんでした" }, { status: 500 });
  }
}
