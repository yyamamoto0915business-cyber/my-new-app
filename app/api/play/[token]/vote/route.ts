import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, resolvePlayPlayer } from "@/lib/organizer/play";
import {
  deleteVoteIdea,
  loadVotePlayState,
  reportVoteIdea,
  submitVoteIdea,
  toggleVoteBallot,
} from "@/lib/organizer/vote-play";

type Params = { params: Promise<{ token: string }> };

type Body = {
  deviceToken?: unknown;
  /** state: 今の状態だけ / idea: 案を送る / delete: 自分の案を消す / vote: 票を入れる・取り消す / report: 通報 */
  action?: unknown;
  body?: unknown;
  note?: unknown;
  ideaId?: unknown;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** POST: 投票ゲームの状態を読む・案を送る・票を入れる。端末の印（deviceToken）で参加者を確かめる */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  const db = getPlayDb();
  if (!db) return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";
  const resolved = await resolvePlayPlayer(db, token, deviceToken);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  const { game, player } = resolved;

  const action = typeof body.action === "string" ? body.action : "state";
  const ideaId = typeof body.ideaId === "string" && UUID_RE.test(body.ideaId) ? body.ideaId : null;

  try {
    let result: { ok: true } | { ok: false; status: number; error: string } = { ok: true };
    if (action === "idea") {
      result = await submitVoteIdea(db, game.id, player, { body: body.body, note: body.note });
    } else if (action === "delete" || action === "vote" || action === "report") {
      if (!ideaId) return NextResponse.json({ error: "案が見つかりません" }, { status: 400 });
      if (action === "delete") result = await deleteVoteIdea(db, game.id, player.id, ideaId);
      if (action === "vote") result = await toggleVoteBallot(db, game.id, player.id, ideaId);
      if (action === "report") result = await reportVoteIdea(db, game.id, player.id, ideaId);
    } else if (action !== "state") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const state = await loadVotePlayState(db, game.id, player.id);
    if (!state) return NextResponse.json({ error: "投票が見つかりません" }, { status: 404 });
    return NextResponse.json({ state });
  } catch (error) {
    console.error("play vote POST:", error);
    return NextResponse.json({ error: "保存できませんでした。もう一度お試しください" }, { status: 500 });
  }
}
