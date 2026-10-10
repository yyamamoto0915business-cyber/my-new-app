import { NextRequest, NextResponse } from "next/server";
import { sanitizeGameExperience } from "@/lib/organizer/game-experience";
import { MAX_ORGANIZER_GAME_SPOTS } from "@/lib/organizer/game-tokens";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import {
  getOwnedOrganizerGame,
  listOrganizerGameSpots,
  parseOrganizerGameSpotDrafts,
  updateOrganizerGameDraft,
} from "@/lib/organizer/games";
import { countOrganizerGamePlayers } from "@/lib/organizer/play";

type Params = { params: Promise<{ id: string }> };

/** GET: ゲーム詳細とスポット */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  try {
    const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
    if (!game) {
      return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
    }
    let spots: Awaited<ReturnType<typeof listOrganizerGameSpots>> = [];
    try {
      spots = await listOrganizerGameSpots(auth.supabase, game.id);
    } catch (spotError) {
      console.error("organizer game spots GET:", spotError);
    }
    const playerCount = await countOrganizerGamePlayers(auth.supabase, game.id);
    const { data: settingsRow } = await auth.supabase
      .from("organizer_games")
      .select("settings")
      .eq("id", game.id)
      .eq("organizer_id", auth.organizerId)
      .maybeSingle();
    const settings =
      settingsRow?.settings && typeof settingsRow.settings === "object" && !Array.isArray(settingsRow.settings)
        ? (settingsRow.settings as { experience?: unknown })
        : null;
    const experience = sanitizeGameExperience(settings?.experience);
    return NextResponse.json({ game, spots, playerCount, experience });
  } catch (e) {
    console.error("organizer game GET:", e);
    return NextResponse.json({ error: "ゲームの取得に失敗しました" }, { status: 500 });
  }
}

/** PATCH: 下書きの保存と公開。参加が始まったあとは、スポットの追加と削除だけ止める。 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  let body: {
    name?: unknown;
    eventId?: unknown;
    description?: unknown;
    startsAt?: unknown;
    endsAt?: unknown;
    spots?: unknown;
    experience?: unknown;
    status?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status === "published" || body.status === "draft" ? body.status : undefined;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name && status) {
    const { error } = await auth.supabase
      .from("organizer_games")
      .update({ status })
      .eq("id", game.id)
      .eq("organizer_id", auth.organizerId);
    if (error) {
      console.error("organizer game status PATCH:", error);
      return NextResponse.json({ error: "公開状態を保存できませんでした" }, { status: 500 });
    }
    const updated = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, game.id);
    return NextResponse.json({ game: updated });
  }
  if (!name) return NextResponse.json({ error: "ゲーム名は必須です" }, { status: 400 });
  if (name.length > 80) {
    return NextResponse.json({ error: "ゲーム名は80文字以内にしてください" }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (description.length > 400) {
    return NextResponse.json({ error: "説明は400文字以内にしてください" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" && body.eventId ? body.eventId : null;
  if (eventId) {
    const { data: event, error } = await auth.supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("organizer_id", auth.organizerId)
      .maybeSingle();
    if (error || !event) {
      return NextResponse.json({ error: "対象イベントが見つかりません" }, { status: 400 });
    }
  }

  const startsAt = typeof body.startsAt === "string" && body.startsAt ? body.startsAt : null;
  const endsAt = typeof body.endsAt === "string" && body.endsAt ? body.endsAt : null;
  if (startsAt && Number.isNaN(Date.parse(startsAt))) {
    return NextResponse.json({ error: "開始日時が不正です" }, { status: 400 });
  }
  if (endsAt && Number.isNaN(Date.parse(endsAt))) {
    return NextResponse.json({ error: "終了日時が不正です" }, { status: 400 });
  }
  if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
    return NextResponse.json({ error: "終了日時は開始日時より後にしてください" }, { status: 400 });
  }

  const parsedSpots = parseOrganizerGameSpotDrafts(body.spots);
  if (!parsedSpots.ok) {
    return NextResponse.json({ error: parsedSpots.error }, { status: 400 });
  }

  const playerCount = await countOrganizerGamePlayers(auth.supabase, game.id);
  const currentIds = new Set((await listOrganizerGameSpots(auth.supabase, game.id)).map((spot) => spot.id));
  const nextIds = parsedSpots.spots.map((spot) => spot.id).filter((id): id is string => Boolean(id));
  const sameSpots =
    playerCount === 0 ||
    (parsedSpots.spots.length === currentIds.size &&
      parsedSpots.spots.every((spot) => spot.id && currentIds.has(spot.id)) &&
      nextIds.length === currentIds.size);
  if (playerCount > 0 && !sameSpots) {
    return NextResponse.json(
      { error: "参加が始まっています。スポットの追加と削除はできません。画面と特典は保存できます。" },
      { status: 409 },
    );
  }

  const experience = sanitizeGameExperience(body.experience);

  try {
    const updated = await updateOrganizerGameDraft(auth.supabase, auth.organizerId, game.id, {
      name,
      eventId,
      description,
      startsAt,
      endsAt,
      status,
      settings: experience ? { experience } : undefined,
      spots: parsedSpots.spots,
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "SPOT_LIMIT") {
      return NextResponse.json(
        { error: `スポットは${MAX_ORGANIZER_GAME_SPOTS}件までです` },
        { status: 400 }
      );
    }
    console.error("organizer game PATCH:", e);
    return NextResponse.json({ error: "下書きの保存に失敗しました" }, { status: 500 });
  }
}
