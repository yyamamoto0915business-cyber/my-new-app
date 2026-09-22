import { NextRequest, NextResponse } from "next/server";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import {
  createOrganizerGameSpot,
  getOwnedOrganizerGame,
  listOrganizerGameSpots,
  reorderOrganizerGameSpots,
} from "@/lib/organizer/games";
import {
  isOrganizerGameSpotKind,
  MAX_ORGANIZER_GAME_SPOTS,
} from "@/lib/organizer/game-tokens";

type Params = { params: Promise<{ id: string }> };

/** GET: スポット一覧 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  try {
    const spots = await listOrganizerGameSpots(auth.supabase, game.id);
    return NextResponse.json({ spots });
  } catch (e) {
    console.error("organizer game spots GET:", e);
    return NextResponse.json({ error: "スポットの取得に失敗しました" }, { status: 500 });
  }
}

/** POST: スポット追加 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  let body: { name?: unknown; kind?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const spots = await listOrganizerGameSpots(auth.supabase, game.id);
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : `スポット ${spots.length + 1}`;
  if (name.length > 40) {
    return NextResponse.json({ error: "スポット名は40文字以内にしてください" }, { status: 400 });
  }
  const kindRaw = typeof body.kind === "string" ? body.kind : "stamp";
  if (!isOrganizerGameSpotKind(kindRaw)) {
    return NextResponse.json({ error: "種別が不正です" }, { status: 400 });
  }

  try {
    const spot = await createOrganizerGameSpot(auth.supabase, game.id, {
      name,
      kind: kindRaw,
    });
    return NextResponse.json({ spot }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "SPOT_LIMIT") {
      return NextResponse.json(
        { error: `スポットは${MAX_ORGANIZER_GAME_SPOTS}件までです` },
        { status: 400 }
      );
    }
    console.error("organizer game spots POST:", e);
    return NextResponse.json({ error: "スポットの追加に失敗しました" }, { status: 500 });
  }
}

/** PATCH: 並べ替え { order: string[] } */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  let body: { order?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const order = Array.isArray(body.order)
    ? body.order.filter((v): v is string => typeof v === "string")
    : [];
  if (order.length === 0) {
    return NextResponse.json({ error: "並び順が不正です" }, { status: 400 });
  }

  try {
    const spots = await reorderOrganizerGameSpots(auth.supabase, game.id, order);
    return NextResponse.json({ spots });
  } catch (e) {
    if (e instanceof Error && e.message === "SPOT_ORDER") {
      return NextResponse.json({ error: "並び順が不正です" }, { status: 400 });
    }
    console.error("organizer game spots PATCH:", e);
    return NextResponse.json({ error: "並び替えに失敗しました" }, { status: 500 });
  }
}
