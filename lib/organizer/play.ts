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
  anyStartNextId,
  orderedStampBlock,
  publicPlayLimit,
  rallyAccountJoinDecision,
  eventPassHeld,
  isEventMemberStatus,
  publicPlayAudience,
  rallyAudienceDecision,
  rallyCanReplay,
  rallyCouponView,
  rallyGpsDecision,
  rallyBadgeView,
  rallyPointsView,
  rallyKeywordMatches,
  sanitizeGameExperience,
  sanitizePlace,
  stampRallyCompleted,
  type GameCheckinMethod,
  type GameRoute,
} from "@/lib/organizer/game-experience";
import {
  PLAY_NICKNAME_MAX,
  PLAY_PASSPHRASE_MAX,
  PLAY_PASSPHRASE_MIN,
  type PlayProgress,
  type PlaySession,
  type PlaySpotProgress,
  type PlayStampResult,
} from "@/lib/organizer/play-types";
import { normalizeQuizSolved, quizFinishRank, readStoredQuiz } from "@/lib/organizer/quiz-play";
import { missionAwardPoints, normalizeMissionDone, readStoredMission } from "@/lib/organizer/mission-play";
import { normalizePhotoDone, readStoredPhoto } from "@/lib/organizer/photo-play";
import { normalizeCouponDone, readStoredCoupon } from "@/lib/organizer/coupon-play";
import { normalizeCheckinDone, readStoredCheckin } from "@/lib/organizer/checkin-play";
import { nextMysteryIndex, normalizeMysterySolved, readStoredMystery } from "@/lib/organizer/mystery-play";

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
  coupon_used_at?: string | null;
  points_awarded_at?: string | null;
  badge_awarded_at?: string | null;
  play_round?: number | null;
  account_user_id?: string | null;
  quiz_solved?: number[] | null;
  mission_done?: number[] | null;
  photo_done?: number[] | null;
  coupon_done?: number[] | null;
  checkin_done?: number[] | null;
  mystery_solved?: number[] | null;
  quiz_cleared_at?: string | null;
  coupon_code?: string | null;
};

function playerRound(player: { play_round?: number | null }): number {
  return typeof player.play_round === "number" && player.play_round > 0 ? Math.floor(player.play_round) : 1;
}

type AudienceBlock = { status: number; error: string; code: "audience_login" | "audience_closed" };

async function playAudienceBlock(
  db: SupabaseClient,
  gameId: string,
  userId: string | null,
): Promise<AudienceBlock | null> {
  const { data, error } = await db
    .from("organizer_games")
    .select("event_id, settings")
    .eq("id", gameId)
    .maybeSingle();
  if (error || !data) return null;
  const settings = (data as { settings?: unknown }).settings;
  const audience = publicPlayAudience(settings);
  if (audience === "anyone") return null;
  const eventId = typeof (data as { event_id?: unknown }).event_id === "string" ? (data as { event_id: string }).event_id : "";
  let participant = false;
  let passHeld = false;
  if (userId && eventId) {
    const { data: member } = await db
      .from("event_participants")
      .select("status")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();
    const status = typeof member?.status === "string" ? member.status : null;
    participant = isEventMemberStatus(status);
    if (audience === "pass") {
      const [{ data: eventRow }, { data: orderRows }, { data: volunteerRows }] = await Promise.all([
        db.from("events").select("price, payment_method").eq("id", eventId).maybeSingle(),
        db
          .from("event_orders")
          .select("status")
          .eq("event_id", eventId)
          .eq("user_id", userId)
          .in("status", ["paid", "refunded"]),
        db
          .from("recruitment_applications")
          .select("id, recruitments!inner(event_id)")
          .eq("user_id", userId)
          .in("status", ["accepted", "confirmed", "checked_in", "completed"])
          .eq("recruitments.event_id", eventId)
          .limit(1),
      ]);
      const price = Number((eventRow as { price?: unknown } | null)?.price);
      const paymentMethod = (eventRow as { payment_method?: unknown } | null)?.payment_method;
      const orders = (orderRows ?? []) as { status?: string }[];
      const orderStatus = orders.some((order) => order.status === "paid")
        ? "paid"
        : orders.some((order) => order.status === "refunded")
          ? "refunded"
          : null;
      passHeld = eventPassHeld({
        participantStatus: status,
        price: Number.isFinite(price) ? price : 0,
        paymentMethod: typeof paymentMethod === "string" ? paymentMethod : null,
        orderStatus,
        volunteerAccepted: (volunteerRows ?? []).length > 0,
      });
    }
  }
  const decision = rallyAudienceDecision({
    audience,
    signedIn: Boolean(userId),
    eventLinked: Boolean(eventId),
    participant,
    passHeld,
  });
  if (decision.ok) return null;
  return {
    status: decision.code === "audience_login" ? 401 : 403,
    error: decision.error,
    code: decision.code,
  };
}

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

export async function playGamePublished(db: SupabaseClient, gameId: string): Promise<boolean> {
  const { data } = await db.from("organizer_games").select("status").eq("id", gameId).maybeSingle();
  return (data as { status?: string } | null)?.status === "published";
}

export async function lookupPlayGameByJoinToken(
  db: SupabaseClient,
  joinToken: string
): Promise<GameLookup | null> {
  const { data, error } = await db
    .from("organizer_games")
    .select("id, name, play_epoch")
    .eq("join_token", joinToken)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id as string,
    name: (data.name as string) ?? "",
    playEpoch: typeof data.play_epoch === "number" ? data.play_epoch : 1,
  };
}

type RallySpot = PlaySpotProgress & {
  required: boolean;
  checkin: GameCheckinMethod;
  keyword: string;
  lat: number | null;
  lng: number | null;
  radiusM: number;
  stampedAt: string | null;
};

async function loadRally(db: SupabaseClient, gameId: string, playerId: string, playRound = 1) {
  const { data: spotRows } = await db
    .from("organizer_game_spots")
    .select("id, name, kind, sort_order")
    .eq("game_id", gameId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const round = playRound > 0 ? playRound : 1;
  const filteredStamps = await db
    .from("organizer_game_stamps")
    .select("spot_id, stamped_at")
    .eq("player_id", playerId)
    .eq("round", round);
  const stampRows = filteredStamps.error
    ? (
        await db.from("organizer_game_stamps").select("spot_id, stamped_at").eq("player_id", playerId)
      ).data
    : filteredStamps.data;

  const stampedAt = new Map(
    (stampRows ?? []).map((row) => [row.spot_id as string, typeof row.stamped_at === "string" ? row.stamped_at : ""]),
  );
  const { data: gameRow, error: settingsError } = await db
    .from("organizer_games")
    .select("settings")
    .eq("id", gameId)
    .maybeSingle();
  const settings = settingsError ? null : (gameRow as { settings?: unknown } | null)?.settings;
  const experience =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? sanitizeGameExperience((settings as { experience?: unknown }).experience)
      : null;
  const route: GameRoute = experience?.basics.route ?? "free";
  const spots: RallySpot[] = (spotRows ?? []).flatMap((row, index) => {
    const meta = experience?.spots[index];
    if (meta && !meta.published) return [];
    const kind = isOrganizerGameSpotKind(row.kind as string) ? (row.kind as OrganizerGameSpotKind) : "stamp";
    return [
      {
        id: row.id as string,
        name: (row.name as string) ?? "スポット",
        kind,
        kindLabel: ORGANIZER_GAME_SPOT_KIND_LABEL[kind],
        stamped: stampedAt.has(row.id as string),
        stampedAt: stampedAt.get(row.id as string) ?? null,
        imageUrl: meta?.imageUrl ?? "",
        required: meta ? meta.required : true,
        checkin: meta?.checkin ?? "qr",
        keyword: meta?.keyword ?? "",
        lat: meta?.lat ?? null,
        lng: meta?.lng ?? null,
        radiusM: meta?.radiusM ?? 30,
      },
    ];
  });
  return { spots, settings, route, experience };
}

async function claimRallyPoints(
  db: SupabaseClient,
  player: PlayerRow,
  userId: string,
  amount: number,
): Promise<string | null> {
  if (player.points_awarded_at) return player.points_awarded_at;
  const { data: prior } = await db
    .from("organizer_game_players")
    .select("id")
    .eq("game_id", player.game_id)
    .eq("points_user_id", userId)
    .neq("id", player.id)
    .limit(1);
  if (prior && prior.length > 0) {
    const awarded = new Date().toISOString();
    await db.from("organizer_game_players").update({ points_awarded_at: awarded, points_user_id: userId }).eq("id", player.id);
    return awarded;
  }
  const { data, error } = await db.rpc("award_stamp_rally_points", {
    p_player_id: player.id,
    p_user_id: userId,
    p_amount: amount,
  });
  if (error) {
    console.error("award stamp rally points:", error.message);
    return null;
  }
  return typeof data === "string" && data ? data : null;
}

async function claimPlayPoints(
  db: SupabaseClient,
  player: PlayerRow,
  userId: string,
  amount: number,
  source: "photo" | "checkin" | "mission",
): Promise<string | null> {
  if (player.points_awarded_at) return player.points_awarded_at;
  const { data: prior } = await db
    .from("organizer_game_players")
    .select("id")
    .eq("game_id", player.game_id)
    .eq("points_user_id", userId)
    .neq("id", player.id)
    .limit(1);
  if (prior && prior.length > 0) {
    const awarded = new Date().toISOString();
    await db.from("organizer_game_players").update({ points_awarded_at: awarded, points_user_id: userId }).eq("id", player.id);
    return awarded;
  }
  const { data, error } = await db.rpc("award_play_points", {
    p_player_id: player.id,
    p_user_id: userId,
    p_amount: amount,
    p_source: source,
  });
  if (error) {
    console.error("award play points:", error.message);
    return null;
  }
  return typeof data === "string" && data ? data : null;
}

async function claimRallyBadge(
  db: SupabaseClient,
  player: PlayerRow,
  userId: string,
  label: string,
  imageUrl: string,
): Promise<string | null> {
  if (player.badge_awarded_at) return player.badge_awarded_at;
  const { data: prior } = await db
    .from("organizer_game_players")
    .select("id")
    .eq("game_id", player.game_id)
    .eq("badge_user_id", userId)
    .neq("id", player.id)
    .limit(1);
  if (prior && prior.length > 0) {
    const awarded = new Date().toISOString();
    await db.from("organizer_game_players").update({ badge_awarded_at: awarded, badge_user_id: userId }).eq("id", player.id);
    return awarded;
  }
  const { data, error } = await db.rpc("award_stamp_rally_badge", {
    p_player_id: player.id,
    p_user_id: userId,
    p_label: label,
    p_image: imageUrl,
  });
  if (error) {
    console.error("award stamp rally badge:", error.message);
    return null;
  }
  return typeof data === "string" && data ? data : null;
}

async function markQuizCleared(db: SupabaseClient, player: PlayerRow): Promise<string | null> {
  if (player.quiz_cleared_at) return player.quiz_cleared_at;
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("organizer_game_players")
    .update({ quiz_cleared_at: now })
    .eq("id", player.id)
    .is("quiz_cleared_at", null)
    .select("quiz_cleared_at")
    .maybeSingle();
  if (error) {
    console.error("mark quiz cleared:", error.message);
    return null;
  }
  const stamped = (data as { quiz_cleared_at?: string | null } | null)?.quiz_cleared_at;
  if (typeof stamped === "string" && stamped) return stamped;
  const { data: again } = await db
    .from("organizer_game_players")
    .select("quiz_cleared_at")
    .eq("id", player.id)
    .maybeSingle();
  const existing = (again as { quiz_cleared_at?: string | null } | null)?.quiz_cleared_at;
  return typeof existing === "string" && existing ? existing : null;
}

async function loadQuizRank(
  db: SupabaseClient,
  gameId: string,
  playerId: string,
  clearedAt: string,
): Promise<number> {
  const { data, error } = await db
    .from("organizer_game_players")
    .select("id, quiz_cleared_at")
    .eq("game_id", gameId)
    .not("quiz_cleared_at", "is", null);
  if (error || !data) return 1;
  const rows = (data as { id: string; quiz_cleared_at: string | null }[]).flatMap((row) =>
    typeof row.quiz_cleared_at === "string" && row.quiz_cleared_at
      ? [{ id: row.id, clearedAt: row.quiz_cleared_at }]
      : [],
  );
  return quizFinishRank(rows, playerId, clearedAt);
}

function newCouponPlayCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let index = 0; index < 8; index += 1) out += alphabet[bytes[index]! % alphabet.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

async function issueCouponPlayCode(db: SupabaseClient, player: PlayerRow): Promise<string | null> {
  if (player.coupon_code) return player.coupon_code;
  const code = newCouponPlayCode();
  const { data, error } = await db
    .from("organizer_game_players")
    .update({ coupon_code: code })
    .eq("id", player.id)
    .is("coupon_code", null)
    .select("coupon_code")
    .maybeSingle();
  if (error) {
    console.error("issue coupon code:", error.message);
    return null;
  }
  const stamped = (data as { coupon_code?: string | null } | null)?.coupon_code;
  if (typeof stamped === "string" && stamped) return stamped;
  const { data: again } = await db
    .from("organizer_game_players")
    .select("coupon_code")
    .eq("id", player.id)
    .maybeSingle();
  const existing = (again as { coupon_code?: string | null } | null)?.coupon_code;
  return typeof existing === "string" && existing ? existing : null;
}

async function loadProgress(
  db: SupabaseClient,
  player: PlayerRow,
  userId: string | null = null,
): Promise<PlayProgress> {
  const { spots, settings, route, experience } = await loadRally(
    db,
    player.game_id,
    player.id,
    playerRound(player),
  );
  const storedQuiz = readStoredQuiz(settings);
  if (storedQuiz) {
    const solved = normalizeQuizSolved(player.quiz_solved, storedQuiz.questions.length);
    const needed = storedQuiz.clearCount;
    const completed = solved.length >= needed;
    let clearedAt = player.quiz_cleared_at || null;
    let quizRank: number | undefined;
    if (completed && storedQuiz.rankingOn) {
      if (!clearedAt) clearedAt = await markQuizCleared(db, player);
      if (clearedAt) quizRank = await loadQuizRank(db, player.game_id, player.id, clearedAt);
    }
    const couponUsed = Boolean(player.coupon_used_at);
    let couponCode = player.coupon_code || null;
    if (completed && storedQuiz.couponOn && !couponUsed && !couponCode) {
      couponCode = await issueCouponPlayCode(db, player);
    }
    return {
      nickname: player.nickname,
      stampedCount: solved.length,
      spotCount: storedQuiz.questions.length,
      completed,
      quizRank,
      rewardCode: completed && storedQuiz.couponOn && !couponUsed && couponCode ? couponCode : undefined,
      rewardUsed: completed && storedQuiz.couponOn && couponUsed ? true : undefined,
      quiz: { needed, solved, rewards: storedQuiz.rewards },
      spots: [],
    };
  }
  const storedMission = readStoredMission(settings);
  if (storedMission) {
    const done = normalizeMissionDone(player.mission_done, storedMission.missions.length);
    const needed = storedMission.clearCount;
    const completed = done.length >= needed;
    const pointAmount = completed ? missionAwardPoints(storedMission, done) : 0;
    let awardedAt = player.points_awarded_at || null;
    if (completed && pointAmount > 0 && userId && !awardedAt) {
      awardedAt = await claimPlayPoints(db, player, userId, pointAmount, "mission");
    }
    return {
      nickname: player.nickname,
      stampedCount: done.length,
      spotCount: storedMission.missions.length,
      completed,
      rewardPoints: pointAmount > 0 ? pointAmount : undefined,
      rewardPointsAwarded: Boolean(awardedAt) && pointAmount > 0,
      mission: { needed, done, rewards: storedMission.rewards },
      spots: [],
    };
  }
  const storedPhoto = readStoredPhoto(settings);
  if (storedPhoto) {
    const done = normalizePhotoDone(player.photo_done, storedPhoto.spots.length);
    const needed = storedPhoto.clearCount;
    const completed = done.length >= needed;
    let awardedAt = player.points_awarded_at || null;
    if (completed && storedPhoto.pointAmount > 0 && userId && !awardedAt) {
      awardedAt = await claimPlayPoints(db, player, userId, storedPhoto.pointAmount, "photo");
    }
    return {
      nickname: player.nickname,
      stampedCount: done.length,
      spotCount: storedPhoto.spots.length,
      completed,
      rewardPoints: completed && storedPhoto.pointAmount > 0 ? storedPhoto.pointAmount : undefined,
      rewardPointsAwarded: Boolean(awardedAt) && storedPhoto.pointAmount > 0,
      photo: { needed, done, rewards: storedPhoto.rewards },
      spots: [],
    };
  }
  const storedCoupon = readStoredCoupon(settings);
  if (storedCoupon) {
    const done = normalizeCouponDone(player.coupon_done, storedCoupon.stores.length);
    const needed = storedCoupon.needed;
    const completed = done.length >= needed;
    const used = Boolean(player.coupon_used_at);
    let code = player.coupon_code || null;
    if (completed && storedCoupon.autoGrant && !used && !code) {
      code = await issueCouponPlayCode(db, player);
    }
    return {
      nickname: player.nickname,
      stampedCount: done.length,
      spotCount: storedCoupon.stores.length,
      completed,
      rewardCode: completed && storedCoupon.autoGrant && !used && code ? code : undefined,
      rewardUsed: completed && storedCoupon.autoGrant && used ? true : undefined,
      coupon: {
        needed,
        done,
        autoGrant: storedCoupon.autoGrant,
        noStack: storedCoupon.noStack,
      },
      spots: [],
    };
  }
  const storedCheckin = readStoredCheckin(settings);
  if (storedCheckin) {
    const done = normalizeCheckinDone(player.checkin_done, storedCheckin.spots.length);
    const needed = storedCheckin.needed;
    const completed = done.length >= needed;
    let awardedAt = player.points_awarded_at || null;
    if (completed && storedCheckin.pointAmount > 0 && userId && !awardedAt) {
      awardedAt = await claimPlayPoints(db, player, userId, storedCheckin.pointAmount, "checkin");
    }
    return {
      nickname: player.nickname,
      stampedCount: done.length,
      spotCount: storedCheckin.spots.length,
      completed,
      rewardPoints: completed && storedCheckin.pointAmount > 0 ? storedCheckin.pointAmount : undefined,
      rewardPointsAwarded: Boolean(awardedAt) && storedCheckin.pointAmount > 0,
      checkin: { needed, done, rewards: storedCheckin.rewards },
      spots: [],
    };
  }
  const storedMystery = readStoredMystery(settings);
  if (storedMystery) {
    const solved = normalizeMysterySolved(player.mystery_solved, storedMystery.steps.length);
    const needed = storedMystery.needed;
    return {
      nickname: player.nickname,
      stampedCount: solved.length,
      spotCount: storedMystery.steps.length,
      completed: solved.length >= needed,
      mystery: { needed, solved, rewards: storedMystery.rewards },
      spots: [],
    };
  }
  const stampedCount = spots.filter((spot) => spot.stamped).length;
  const completed = stampRallyCompleted(spots, settings);
  const coupon = rallyCouponView(completed, experience?.reward, player.coupon_used_at);
  let awardedAt = player.points_awarded_at || null;
  if (completed && experience?.reward.kind === "points" && userId && !awardedAt) {
    awardedAt = await claimRallyPoints(db, player, userId, experience.reward.points);
  }
  const points = rallyPointsView(completed, experience?.reward, awardedAt);
  let badgeAt = player.badge_awarded_at || null;
  if (completed && experience?.reward.kind === "badge" && userId && !badgeAt) {
    badgeAt = await claimRallyBadge(db, player, userId, experience.reward.label, experience.reward.imageUrl);
  }
  const badge = rallyBadgeView(completed, experience?.reward, badgeAt);
  return {
    nickname: player.nickname,
    stampedCount,
    spotCount: spots.length,
    completed,
    rewardCode: coupon.rewardCode,
    rewardUsed: coupon.rewardUsed,
    rewardPoints: points.rewardPoints,
    rewardPointsAwarded: points.rewardPointsAwarded,
    rewardBadge: badge.rewardBadge,
    rewardBadgeAwarded: badge.rewardBadgeAwarded,
    rewardBadgeImage: badge.rewardBadgeImage,
    stampImageUrl: experience?.screens.stamp.imageUrl || undefined,
    ordered: route === "ordered" || route === "any-start",
    nextSpotId: route === "any-start" ? anyStartNextId(spots) : undefined,
    canReplay: rallyCanReplay(completed, experience?.basics.playLimit ?? "once"),
    spots: spots.map((spot) => ({
      id: spot.id,
      name: spot.name,
      kind: spot.kind,
      kindLabel: spot.kindLabel,
      stamped: spot.stamped,
      imageUrl: spot.imageUrl,
    })),
  };
}

async function issueSession(
  db: SupabaseClient,
  player: PlayerRow,
  userId: string | null,
): Promise<PlaySession> {
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
    progress: await loadProgress(db, player, userId),
  };
}

export async function joinPlayGame(
  db: SupabaseClient,
  joinToken: string,
  nicknameRaw: string,
  passphraseRaw: string,
  userId: string | null = null,
): Promise<{ ok: true; session: PlaySession } | { ok: false; status: number; error: string; code?: string }> {
  const nickname = normalizePlayNickname(nicknameRaw);
  const passphrase = passphraseRaw.normalize("NFKC");
  const invalid = validatePlayJoinInput(nickname, passphrase);
  if (invalid) return { ok: false, status: 400, error: invalid };

  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return { ok: false, status: 404, error: "ゲームが見つかりません" };
  const audience = await playAudienceBlock(db, game.id, userId);
  if (audience) return { ok: false, ...audience };

  const { data: settingsRow } = await db.from("organizer_games").select("settings").eq("id", game.id).maybeSingle();
  const playLimit = publicPlayLimit((settingsRow as { settings?: unknown } | null)?.settings);
  const key = nicknameKey(nickname);
  let accountNickname: string | null = null;
  let accountSame = false;
  if (userId) {
    const { data: owned } = await db
      .from("organizer_game_players")
      .select("nickname, nickname_key")
      .eq("game_id", game.id)
      .eq("account_user_id", userId)
      .maybeSingle();
    if (owned) {
      accountNickname = typeof owned.nickname === "string" ? owned.nickname : null;
      accountSame = owned.nickname_key === key;
    }
  }
  const accountDecision = rallyAccountJoinDecision({
    playLimit,
    signedIn: Boolean(userId),
    accountNickname,
    sameNickname: accountSame,
  });
  if (!accountDecision.ok) {
    return { ok: false, status: accountDecision.code === "account_login" ? 401 : 409, error: accountDecision.error, code: accountDecision.code };
  }

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
        account_user_id: userId,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        const detail = `${error.message} ${error.details ?? ""}`;
        if (detail.includes("account")) {
          return {
            ok: false,
            status: 409,
            error: accountNickname
              ? `このアカウントは、ニックネーム「${accountNickname}」で参加しています。`
              : "このアカウントでは、別のニックネームで参加しています。",
            code: "account_taken",
          };
        }
        return { ok: false, status: 409, error: "そのニックネームは使われています。合言葉を入れて再開してください。" };
      }
      throw error;
    }
    return {
      ok: true,
      session: {
        deviceToken,
        progress: await loadProgress(db, data as PlayerRow, userId),
      },
    };
  }

  const player = existing as PlayerRow;
  if (userId && player.account_user_id && player.account_user_id !== userId) {
    return { ok: false, status: 409, error: "このニックネームは、別のアカウントで参加しています。" };
  }
  if (userId && !player.account_user_id) {
    const { error: bindError } = await db
      .from("organizer_game_players")
      .update({ account_user_id: userId })
      .eq("id", player.id);
    if (bindError?.code === "23505") {
      return {
        ok: false,
        status: 409,
        error: "このアカウントでは、別のニックネームで参加しています。",
        code: "account_taken",
      };
    }
  }
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
        progress: await loadProgress(db, { ...player, nickname, auth_epoch: game.playEpoch }, userId),
      },
    };
  }

  if (!passphraseMatches(passphrase, player.passphrase_salt, player.passphrase_hash)) {
    return { ok: false, status: 403, error: "合言葉が違います。忘れたときは主催者にリセットを頼んでください。" };
  }

  const session = await issueSession(db, player, userId);
  return { ok: true, session };
}

export async function resumePlayGame(
  db: SupabaseClient,
  joinToken: string,
  deviceToken: string,
  userId: string | null = null,
): Promise<
  { ok: true; session: PlaySession } | { ok: false; status: number; error: string; code?: string }
> {
  if (!deviceToken || deviceToken.length < 16) {
    return { ok: false, status: 401, error: "再開できませんでした" };
  }
  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return { ok: false, status: 404, error: "ゲームが見つかりません" };

  const { data } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .maybeSingle();
  if (!data) return { ok: false, status: 401, error: "再開できませんでした" };

  const player = data as PlayerRow;
  if (player.auth_epoch !== game.playEpoch) {
    return { ok: false, status: 401, error: "合言葉がリセットされました。参加用QRから入り直してください" };
  }
  const audience = await playAudienceBlock(db, player.game_id, userId);
  if (audience) return { ok: false, ...audience };

  await db
    .from("organizer_game_players")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", player.id);

  return {
    ok: true,
    session: {
      deviceToken,
      progress: await loadProgress(db, player, userId),
    },
  };
}

export async function answerPlayQuiz(
  db: SupabaseClient,
  joinToken: string,
  deviceToken: string,
  questionIndex: number,
  choiceIndex: number,
  userId: string | null = null,
): Promise<
  | { ok: true; correct: boolean; already: boolean; hint: string; progress: PlayProgress }
  | { ok: false; status: number; error: string }
> {
  if (!deviceToken || deviceToken.length < 16) {
    return { ok: false, status: 401, error: "先に参加用QRから入ってください" };
  }
  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return { ok: false, status: 404, error: "ゲームが見つかりません" };

  const { data } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .maybeSingle();
  if (!data) return { ok: false, status: 401, error: "先に参加用QRから入ってください" };

  const player = data as PlayerRow;
  if (player.auth_epoch !== game.playEpoch) {
    return { ok: false, status: 401, error: "合言葉がリセットされました。参加用QRから入り直してください" };
  }

  const { settings } = await loadRally(db, game.id, player.id, playerRound(player));
  const stored = readStoredQuiz(settings);
  if (!stored) return { ok: false, status: 404, error: "問題が見つかりません" };
  const question = stored.questions.find((item) => item.index === questionIndex);
  if (!question) return { ok: false, status: 404, error: "問題が見つかりません" };

  const solved = normalizeQuizSolved(player.quiz_solved, stored.questions.length);
  if (solved.includes(question.index)) {
    return {
      ok: true,
      correct: true,
      already: true,
      hint: "",
      progress: await loadProgress(db, player, userId),
    };
  }
  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= question.choices.length) {
    return { ok: false, status: 400, error: "選択肢を選んでください" };
  }

  const correct = choiceIndex === question.correctIndex;
  let nextPlayer = player;
  if (correct) {
    const nextSolved = [...solved, question.index].sort((left, right) => left - right);
    const { error } = await db
      .from("organizer_game_players")
      .update({ quiz_solved: nextSolved, last_seen_at: new Date().toISOString() })
      .eq("id", player.id);
    if (error) throw error;
    nextPlayer = { ...player, quiz_solved: nextSolved };
  }

  return {
    ok: true,
    correct,
    already: false,
    hint: correct ? "" : question.hint,
    progress: await loadProgress(db, nextPlayer, userId),
  };
}

export async function completePlayMission(
  db: SupabaseClient,
  joinToken: string,
  deviceToken: string,
  missionIndex: number,
  keywordRaw: string,
  userId: string | null = null,
): Promise<
  | { ok: true; done: boolean; already: boolean; note: string; progress: PlayProgress }
  | { ok: false; status: number; error: string }
> {
  if (!deviceToken || deviceToken.length < 16) {
    return { ok: false, status: 401, error: "先に参加用QRから入ってください" };
  }
  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return { ok: false, status: 404, error: "ゲームが見つかりません" };

  const { data } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .maybeSingle();
  if (!data) return { ok: false, status: 401, error: "先に参加用QRから入ってください" };

  const player = data as PlayerRow;
  if (player.auth_epoch !== game.playEpoch) {
    return { ok: false, status: 401, error: "合言葉がリセットされました。参加用QRから入り直してください" };
  }

  const { settings } = await loadRally(db, game.id, player.id, playerRound(player));
  const stored = readStoredMission(settings);
  if (!stored) return { ok: false, status: 404, error: "ミッションが見つかりません" };
  const mission = stored.missions.find((item) => item.index === missionIndex);
  if (!mission) return { ok: false, status: 404, error: "ミッションが見つかりません" };

  const done = normalizeMissionDone(player.mission_done, stored.missions.length);
  if (done.includes(mission.index)) {
    return {
      ok: true,
      done: true,
      already: true,
      note: "",
      progress: await loadProgress(db, player, userId),
    };
  }

  if (mission.kind === "keyword") {
    const given = keywordRaw.trim();
    if (mission.keyword && given !== mission.keyword) {
      return {
        ok: true,
        done: false,
        already: false,
        note: "ちがいます。もう一度どうぞ。",
        progress: await loadProgress(db, player, userId),
      };
    }
    if (!mission.keyword && !given) {
      return { ok: false, status: 400, error: "合言葉を入れてください" };
    }
  }

  const nextDone = [...done, mission.index].sort((left, right) => left - right);
  const { error } = await db
    .from("organizer_game_players")
    .update({ mission_done: nextDone, last_seen_at: new Date().toISOString() })
    .eq("id", player.id);
  if (error) throw error;

  return {
    ok: true,
    done: true,
    already: false,
    note: "",
    progress: await loadProgress(db, { ...player, mission_done: nextDone }, userId),
  };
}

export async function completePlayPhoto(
  db: SupabaseClient,
  joinToken: string,
  deviceToken: string,
  spotIndex: number,
  userId: string | null = null,
): Promise<
  | { ok: true; done: boolean; already: boolean; progress: PlayProgress }
  | { ok: false; status: number; error: string }
> {
  if (!deviceToken || deviceToken.length < 16) {
    return { ok: false, status: 401, error: "先に参加用QRから入ってください" };
  }
  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return { ok: false, status: 404, error: "ゲームが見つかりません" };

  const { data } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .maybeSingle();
  if (!data) return { ok: false, status: 401, error: "先に参加用QRから入ってください" };

  const player = data as PlayerRow;
  if (player.auth_epoch !== game.playEpoch) {
    return { ok: false, status: 401, error: "合言葉がリセットされました。参加用QRから入り直してください" };
  }

  const { settings } = await loadRally(db, game.id, player.id, playerRound(player));
  const stored = readStoredPhoto(settings);
  if (!stored) return { ok: false, status: 404, error: "撮影スポットが見つかりません" };
  const spot = stored.spots.find((item) => item.index === spotIndex);
  if (!spot) return { ok: false, status: 404, error: "撮影スポットが見つかりません" };

  const done = normalizePhotoDone(player.photo_done, stored.spots.length);
  if (done.includes(spot.index)) {
    return {
      ok: true,
      done: true,
      already: true,
      progress: await loadProgress(db, player, userId),
    };
  }

  const nextDone = [...done, spot.index].sort((left, right) => left - right);
  const { error } = await db
    .from("organizer_game_players")
    .update({ photo_done: nextDone, last_seen_at: new Date().toISOString() })
    .eq("id", player.id);
  if (error) throw error;

  return {
    ok: true,
    done: true,
    already: false,
    progress: await loadProgress(db, { ...player, photo_done: nextDone }, userId),
  };
}

export async function completePlayCoupon(
  db: SupabaseClient,
  joinToken: string,
  deviceToken: string,
  storeIndex: number,
  userId: string | null = null,
): Promise<
  | { ok: true; done: boolean; already: boolean; progress: PlayProgress }
  | { ok: false; status: number; error: string }
> {
  if (!deviceToken || deviceToken.length < 16) {
    return { ok: false, status: 401, error: "先に参加用QRから入ってください" };
  }
  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return { ok: false, status: 404, error: "ゲームが見つかりません" };

  const { data } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .maybeSingle();
  if (!data) return { ok: false, status: 401, error: "先に参加用QRから入ってください" };

  const player = data as PlayerRow;
  if (player.auth_epoch !== game.playEpoch) {
    return { ok: false, status: 401, error: "合言葉がリセットされました。参加用QRから入り直してください" };
  }

  const { settings } = await loadRally(db, game.id, player.id, playerRound(player));
  const stored = readStoredCoupon(settings);
  if (!stored) return { ok: false, status: 404, error: "店舗が見つかりません" };
  const store = stored.stores.find((item) => item.index === storeIndex);
  if (!store) return { ok: false, status: 404, error: "店舗が見つかりません" };

  const done = normalizeCouponDone(player.coupon_done, stored.stores.length);
  if (done.includes(store.index)) {
    return {
      ok: true,
      done: true,
      already: true,
      progress: await loadProgress(db, player, userId),
    };
  }

  const nextDone = [...done, store.index].sort((left, right) => left - right);
  const { error } = await db
    .from("organizer_game_players")
    .update({ coupon_done: nextDone, last_seen_at: new Date().toISOString() })
    .eq("id", player.id);
  if (error) throw error;

  return {
    ok: true,
    done: true,
    already: false,
    progress: await loadProgress(db, { ...player, coupon_done: nextDone }, userId),
  };
}

export async function completePlayCheckin(
  db: SupabaseClient,
  joinToken: string,
  deviceToken: string,
  spotIndex: number,
  keywordRaw: string,
  userId: string | null = null,
): Promise<
  | { ok: true; done: boolean; already: boolean; note: string; progress: PlayProgress }
  | { ok: false; status: number; error: string }
> {
  if (!deviceToken || deviceToken.length < 16) {
    return { ok: false, status: 401, error: "先に参加用QRから入ってください" };
  }
  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return { ok: false, status: 404, error: "ゲームが見つかりません" };

  const { data } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .maybeSingle();
  if (!data) return { ok: false, status: 401, error: "先に参加用QRから入ってください" };

  const player = data as PlayerRow;
  if (player.auth_epoch !== game.playEpoch) {
    return { ok: false, status: 401, error: "合言葉がリセットされました。参加用QRから入り直してください" };
  }

  const { settings } = await loadRally(db, game.id, player.id, playerRound(player));
  const stored = readStoredCheckin(settings);
  if (!stored) return { ok: false, status: 404, error: "スポットが見つかりません" };
  const spot = stored.spots.find((item) => item.index === spotIndex);
  if (!spot) return { ok: false, status: 404, error: "スポットが見つかりません" };

  const done = normalizeCheckinDone(player.checkin_done, stored.spots.length);
  if (done.includes(spot.index)) {
    return {
      ok: true,
      done: true,
      already: true,
      note: "",
      progress: await loadProgress(db, player, userId),
    };
  }

  if (spot.method === "keyword") {
    const given = keywordRaw.trim();
    if (spot.keyword && given !== spot.keyword) {
      return {
        ok: true,
        done: false,
        already: false,
        note: "ちがいます。もう一度どうぞ。",
        progress: await loadProgress(db, player, userId),
      };
    }
    if (!spot.keyword && !given) {
      return { ok: false, status: 400, error: "キーワードを入れてください" };
    }
    if (!spot.keyword) {
      return { ok: false, status: 400, error: "キーワードがまだ入っていません。" };
    }
  }

  const nextDone = [...done, spot.index].sort((left, right) => left - right);
  const { error } = await db
    .from("organizer_game_players")
    .update({ checkin_done: nextDone, last_seen_at: new Date().toISOString() })
    .eq("id", player.id);
  if (error) throw error;

  return {
    ok: true,
    done: true,
    already: false,
    note: "",
    progress: await loadProgress(db, { ...player, checkin_done: nextDone }, userId),
  };
}

export async function completePlayMystery(
  db: SupabaseClient,
  joinToken: string,
  deviceToken: string,
  stepIndex: number,
  answerRaw: string,
  userId: string | null = null,
): Promise<
  | { ok: true; done: boolean; already: boolean; note: string; hint: string; progress: PlayProgress }
  | { ok: false; status: number; error: string }
> {
  if (!deviceToken || deviceToken.length < 16) {
    return { ok: false, status: 401, error: "先に参加用QRから入ってください" };
  }
  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return { ok: false, status: 404, error: "ゲームが見つかりません" };

  const { data } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .maybeSingle();
  if (!data) return { ok: false, status: 401, error: "先に参加用QRから入ってください" };

  const player = data as PlayerRow;
  if (player.auth_epoch !== game.playEpoch) {
    return { ok: false, status: 401, error: "合言葉がリセットされました。参加用QRから入り直してください" };
  }

  const { settings } = await loadRally(db, game.id, player.id, playerRound(player));
  const stored = readStoredMystery(settings);
  if (!stored) return { ok: false, status: 404, error: "謎が見つかりません" };
  const step = stored.steps.find((item) => item.index === stepIndex);
  if (!step) return { ok: false, status: 404, error: "謎が見つかりません" };

  const solved = normalizeMysterySolved(player.mystery_solved, stored.steps.length);
  if (solved.includes(step.index)) {
    return {
      ok: true,
      done: true,
      already: true,
      note: "",
      hint: "",
      progress: await loadProgress(db, player, userId),
    };
  }

  const nextIndex = nextMysteryIndex(solved, stored.steps.length);
  if (step.index !== nextIndex) {
    return { ok: false, status: 400, error: "まえの謎からどうぞ。" };
  }

  const given = answerRaw.trim();
  if (!given) return { ok: false, status: 400, error: "答えを入れてください" };
  if (given !== step.answer) {
    return {
      ok: true,
      done: false,
      already: false,
      note: "ちがいます。もう一度どうぞ。",
      hint: step.hint,
      progress: await loadProgress(db, player, userId),
    };
  }

  const nextSolved = [...solved, step.index].sort((left, right) => left - right);
  const { error } = await db
    .from("organizer_game_players")
    .update({ mystery_solved: nextSolved, last_seen_at: new Date().toISOString() })
    .eq("id", player.id);
  if (error) throw error;

  return {
    ok: true,
    done: true,
    already: false,
    note: "",
    hint: "",
    progress: await loadProgress(db, { ...player, mystery_solved: nextSolved }, userId),
  };
}

export async function replayPlayGame(
  db: SupabaseClient,
  joinToken: string,
  deviceToken: string,
  userId: string | null = null,
): Promise<
  | { ok: true; session: PlaySession }
  | { ok: false; status: number; error: string; code?: "audience_login" | "audience_closed" }
> {
  if (!deviceToken || deviceToken.length < 16) {
    return { ok: false, status: 401, error: "先に参加用QRから入ってください" };
  }
  const game = await lookupPlayGameByJoinToken(db, joinToken);
  if (!game) return { ok: false, status: 404, error: "ゲームが見つかりません" };

  const { data } = await db
    .from("organizer_game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .maybeSingle();
  if (!data) return { ok: false, status: 401, error: "再開できませんでした" };

  const player = data as PlayerRow;
  if (player.auth_epoch !== game.playEpoch) {
    return { ok: false, status: 401, error: "合言葉がリセットされました。参加用QRから入り直してください" };
  }
  const audience = await playAudienceBlock(db, player.game_id, userId);
  if (audience) return { ok: false, ...audience };

  const rally = await loadRally(db, player.game_id, player.id, playerRound(player));
  const completed = stampRallyCompleted(rally.spots, rally.settings);
  if ((rally.experience?.basics.playLimit ?? "once") !== "repeat") {
    return { ok: false, status: 409, error: "このラリーは1回までです" };
  }
  if (!completed) {
    return { ok: false, status: 409, error: "クリアしてから、もう一周できます" };
  }

  const current = playerRound(player);
  const { data: advanced, error } = await db
    .from("organizer_game_players")
    .update({ play_round: current + 1, last_seen_at: new Date().toISOString() })
    .eq("id", player.id)
    .eq("play_round", current)
    .select("play_round")
    .maybeSingle();
  if (error) {
    if (/play_round/i.test(error.message)) {
      return { ok: false, status: 503, error: "もう一周の準備ができていません" };
    }
    throw error;
  }
  const advancedRound =
    typeof advanced?.play_round === "number" && advanced.play_round > current ? advanced.play_round : null;
  if (!advancedRound) {
    const { data: again } = await db
      .from("organizer_game_players")
      .select("play_round")
      .eq("id", player.id)
      .maybeSingle();
    const latest = playerRound((again ?? {}) as PlayerRow);
    if (latest <= current) {
      return { ok: false, status: 409, error: "もう一周できませんでした" };
    }
    return {
      ok: true,
      session: {
        deviceToken,
        progress: await loadProgress(db, { ...player, play_round: latest }, userId),
      },
    };
  }
  return {
    ok: true,
    session: {
      deviceToken,
      progress: await loadProgress(db, { ...player, play_round: advancedRound }, userId),
    },
  };
}

export async function stampPlaySpot(
  db: SupabaseClient,
  spotToken: string,
  deviceToken: string,
  keywordRaw?: string,
  hereRaw?: { lat?: unknown; lng?: unknown },
  userId: string | null = null,
): Promise<
  | { ok: true; result: PlayStampResult }
  | {
      ok: false;
      status: number;
      error: string;
      joinPath?: string;
      code?:
        | "keyword_required"
        | "keyword_mismatch"
        | "gps_required"
        | "gps_far"
        | "audience_login"
        | "audience_closed";
      progress?: PlayProgress;
    }
> {
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
  if (!(await playGamePublished(db, spotRow.game_id as string))) {
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
  const audience = await playAudienceBlock(db, player.game_id, userId);
  if (audience) {
    return { ok: false, status: audience.status, error: audience.error, code: audience.code, joinPath };
  }
  if (player.auth_epoch !== playEpoch) {
    return {
      ok: false,
      status: 401,
      error: "合言葉がリセットされました。参加用QRから入り直してください",
      joinPath,
    };
  }

  const rally = await loadRally(db, spotRow.game_id as string, player.id, playerRound(player));
  const target = rally.spots.find((spot) => spot.id === spotRow.id);
  if (!target) {
    return { ok: false, status: 404, error: "このスポットは、いま公開されていません", joinPath };
  }
  const blocked = orderedStampBlock(rally.spots, spotRow.id as string, rally.route);
  if (blocked) {
    return { ok: false, status: 409, error: blocked, joinPath };
  }
  if (target.checkin === "keyword" && target.keyword.trim() && !target.stamped) {
    const attempt = typeof keywordRaw === "string" ? keywordRaw.slice(0, 40) : "";
    if (!rallyKeywordMatches(target.keyword, attempt)) {
      return {
        ok: false,
        status: 422,
        error: attempt.trim() ? "キーワードが違います" : "キーワードを入れてください",
        code: attempt.trim() ? "keyword_mismatch" : "keyword_required",
        joinPath,
        progress: await loadProgress(db, player, userId),
      };
    }
  }
  if (target.checkin === "gps" && target.lat != null && target.lng != null && !target.stamped) {
    const here = sanitizePlace(hereRaw?.lat, hereRaw?.lng);
    const decision = rallyGpsDecision(
      { lat: target.lat, lng: target.lng, radiusM: target.radiusM },
      here,
    );
    if (!decision.ok) {
      return {
        ok: false,
        status: 422,
        error:
          decision.code === "gps_required"
            ? "現在地を確認してから、スタンプを押してください"
            : decision.message,
        code: decision.code,
        joinPath,
        progress: await loadProgress(db, player, userId),
      };
    }
  }

  let { error: stampError } = await db.from("organizer_game_stamps").insert({
    player_id: player.id,
    spot_id: spotRow.id,
    round: playerRound(player),
  });
  if (stampError && /round/i.test(stampError.message)) {
    const retry = await db.from("organizer_game_stamps").insert({
      player_id: player.id,
      spot_id: spotRow.id,
    });
    stampError = retry.error;
  }
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
      progress: await loadProgress(db, player, userId),
    },
  };
}

export type OrganizerCouponPlayer = {
  id: string;
  nickname: string;
  usedAt: string | null;
  code?: string | null;
};

export type OrganizerCouponDesk = {
  enabled: boolean;
  ready: boolean;
  players: OrganizerCouponPlayer[];
};

function missingCouponColumn(message: string): boolean {
  return /coupon_used_at/i.test(message);
}

export async function listOrganizerCouponPlayers(
  supabase: SupabaseClient,
  gameId: string,
): Promise<OrganizerCouponDesk> {
  const hidden: OrganizerCouponDesk = { enabled: false, ready: true, players: [] };
  const { data: gameRow, error: gameError } = await supabase
    .from("organizer_games")
    .select("type, settings")
    .eq("id", gameId)
    .maybeSingle();
  if (gameError || !gameRow) return hidden;
  const settings = (gameRow as { settings?: unknown }).settings ?? null;
  if (gameRow.type === "coupon") {
    const stored = readStoredCoupon(settings);
    if (!stored?.autoGrant) return hidden;
    const { data: couponRows, error: couponError } = await supabase
      .from("organizer_game_players")
      .select("id, nickname, coupon_used_at, coupon_done, coupon_code")
      .eq("game_id", gameId);
    if (couponError) {
      if (missingCouponColumn(couponError.message)) {
        return { enabled: true, ready: false, players: [] };
      }
      throw couponError;
    }
    const couponPlayers = (couponRows ?? []) as {
      id: string;
      nickname: string;
      coupon_used_at?: string | null;
      coupon_done?: number[] | null;
      coupon_code?: string | null;
    }[];
    const clearedCoupons: OrganizerCouponPlayer[] = [];
    for (const player of couponPlayers) {
      const done = normalizeCouponDone(player.coupon_done, stored.stores.length);
      if (done.length < stored.needed) continue;
      clearedCoupons.push({
        id: player.id,
        nickname: player.nickname,
        usedAt: player.coupon_used_at || null,
        code: player.coupon_code || null,
      });
    }
    clearedCoupons.sort((a, b) => {
      if (Boolean(a.usedAt) !== Boolean(b.usedAt)) return a.usedAt ? 1 : -1;
      return a.nickname.localeCompare(b.nickname, "ja");
    });
    return { enabled: true, ready: true, players: clearedCoupons };
  }
  if (gameRow.type === "quiz") {
    const storedQuiz = readStoredQuiz(settings);
    if (!storedQuiz?.couponOn) return hidden;
    const { data: quizRows, error: quizError } = await supabase
      .from("organizer_game_players")
      .select("id, nickname, coupon_used_at, quiz_solved, coupon_code")
      .eq("game_id", gameId);
    if (quizError) {
      if (missingCouponColumn(quizError.message)) {
        return { enabled: true, ready: false, players: [] };
      }
      throw quizError;
    }
    const quizPlayers = (quizRows ?? []) as {
      id: string;
      nickname: string;
      coupon_used_at?: string | null;
      quiz_solved?: number[] | null;
      coupon_code?: string | null;
    }[];
    const clearedQuiz: OrganizerCouponPlayer[] = [];
    for (const player of quizPlayers) {
      const solved = normalizeQuizSolved(player.quiz_solved, storedQuiz.questions.length);
      if (solved.length < storedQuiz.clearCount) continue;
      clearedQuiz.push({
        id: player.id,
        nickname: player.nickname,
        usedAt: player.coupon_used_at || null,
        code: player.coupon_code || null,
      });
    }
    clearedQuiz.sort((a, b) => {
      if (Boolean(a.usedAt) !== Boolean(b.usedAt)) return a.usedAt ? 1 : -1;
      return a.nickname.localeCompare(b.nickname, "ja");
    });
    return { enabled: true, ready: true, players: clearedQuiz };
  }
  if (gameRow.type !== "stamp") return hidden;
  const experience =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? sanitizeGameExperience((settings as { experience?: unknown }).experience)
      : null;
  if (!experience || experience.reward.kind !== "coupon") return hidden;

  const { data: playerRows, error: playerError } = await supabase
    .from("organizer_game_players")
    .select("id, nickname, coupon_used_at, play_round")
    .eq("game_id", gameId);
  if (playerError) {
    if (missingCouponColumn(playerError.message)) {
      return { enabled: true, ready: false, players: [] };
    }
    throw playerError;
  }

  const { data: spotRows, error: spotError } = await supabase
    .from("organizer_game_spots")
    .select("id, name, kind")
    .eq("game_id", gameId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (spotError) throw spotError;

  const players = (playerRows ?? []) as {
    id: string;
    nickname: string;
    coupon_used_at?: string | null;
    play_round?: number | null;
  }[];
  const ids = players.map((player) => player.id);
  const stampedByPlayer = new Map<string, Set<string>>();
  if (ids.length > 0) {
    const { data: stampRows, error: stampError } = await supabase
      .from("organizer_game_stamps")
      .select("player_id, spot_id, round")
      .in("player_id", ids);
    if (stampError) throw stampError;
    const roundByPlayer = new Map(players.map((player) => [player.id, playerRound(player)]));
    for (const row of stampRows ?? []) {
      const playerId = row.player_id as string;
      const stampRound = typeof row.round === "number" && row.round > 0 ? row.round : 1;
      if (stampRound !== (roundByPlayer.get(playerId) ?? 1)) continue;
      const set = stampedByPlayer.get(playerId) ?? new Set<string>();
      set.add(row.spot_id as string);
      stampedByPlayer.set(playerId, set);
    }
  }

  const cleared: OrganizerCouponPlayer[] = [];
  for (const player of players) {
    const spots = (spotRows ?? []).flatMap((row, index) => {
      const meta = experience.spots[index];
      if (meta && !meta.published) return [];
      return [
        {
          stamped: stampedByPlayer.get(player.id)?.has(row.id as string) ?? false,
          required: meta ? meta.required : true,
        },
      ];
    });
    if (!stampRallyCompleted(spots, settings) && playerRound(player) < 2) continue;
    cleared.push({
      id: player.id,
      nickname: player.nickname,
      usedAt: player.coupon_used_at || null,
    });
  }
  cleared.sort((a, b) => {
    if (Boolean(a.usedAt) !== Boolean(b.usedAt)) return a.usedAt ? 1 : -1;
    return a.nickname.localeCompare(b.nickname, "ja");
  });
  return { enabled: true, ready: true, players: cleared };
}

export async function markOrganizerCouponUsed(
  supabase: SupabaseClient,
  gameId: string,
  playerId: string,
): Promise<
  { ok: true; player: OrganizerCouponPlayer } | { ok: false; status: number; error: string }
> {
  const desk = await listOrganizerCouponPlayers(supabase, gameId);
  if (!desk.enabled) return { ok: false, status: 400, error: "このゲームにクーポンはありません" };
  if (!desk.ready) return { ok: false, status: 503, error: "使用記録の準備ができていません" };
  const target = desk.players.find((player) => player.id === playerId);
  if (!target) return { ok: false, status: 409, error: "クリアした参加者が見つかりません" };
  if (target.usedAt) return { ok: true, player: target };

  const admin = getPlayDb();
  if (!admin) return { ok: false, status: 500, error: "使用済みにできませんでした" };
  const usedAt = new Date().toISOString();
  const { data, error } = await admin
    .from("organizer_game_players")
    .update({ coupon_used_at: usedAt })
    .eq("id", playerId)
    .eq("game_id", gameId)
    .is("coupon_used_at", null)
    .select("id, nickname, coupon_used_at")
    .maybeSingle();
  if (error) {
    if (missingCouponColumn(error.message)) {
      return { ok: false, status: 503, error: "使用記録の準備ができていません" };
    }
    throw error;
  }
  if (!data) {
    const again = await listOrganizerCouponPlayers(supabase, gameId);
    const current = again.players.find((player) => player.id === playerId);
    if (current?.usedAt) return { ok: true, player: current };
    return { ok: false, status: 409, error: "使用済みにできませんでした" };
  }
  return {
    ok: true,
    player: {
      id: data.id as string,
      nickname: (data.nickname as string) ?? target.nickname,
      usedAt: (data.coupon_used_at as string | null) ?? usedAt,
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
