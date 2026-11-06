import { NextRequest, NextResponse } from "next/server";
import { getOwnedOrganizerGame } from "@/lib/organizer/games";
import { getPlayDb } from "@/lib/organizer/play";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import { isLotteryPhase } from "@/lib/organizer/lottery";
import {
  drawLotteryPrize,
  loadLotteryAdminState,
  resetLottery,
  setLotteryPhase,
  voidLotteryWin,
} from "@/lib/organizer/lottery-play";

type Params = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 持ち主の抽選ゲームか確かめて、サービスロールの DB を返す */
async function ownedLotteryGame(id: string) {
  const auth = await requireOrganizerApi();
  if (!auth.ok) return { response: auth.response } as const;
  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game || game.type !== "lottery") {
    return { response: NextResponse.json({ error: "抽選が見つかりません" }, { status: 404 }) } as const;
  }
  const db = getPlayDb();
  if (!db) return { response: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) } as const;
  return { game, db } as const;
}

/** GET: 参加した人・賞ごとの当選者 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownedLotteryGame(id);
  if ("response" in owned) return owned.response;
  try {
    return NextResponse.json(await loadLotteryAdminState(owned.db, owned.game.id));
  } catch (e) {
    console.error("organizer lottery GET:", e);
    return NextResponse.json({ error: "読み込めませんでした" }, { status: 500 });
  }
}

/** POST: 抽選する（draw）・当選を取り消す（void）・段階を切りかえる（phase）・やり直す（reset） */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownedLotteryGame(id);
  if ("response" in owned) return owned.response;
  const body = (await request.json().catch(() => null)) as
    | { action?: unknown; prizeIndex?: unknown; winId?: unknown; phase?: unknown }
    | null;
  try {
    let result: { ok: true } | { ok: false; status: number; error: string };
    if (body?.action === "draw" && typeof body.prizeIndex === "number" && Number.isInteger(body.prizeIndex)) {
      result = await drawLotteryPrize(owned.db, owned.game.id, body.prizeIndex);
    } else if (body?.action === "void" && typeof body.winId === "string" && UUID_RE.test(body.winId)) {
      result = await voidLotteryWin(owned.db, owned.game.id, body.winId);
    } else if (body?.action === "phase" && isLotteryPhase(body.phase)) {
      result = await setLotteryPhase(owned.db, owned.game.id, body.phase);
    } else if (body?.action === "reset") {
      result = await resetLottery(owned.db, owned.game.id);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(await loadLotteryAdminState(owned.db, owned.game.id));
  } catch (e) {
    console.error("organizer lottery POST:", e);
    return NextResponse.json({ error: "保存できませんでした" }, { status: 500 });
  }
}
