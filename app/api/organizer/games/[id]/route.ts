import { NextRequest, NextResponse } from "next/server";
import { publicPlayAudience, sanitizeGameExperience } from "@/lib/organizer/game-experience";
import { MAX_ORGANIZER_GAME_SPOTS } from "@/lib/organizer/game-tokens";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import {
  getOwnedOrganizerGame,
  listOrganizerGameSpots,
  parseOrganizerGameSpotDrafts,
  updateOrganizerGameDraft,
} from "@/lib/organizer/games";
import { countOrganizerGamePlayers, getPlayDb } from "@/lib/organizer/play";
import { requireOrganizerFeature } from "@/lib/organizer/require-organizer-feature";
import { settingsFromBody, type GameSettingsBody } from "@/lib/organizer/game-settings-body";
import { coverFromSettings } from "@/lib/organizer/public-games";
import { readGamePassSettings } from "@/lib/organizer/game-pass";
import { isOrganizerGameTypeId } from "@/lib/organizer/game-types";

type Params = { params: Promise<{ id: string }> };

/** ゲームに申し込んだ人（新しい順）。名前はプロフィールの表示名。 */
async function listGameEntries(gameId: string): Promise<{ name: string; appliedAt: string }[]> {
  const db = getPlayDb();
  if (!db) return [];
  const { data, error } = await db
    .from("organizer_game_entries")
    .select("user_id, created_at")
    .eq("game_id", gameId)
    .eq("status", "applied")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as { user_id: string; created_at: string }[];
  const { data: profiles } = await db
    .from("profiles")
    .select("id, display_name")
    .in("id", rows.map((row) => row.user_id));
  const names = new Map(
    ((profiles ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name?.trim() || ""])
  );
  return rows.map((row) => ({ name: names.get(row.user_id) || "参加者", appliedAt: row.created_at }));
}

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
        ? (settingsRow.settings as Record<string, unknown> & { experience?: unknown })
        : null;
    const experience = sanitizeGameExperience(settings?.experience);
    // スタンプラリー以外の作成画面は、settings をそのまま読み直して下書きを開く。
    // 編集画面の上に出す絵。設定した画像（カード・スタート画面など）→ 対象イベントの画像の順。
    let coverImage = coverFromSettings(settings, isOrganizerGameTypeId(game.type) ? game.type : "stamp");
    if (!coverImage && game.eventId) {
      const { data: eventRow } = await auth.supabase.from("events").select("image_url").eq("id", game.eventId).maybeSingle();
      const eventImage = (eventRow as { image_url?: unknown } | null)?.image_url;
      if (typeof eventImage === "string" && eventImage.trim()) coverImage = eventImage.trim();
    }
    // 申し込んだ人だけのゲームは、申し込んだ人の一覧も返す。
    const entries = publicPlayAudience(settings) === "entry" ? await listGameEntries(game.id) : null;
    return NextResponse.json({ game, spots, playerCount, experience, settings: settings ?? {}, coverImage, entries });
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
  // プラン外になっても、公開中のゲームを非公開に戻すことはできるようにする
  if (name || status !== "draft") {
    const planBlocked = await requireOrganizerFeature(auth.supabase, auth.organizerId, "games");
    if (planBlocked) return planBlocked;
  }
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
  // スタンプラリーの参加パス（定員・締め切り・注意書き）と、パス・カードの画像。送られてきたときだけ上書きする。
  const extra: Record<string, unknown> = {};
  if ("pass" in body) {
    extra.pass = experience?.basics.audience === "entry" ? readGamePassSettings((body as { pass?: unknown }).pass) : null;
  }
  if ("cardImage" in body) {
    const raw = typeof (body as { cardImage?: unknown }).cardImage === "string" ? ((body as { cardImage: string }).cardImage).trim() : "";
    extra.cardImage =
      (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("..")) || /^https:\/\//.test(raw) ? raw.slice(0, 500) : null;
  }

  try {
    const updated = await updateOrganizerGameDraft(auth.supabase, auth.organizerId, game.id, {
      name,
      eventId,
      description,
      startsAt,
      endsAt,
      status,
      settings: experience || Object.keys(extra).length > 0 ? { ...(experience ? { experience } : {}), ...extra } : undefined,
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

/** 作成画面で直したときに保存した設定から外す項目。空にしたものも消えるように、いったん null にする。 */
const EDITABLE_SETTING_KEYS = ["quiz", "mission", "photo", "coupon", "checkin", "mystery", "look", "audience", "participation", "playLimit", "pass", "cardImage"] as const;

/**
 * PUT: スタンプラリー以外のゲームを、作成画面から上書き保存する。
 * 下書きを開き直して直すときと、2回目からの「下書き保存」で使う。スポットには触らない。
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  const game = await getOwnedOrganizerGame(auth.supabase, auth.organizerId, id);
  if (!game) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  if (game.type === "stamp") {
    return NextResponse.json({ error: "スタンプラリーは、スタンプラリーの作成画面から保存してください" }, { status: 400 });
  }

  const planBlocked = await requireOrganizerFeature(auth.supabase, auth.organizerId, "games");
  if (planBlocked) return planBlocked;

  let body: GameSettingsBody & {
    name?: unknown;
    eventId?: unknown;
    description?: unknown;
    startsAt?: unknown;
    endsAt?: unknown;
    status?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
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

  const status = body.status === "published" || body.status === "draft" ? body.status : undefined;
  const cleared: Record<string, unknown> = Object.fromEntries(EDITABLE_SETTING_KEYS.map((key) => [key, null]));
  const settings = { ...cleared, ...(settingsFromBody(body) ?? {}) };

  try {
    const updated = await updateOrganizerGameDraft(auth.supabase, auth.organizerId, game.id, {
      name,
      eventId,
      description,
      startsAt,
      endsAt,
      status,
      settings,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("organizer game PUT:", e);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
