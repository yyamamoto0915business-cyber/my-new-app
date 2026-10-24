import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_ORGANIZER_GAME_TYPE_ID,
  getOrganizerGameType,
  isOrganizerGameTypeId,
  type OrganizerGameStatus,
  type OrganizerGameTypeId,
} from "@/lib/organizer/game-types";
import {
  generateOrganizerGameToken,
  isOrganizerGameSpotKind,
  MAX_ORGANIZER_GAME_SPOTS,
  organizerGameJoinPath,
  organizerGameSpotPath,
  type OrganizerGameSpotKind,
} from "@/lib/organizer/game-tokens";

export type OrganizerGame = {
  id: string;
  organizerId: string;
  eventId: string | null;
  eventTitle: string | null;
  type: OrganizerGameTypeId;
  typeLabel: string;
  name: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  status: OrganizerGameStatus;
  joinToken: string;
  joinPath: string;
  spotCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrganizerGameSpot = {
  id: string;
  gameId: string;
  name: string;
  kind: OrganizerGameSpotKind;
  sortOrder: number;
  token: string;
  path: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizerGameEventOption = {
  id: string;
  title: string;
  date: string | null;
  status: string | null;
  /** イベントの画像（参加パスにも出る）。ゲームのカードに使う。 */
  imageUrl?: string | null;
  /** カードに出す場所（都道府県・市区町村）。 */
  area?: string | null;
};

type GameRow = {
  id: string;
  organizer_id: string;
  event_id: string | null;
  type: string;
  name: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  join_token?: string | null;
  created_at: string;
  updated_at: string;
  events?: { title?: string | null } | { title?: string | null }[] | null;
  organizer_game_spots?: { count?: number }[] | { count?: number } | null;
};

type SpotRow = {
  id: string;
  game_id: string;
  name: string;
  kind: string;
  sort_order: number;
  token: string;
  created_at: string;
  updated_at: string;
};

function mapStatus(value: string): OrganizerGameStatus {
  if (value === "published" || value === "archived") return value;
  return "draft";
}

function spotCountFromRow(row: GameRow): number {
  const raw = row.organizer_game_spots;
  const item = Array.isArray(raw) ? raw[0] : raw;
  const count = item?.count;
  return typeof count === "number" ? count : 0;
}

function mapGame(row: GameRow): OrganizerGame {
  const type = isOrganizerGameTypeId(row.type) ? row.type : DEFAULT_ORGANIZER_GAME_TYPE_ID;
  const event = Array.isArray(row.events) ? row.events[0] : row.events;
  const joinToken = row.join_token?.trim() || "";
  return {
    id: row.id,
    organizerId: row.organizer_id,
    eventId: row.event_id,
    eventTitle: event?.title ?? null,
    type,
    typeLabel: getOrganizerGameType(type).label,
    name: row.name,
    description: row.description ?? "",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: mapStatus(row.status),
    joinToken,
    joinPath: joinToken ? organizerGameJoinPath(joinToken) : "",
    spotCount: spotCountFromRow(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSpot(row: SpotRow): OrganizerGameSpot {
  const kind = isOrganizerGameSpotKind(row.kind) ? row.kind : "stamp";
  return {
    id: row.id,
    gameId: row.game_id,
    name: row.name,
    kind,
    sortOrder: row.sort_order,
    token: row.token,
    path: organizerGameSpotPath(row.token),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const GAME_SELECT_PLAIN = "*";

export async function listOrganizerGames(
  supabase: SupabaseClient,
  organizerId: string
): Promise<OrganizerGame[]> {
  const { data, error } = await supabase
    .from("organizer_games")
    .select(GAME_SELECT_PLAIN)
    .eq("organizer_id", organizerId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) {
    if (/does not exist|schema cache|aborted/i.test(error.message)) return [];
    console.warn("listOrganizerGames:", error.message);
    return [];
  }

  const games = ((data ?? []) as GameRow[]).map(mapGame);
  // 一覧は本体だけ返す。イベント名・スポット数の埋め込みは PostgREST が止まりやすい
  return games;
}

export async function listOrganizerGameEventOptions(
  supabase: SupabaseClient,
  organizerId: string
): Promise<OrganizerGameEventOption[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, date, status, image_url, prefecture, city")
    .eq("organizer_id", organizerId)
    .neq("status", "archived")
    .order("date", { ascending: false })
    .limit(80);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: (row.title as string) ?? "無題のイベント",
    date: (row.date as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    imageUrl: (row.image_url as string | null) ?? null,
    area: ((row.prefecture as string | null) || (row.city as string | null)) ?? null,
  }));
}

export async function getOwnedOrganizerGame(
  supabase: SupabaseClient,
  organizerId: string,
  gameId: string
): Promise<OrganizerGame | null> {
  const { data, error } = await supabase
    .from("organizer_games")
    .select(GAME_SELECT_PLAIN)
    .eq("id", gameId)
    .eq("organizer_id", organizerId)
    .maybeSingle();

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return null;
    throw error;
  }
  if (!data) return null;

  const game = await ensureJoinToken(supabase, mapGame(data as GameRow));
  return game;
}

async function ensureJoinToken(
  supabase: SupabaseClient,
  game: OrganizerGame
): Promise<OrganizerGame> {
  if (game.joinToken) return game;
  const joinToken = generateOrganizerGameToken();
  const { error } = await supabase
    .from("organizer_games")
    .update({ join_token: joinToken })
    .eq("id", game.id)
    .eq("organizer_id", game.organizerId);
  if (error) throw error;
  return {
    ...game,
    joinToken,
    joinPath: organizerGameJoinPath(joinToken),
  };
}

export type OrganizerGameSpotDraft = {
  id?: string;
  name: string;
  kind: OrganizerGameSpotKind;
};

export type CreateOrganizerGameInput = {
  name: string;
  type: OrganizerGameTypeId;
  eventId?: string | null;
  description?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  status?: OrganizerGameStatus;
  settings?: Record<string, unknown>;
  spots?: OrganizerGameSpotDraft[];
};

const SPOT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseOrganizerGameSpotDrafts(
  raw: unknown
): { ok: true; spots: OrganizerGameSpotDraft[] } | { ok: false; error: string } {
  if (raw == null) return { ok: true, spots: [] };
  if (!Array.isArray(raw)) return { ok: false, error: "スポットの形式が不正です" };
  if (raw.length > MAX_ORGANIZER_GAME_SPOTS) {
    return { ok: false, error: `スポットは${MAX_ORGANIZER_GAME_SPOTS}件までです` };
  }
  const spots: OrganizerGameSpotDraft[] = [];
  for (const [index, item] of raw.entries()) {
    const row = item && typeof item === "object" ? (item as { id?: unknown; name?: unknown; kind?: unknown }) : {};
    const name =
      typeof row.name === "string" && row.name.trim() ? row.name.trim() : `スポット ${index + 1}`;
    if (name.length > 40) return { ok: false, error: "スポット名は40文字以内にしてください" };
    const kindRaw = typeof row.kind === "string" ? row.kind : "stamp";
    if (!isOrganizerGameSpotKind(kindRaw)) return { ok: false, error: "スポットの種別が不正です" };
    const id = typeof row.id === "string" && SPOT_ID_RE.test(row.id) ? row.id : undefined;
    spots.push({ id, name, kind: kindRaw });
  }
  return { ok: true, spots };
}

export async function createOrganizerGame(
  supabase: SupabaseClient,
  organizerId: string,
  input: CreateOrganizerGameInput
): Promise<OrganizerGame> {
  const joinToken = generateOrganizerGameToken();
  const payload: Record<string, unknown> = {
    organizer_id: organizerId,
    event_id: input.eventId || null,
    type: input.type,
    name: input.name,
    description: input.description?.trim() || null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    status: input.status === "published" ? "published" : "draft",
    join_token: joinToken,
  };
  if (input.settings) payload.settings = input.settings;

  let { data, error } = await supabase.from("organizer_games").insert(payload).select(GAME_SELECT_PLAIN).single();
  if (error && input.settings && /settings/i.test(error.message)) {
    delete payload.settings;
    const retry = await supabase.from("organizer_games").insert(payload).select(GAME_SELECT_PLAIN).single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  const game = mapGame(data as GameRow);
  if (input.spots && input.spots.length > 0) {
    try {
      await createOrganizerGameSpots(supabase, game.id, input.spots);
      game.spotCount = input.spots.length;
    } catch (spotError) {
      await supabase.from("organizer_games").delete().eq("id", game.id);
      throw spotError;
    }
  }
  return game;
}

export async function createOrganizerGameSpots(
  supabase: SupabaseClient,
  gameId: string,
  spots: { name: string; kind: OrganizerGameSpotKind }[]
): Promise<OrganizerGameSpot[]> {
  if (spots.length === 0) return [];
  if (spots.length > MAX_ORGANIZER_GAME_SPOTS) {
    throw new Error("SPOT_LIMIT");
  }
  const { data, error } = await supabase
    .from("organizer_game_spots")
    .insert(
      spots.map((spot, index) => ({
        game_id: gameId,
        name: spot.name,
        kind: spot.kind,
        sort_order: index,
        token: generateOrganizerGameToken(),
      }))
    )
    .select("*");
  if (error) throw error;
  return ((data ?? []) as SpotRow[])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(mapSpot);
}

export async function listOrganizerGameSpots(
  supabase: SupabaseClient,
  gameId: string
): Promise<OrganizerGameSpot[]> {
  const { data, error } = await supabase
    .from("organizer_game_spots")
    .select("*")
    .eq("game_id", gameId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as SpotRow[]).map(mapSpot);
}

export async function createOrganizerGameSpot(
  supabase: SupabaseClient,
  gameId: string,
  input: { name: string; kind: OrganizerGameSpotKind }
): Promise<OrganizerGameSpot> {
  const existing = await listOrganizerGameSpots(supabase, gameId);
  if (existing.length >= MAX_ORGANIZER_GAME_SPOTS) {
    throw new Error("SPOT_LIMIT");
  }
  const sortOrder = existing.length === 0 ? 0 : Math.max(...existing.map((s) => s.sortOrder)) + 1;
  const { data, error } = await supabase
    .from("organizer_game_spots")
    .insert({
      game_id: gameId,
      name: input.name,
      kind: input.kind,
      sort_order: sortOrder,
      token: generateOrganizerGameToken(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapSpot(data as SpotRow);
}

export async function updateOrganizerGameSpot(
  supabase: SupabaseClient,
  gameId: string,
  spotId: string,
  input: { name?: string; kind?: OrganizerGameSpotKind }
): Promise<OrganizerGameSpot> {
  const patch: Record<string, string> = {};
  if (input.name != null) patch.name = input.name;
  if (input.kind != null) patch.kind = input.kind;
  const { data, error } = await supabase
    .from("organizer_game_spots")
    .update(patch)
    .eq("id", spotId)
    .eq("game_id", gameId)
    .select("*")
    .single();
  if (error) throw error;
  return mapSpot(data as SpotRow);
}

export async function deleteOrganizerGameSpot(
  supabase: SupabaseClient,
  gameId: string,
  spotId: string
): Promise<void> {
  const { error } = await supabase
    .from("organizer_game_spots")
    .delete()
    .eq("id", spotId)
    .eq("game_id", gameId);
  if (error) throw error;
}

export async function reorderOrganizerGameSpots(
  supabase: SupabaseClient,
  gameId: string,
  ids: string[]
): Promise<OrganizerGameSpot[]> {
  const current = await listOrganizerGameSpots(supabase, gameId);
  const allowed = new Set(current.map((s) => s.id));
  if (ids.length !== current.length || ids.some((id) => !allowed.has(id))) {
    throw new Error("SPOT_ORDER");
  }
  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await supabase
      .from("organizer_game_spots")
      .update({ sort_order: i })
      .eq("id", ids[i])
      .eq("game_id", gameId);
    if (error) throw error;
  }
  return listOrganizerGameSpots(supabase, gameId);
}

export async function syncOrganizerGameDraftSpots(
  supabase: SupabaseClient,
  gameId: string,
  spots: OrganizerGameSpotDraft[]
): Promise<OrganizerGameSpot[]> {
  if (spots.length > MAX_ORGANIZER_GAME_SPOTS) throw new Error("SPOT_LIMIT");
  const existing = await listOrganizerGameSpots(supabase, gameId);
  const existingIds = new Set(existing.map((spot) => spot.id));
  const keep = new Set<string>();

  for (let index = 0; index < spots.length; index += 1) {
    const spot = spots[index];
    const name = spot.name.trim() || `スポット ${index + 1}`;
    if (spot.id && existingIds.has(spot.id)) {
      const { error } = await supabase
        .from("organizer_game_spots")
        .update({ name, kind: spot.kind, sort_order: index })
        .eq("id", spot.id)
        .eq("game_id", gameId);
      if (error) throw error;
      keep.add(spot.id);
      continue;
    }
    const { data, error } = await supabase
      .from("organizer_game_spots")
      .insert({
        game_id: gameId,
        name,
        kind: spot.kind,
        sort_order: index,
        token: generateOrganizerGameToken(),
      })
      .select("id")
      .single();
    if (error) throw error;
    keep.add(data.id as string);
  }

  for (const old of existing) {
    if (keep.has(old.id)) continue;
    const { error } = await supabase
      .from("organizer_game_spots")
      .delete()
      .eq("id", old.id)
      .eq("game_id", gameId);
    if (error) throw error;
  }

  return listOrganizerGameSpots(supabase, gameId);
}

export async function updateOrganizerGameDraft(
  supabase: SupabaseClient,
  organizerId: string,
  gameId: string,
  input: Omit<CreateOrganizerGameInput, "type">
): Promise<{ game: OrganizerGame; spots: OrganizerGameSpot[] }> {
  const { data: current, error: readError } = await supabase
    .from("organizer_games")
    .select("settings")
    .eq("id", gameId)
    .eq("organizer_id", organizerId)
    .maybeSingle();
  if (readError) throw readError;

  const prev =
    current?.settings && typeof current.settings === "object" && !Array.isArray(current.settings)
      ? (current.settings as Record<string, unknown>)
      : {};
  const payload: Record<string, unknown> = {
    event_id: input.eventId || null,
    name: input.name,
    description: input.description?.trim() || null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
  };
  if (input.status === "published" || input.status === "draft") payload.status = input.status;
  if (input.settings) payload.settings = { ...prev, ...input.settings };

  let { error } = await supabase
    .from("organizer_games")
    .update(payload)
    .eq("id", gameId)
    .eq("organizer_id", organizerId);
  if (error && input.settings && /settings/i.test(error.message)) {
    delete payload.settings;
    const retry = await supabase
      .from("organizer_games")
      .update(payload)
      .eq("id", gameId)
      .eq("organizer_id", organizerId);
    error = retry.error;
  }
  if (error) throw error;

  const spots = input.spots ? await syncOrganizerGameDraftSpots(supabase, gameId, input.spots) : await listOrganizerGameSpots(supabase, gameId);
  const game = await getOwnedOrganizerGame(supabase, organizerId, gameId);
  if (!game) throw new Error("GAME_NOT_FOUND");
  game.spotCount = spots.length;
  return { game, spots };
}
