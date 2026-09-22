import { NextRequest, NextResponse } from "next/server";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import {
  deleteOrganizerGameSpot,
  getOwnedOrganizerGame,
  updateOrganizerGameSpot,
} from "@/lib/organizer/games";
import { isOrganizerGameSpotKind } from "@/lib/organizer/game-tokens";

type Params = { params: Promise<{ id: string; spotId: string }> };

/** PATCH: スポット名／種別 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, spotId } = await params;
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: { name?: string; kind?: "stamp" | "goal" } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "スポット名は必須です" }, { status: 400 });
    }
    if (name.length > 40) {
      return NextResponse.json({ error: "スポット名は40文字以内にしてください" }, { status: 400 });
    }
    patch.name = name;
  }
  if (typeof body.kind === "string") {
    if (!isOrganizerGameSpotKind(body.kind)) {
      return NextResponse.json({ error: "種別が不正です" }, { status: 400 });
    }
    patch.kind = body.kind;
  }

  try {
    const spot = await updateOrganizerGameSpot(auth.supabase, game.id, spotId, patch);
    return NextResponse.json({ spot });
  } catch (e) {
    console.error("organizer game spot PATCH:", e);
    return NextResponse.json({ error: "スポットの更新に失敗しました" }, { status: 500 });
  }
}

/** DELETE: スポット削除 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, spotId } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  try {
    await deleteOrganizerGameSpot(auth.supabase, game.id, spotId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("organizer game spot DELETE:", e);
    return NextResponse.json({ error: "スポットの削除に失敗しました" }, { status: 500 });
  }
}
