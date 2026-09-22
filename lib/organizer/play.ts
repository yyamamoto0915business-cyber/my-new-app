import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ORGANIZER_GAME_SPOT_KIND_LABEL,
  isOrganizerGameSpotKind,
  organizerGameJoinPath,
  type OrganizerGameSpotKind,
} from "@/lib/organizer/game-tokens";
import {
  PLAY_NICKNAME_MAX,
  PLAY_PASSPHRASE_MAX,
  PLAY_PASSPHRASE_MIN,
  type PlayProgress,
  type PlaySession,
  type PlaySpotProgress,
  type PlayStampResult,
} from "@/lib/organizer/play-types";

export {
  PLAY_NICKNAME_MAX,
  PLAY_PASSPHRASE_MAX,
  PLAY_PASSPHRASE_MIN,
  type PlayProgress,
  type PlaySession,
  type PlaySpotProgress,
  type PlayStampResult,
} from "@/lib/organizer/play-types";

type GameLookup = {
  id: string;
  name: string;
  playEpoch: number;
};

type PlayerRow = {
  id: string;
  game_id: string;
  nickname: string;
  nickname_key: string;
  passphrase_salt: string;
  passphrase_hash: string;
  device_token_hash: string;
  auth_epoch: number;
};

function generateDeviceToken(): string {
  return randomBytes(24).toString("hex");
}

function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newPassphraseSalt(): string {
  return randomBytes(16).toString("hex");
}

function hashPassphrase(passphrase: string, saltHex: string): string {
  return createHash("sha256").update(`${saltHex}:${passphrase}`).digest("hex");
}

function passphraseMatches(passphrase: string, saltHex: string, hashHex: string): boolean {
  const next = Buffer.from(hashPassphrase(passphrase, saltHex), "hex");
  const prev = Buffer.from(hashHex, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export function normalizePlayNickname(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function nicknameKey(nickname: string): string {
  return normalizePlayNickname(nickname).toLowerCase();
}

export function validatePlayJoinInput(nicknameRaw: string, passphraseRaw: string): string | null {
  const nickname = normalizePlayNickname(nicknameRaw);
  const passphrase = passphraseRaw.normalize("NFKC");
  if (!nickname) return "ニックネームを入力してください";
  if (nickname.length > PLAY_NICKNAME_MAX) return `ニックネームは${PLAY_NICKNAME_MAX}文字以内です`;
  if (passphrase.length < PLAY_PASSPHRASE_MIN) {
    return `合言葉は${PLAY_PASSPHRASE_MIN}文字以上にしてください`;
  }
  if (passphrase.length > PLAY_PASSPHRASE_MAX) {
    return `合言葉は${PLAY_PASSPHRASE_MAX}文字以内です`;
  }
  return null;
}

export function getPlayDb(): SupabaseClient | null {
  return createAdminClient();
}

export async function lookupPlayGameByJoinToken(
  db: SupabaseClient,
  joinToken: string
): Promise<GameLookup | null> {
  const { data, error } = await db
    .from("organizer_games")
    .select("id, name, play_epoch")
    .eq("join_token", joinToken)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id as string,
    name: (data.name as string) ?? "",
    playEpoch: typeof data.play_epoch === "number" ? data.play_epoch : 1,
  };
}

async function loadProgress(db: SupabaseClient, player: PlayerRow): Promise<PlayProgress> {
  const { data: spotRows } = await db
    .from("organizer_game_spots")
    .select("id, name, kind, sort_order")
    .eq("game_id", player.game_id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: stampRows } = await db
    .from("organizer_game_stamps")
    .select("spot_id")
    .eq("player_id", player.id);

  const stamped = new Set((stampRows ?? []).map((row) => row.spot_id as string));
  const spots: PlaySpotProgress[] = (spotRows ?? []).map((row) => {
    const kind = isOrganizerGameSpotKind(row.kind as string) ? (row.kind as OrganizerGameSpotKind) : "stamp";
    return {
      id: row.id as string,
      name: (row.name as string) ?? "スポット",
      kind,
      kindLabel: ORGANIZER_GAME_SPOT_KIND_LABEL[kind],
      stamped: stamped.has(row.id as string),
    };
  });
  const stampedCount = spots.filter((spot) => spot.stamped).length;
  return {
    nickname: player.nickname,
    stampedCount,
    spotCount: spots.length,
    completed: spots.length > 0 && stampedCount === spots.length,
    spots,
  };
}

async function issueSession(db: SupabaseClient, player: PlayerRow): Promise<PlaySession> {
  const deviceToken = generateDeviceToken();
  const { error } = await db
    .from("organizer_game_players")
    .update({
      device_token_hash: hashDeviceToken(deviceToken),
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", player.id);
  if (error) throw error;
  return {
    deviceToken,
    progress: await loadProgress(db, player),
  };
}

export async function joinPlayGame(
  db: SupabaseClient,
  joinToken: string,
  nicknameRaw: string,
  passphraseRaw: string
): Promise<{ ok: true; session: PlaySession } | { ok: false; status: number; error: string }> {
  const nickname = normalizePlayNickname(nicknameRaw);
  const passphrase = passphraseRaw.normalize("NFKC");
  const invalid = validatePlayJoinInput(nickname, passphrase);
  if (invalid) return { ok: false, status: 400, error: invalid };

  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return { ok: false, status: 404, error: "ゲームが見つかりません" };

  const key = nicknameKey(nickname);
  const { data: existing } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("nickname_key", key)
    .maybeSingle();

  const salt = newPassphraseSalt();
  const passphraseHash = hashPassphrase(passphrase, salt);
  const deviceToken = generateDeviceToken();
  const deviceTokenHash = hashDeviceToken(deviceToken);

  if (!existing) {
    const { data, error } = await db
      .from("organizer_game_players")
      .insert({
        game_id: game.id,
        nickname,
        nickname_key: key,
        passphrase_salt: salt,
        passphrase_hash: passphraseHash,
        device_token_hash: deviceTokenHash,
        auth_epoch: game.playEpoch,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        return { ok: false, status: 409, error: "そのニックネームは使われています。合言葉を入れて再開してください。" };
      }
      throw error;
    }
    return {
      ok: true,
      session: {
        deviceToken,
        progress: await loadProgress(db, data as PlayerRow),
      },
    };
  }

  const player = existing as PlayerRow;
  if (player.auth_epoch !== game.playEpoch) {
    const { error } = await db
      .from("organizer_game_players")
      .update({
        nickname,
        passphrase_salt: salt,
        passphrase_hash: passphraseHash,
        device_token_hash: deviceTokenHash,
        auth_epoch: game.playEpoch,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", player.id);
    if (error) throw error;
    return {
      ok: true,
      session: {
        deviceToken,
        progress: await loadProgress(db, { ...player, nickname, auth_epoch: game.playEpoch }),
      },
    };
  }

  if (!passphraseMatches(passphrase, player.passphrase_salt, player.passphrase_hash)) {
    return { ok: false, status: 403, error: "合言葉が違います。忘れたときは主催者にリセットを頼んでください。" };
  }

  const session = await issueSession(db, player);
  return { ok: true, session };
}

export async function resumePlayGame(
  db: SupabaseClient,
  joinToken: string,
  deviceToken: string
): Promise<PlaySession | null> {
  if (!deviceToken || deviceToken.length < 16) return null;
  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return null;

  const { data } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .maybeSingle();
  if (!data) return null;

  const player = data as PlayerRow;
  if (player.auth_epoch !== game.playEpoch) return null;

  await db
    .from("organizer_game_players")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", player.id);

  return {
    deviceToken,
    progress: await loadProgress(db, player),
  };
}

export async function stampPlaySpot(
  db: SupabaseClient,
  spotToken: string,
  deviceToken: string
): Promise<{ ok: true; result: PlayStampResult } | { ok: false; status: number; error: string; joinPath?: string }> {
  if (!deviceToken || deviceToken.length < 16) {
    return { ok: false, status: 401, error: "先に参加用QRから入ってください" };
  }

  const { data: spotRow } = await db
    .from("organizer_game_spots")
    .select("id, name, game_id")
    .eq("token", spotToken)
    .maybeSingle();
  if (!spotRow?.id || !spotRow.game_id) {
    return { ok: false, status: 404, error: "スポットが見つかりません" };
  }

  const { data: gameRow } = await db
    .from("organizer_games")
    .select("id, play_epoch, join_token")
    .eq("id", spotRow.game_id as string)
    .maybeSingle();
  if (!gameRow) {
    return { ok: false, status: 404, error: "スポットが見つかりません" };
  }

  const joinPath = gameRow.join_token
    ? organizerGameJoinPath(gameRow.join_token as string)
    : undefined;
  const playEpoch = typeof gameRow.play_epoch === "number" ? gameRow.play_epoch : 1;

  const { data: playerData } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", spotRow.game_id as string)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .maybeSingle();
  if (!playerData) {
    return {
      ok: false,
      status: 401,
      error: "先に参加用QRからニックネームと合言葉を入れてください",
      joinPath,
    };
  }

  const player = playerData as PlayerRow;
  if (player.auth_epoch !== playEpoch) {
    return {
      ok: false,
      status: 401,
      error: "合言葉がリセットされました。参加用QRから入り直してください",
      joinPath,
    };
  }

  const { error: stampError } = await db.from("organizer_game_stamps").insert({
    player_id: player.id,
    spot_id: spotRow.id,
  });
  const alreadyStamped = Boolean(stampError && stampError.code === "23505");
  if (stampError && !alreadyStamped) throw stampError;

  await db
    .from("organizer_game_players")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", player.id);

  return {
    ok: true,
    result: {
      deviceToken,
      spotId: spotRow.id as string,
      spotName: (spotRow.name as string) ?? "スポット",
      alreadyStamped,
      progress: await loadProgress(db, player),
    },
  };
}

export async function countOrganizerGamePlayers(
  supabase: SupabaseClient,
  gameId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("organizer_game_players")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId);
  if (error) return 0;
  return count ?? 0;
}

export async function resetOrganizerGamePlay(
  supabase: SupabaseClient,
  gameId: string,
  organizerId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("organizer_games")
    .select("play_epoch")
    .eq("id", gameId)
    .eq("organizer_id", organizerId)
    .maybeSingle();
  if (error || !data) throw new Error("NOT_FOUND");
  const nextEpoch = (typeof data.play_epoch === "number" ? data.play_epoch : 1) + 1;
  const { error: updateError } = await supabase
    .from("organizer_games")
    .update({ play_epoch: nextEpoch })
    .eq("id", gameId)
    .eq("organizer_id", organizerId);
  if (updateError) throw updateError;
  return nextEpoch;
}
