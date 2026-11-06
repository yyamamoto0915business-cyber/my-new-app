import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  pickRandom,
  sanitizeLotterySettings,
  type LotteryPhase,
  type LotteryPrize,
} from "@/lib/organizer/lottery";

type Fail = { ok: false; status: number; error: string };

/** 抽選はサーバーの暗号用の乱数で行う（Math.random より予想しにくい） */
const secureRandom = () => randomInt(0, 2 ** 32) / 2 ** 32;

type WinRow = {
  id: string;
  player_id: string;
  prize_index: number;
  prize_label: string;
  created_at: string;
};

async function readSettings(db: SupabaseClient, gameId: string) {
  const { data } = await db.from("organizer_games").select("settings").eq("id", gameId).maybeSingle();
  const raw = (data as { settings?: unknown } | null)?.settings;
  const settings = raw && typeof raw === "object" && !Array.isArray(raw) ? { ...(raw as Record<string, unknown>) } : {};
  return { settings, lottery: sanitizeLotterySettings(settings.lottery) };
}

async function loadWins(db: SupabaseClient, gameId: string): Promise<WinRow[]> {
  const { data, error } = await db
    .from("organizer_lottery_wins")
    .select("id, player_id, prize_index, prize_label, created_at")
    .eq("game_id", gameId)
    .eq("voided", false)
    .order("prize_index", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WinRow[];
}

async function loadPlayers(db: SupabaseClient, gameId: string): Promise<{ id: string; nickname: string }[]> {
  const { data, error } = await db
    .from("organizer_game_players")
    .select("id, nickname")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true })
    .limit(5000);
  if (error) throw error;
  return (data ?? []) as { id: string; nickname: string }[];
}

/* ───────── 参加者 ───────── */

export type LotteryPlayState = {
  phase: LotteryPhase;
  prizes: LotteryPrize[];
  entrants: number;
  /** 参加した順の番号（1から） */
  entryNumber: number | null;
  /** 結果発表のときだけ入る */
  result: null | {
    won: { prizeLabel: string } | null;
    winnerMessage: string;
    winners: { prizeLabel: string; nicknames: string[] }[];
  };
};

export async function loadLotteryPlayState(
  db: SupabaseClient,
  gameId: string,
  playerId: string,
): Promise<LotteryPlayState | null> {
  const { lottery } = await readSettings(db, gameId);
  if (lottery.prizes.length === 0) return null;
  const players = await loadPlayers(db, gameId);
  const index = players.findIndex((p) => p.id === playerId);
  const base = {
    phase: lottery.phase,
    prizes: lottery.prizes,
    entrants: players.length,
    entryNumber: index >= 0 ? index + 1 : null,
  };
  if (lottery.phase !== "result") return { ...base, result: null };

  const wins = await loadWins(db, gameId);
  const nameById = new Map(players.map((p) => [p.id, p.nickname]));
  const mine = wins.find((w) => w.player_id === playerId) ?? null;
  return {
    ...base,
    result: {
      won: mine ? { prizeLabel: mine.prize_label } : null,
      // 当選の案内は、当たった人にだけ見せる
      winnerMessage: mine ? lottery.winnerMessage : "",
      winners: lottery.prizes.map((prize, i) => ({
        prizeLabel: prize.label,
        nicknames: wins.filter((w) => w.prize_index === i).map((w) => nameById.get(w.player_id) ?? "参加者"),
      })),
    },
  };
}

/* ───────── 主催者 ───────── */

export type LotteryAdminState = {
  phase: LotteryPhase;
  prizes: (LotteryPrize & {
    winners: { winId: string; playerId: string; nickname: string; entryNumber: number }[];
  })[];
  entrants: { id: string; nickname: string; entryNumber: number; winning: string | null }[];
  /** まだ当たっていない人の数 */
  remaining: number;
};

export async function loadLotteryAdminState(db: SupabaseClient, gameId: string): Promise<LotteryAdminState> {
  const [{ lottery }, players, wins] = await Promise.all([
    readSettings(db, gameId),
    loadPlayers(db, gameId),
    loadWins(db, gameId),
  ]);
  const numberById = new Map(players.map((p, i) => [p.id, i + 1]));
  const nameById = new Map(players.map((p) => [p.id, p.nickname]));
  const prizeByPlayer = new Map(wins.map((w) => [w.player_id, w.prize_label]));
  return {
    phase: lottery.phase,
    prizes: lottery.prizes.map((prize, i) => ({
      ...prize,
      winners: wins
        .filter((w) => w.prize_index === i)
        .map((w) => ({
          winId: w.id,
          playerId: w.player_id,
          nickname: nameById.get(w.player_id) ?? "参加者",
          entryNumber: numberById.get(w.player_id) ?? 0,
        })),
    })),
    entrants: players.map((p, i) => ({
      id: p.id,
      nickname: p.nickname,
      entryNumber: i + 1,
      winning: prizeByPlayer.get(p.id) ?? null,
    })),
    remaining: players.filter((p) => !prizeByPlayer.has(p.id)).length,
  };
}

/** 賞の空いている枠の数だけ、まだ当たっていない人からランダムに選ぶ */
export async function drawLotteryPrize(
  db: SupabaseClient,
  gameId: string,
  prizeIndex: number,
): Promise<{ ok: true; drawn: number } | Fail> {
  const { lottery } = await readSettings(db, gameId);
  const prize = lottery.prizes[prizeIndex];
  if (!prize) return { ok: false, status: 404, error: "賞が見つかりません" };
  const [players, wins] = await Promise.all([loadPlayers(db, gameId), loadWins(db, gameId)]);
  const open = prize.count - wins.filter((w) => w.prize_index === prizeIndex).length;
  if (open <= 0) return { ok: false, status: 409, error: "この賞の当選者は、もう決まっています" };
  // 前に「引き直し」で外れた人も、もう一度選ばれないようにする
  const { data: voidedRows } = await db
    .from("organizer_lottery_wins")
    .select("player_id")
    .eq("game_id", gameId)
    .eq("voided", true);
  const excluded = new Set([
    ...wins.map((w) => w.player_id),
    ...((voidedRows ?? []) as { player_id: string }[]).map((r) => r.player_id),
  ]);
  const pool = players.filter((p) => !excluded.has(p.id));
  if (pool.length === 0) return { ok: false, status: 409, error: "抽選できる参加者がいません" };
  const picked = pickRandom(pool, open, secureRandom);
  const { error } = await db.from("organizer_lottery_wins").insert(
    picked.map((p) => ({ game_id: gameId, player_id: p.id, prize_index: prizeIndex, prize_label: prize.label })),
  );
  if (error) {
    // 同時に2回押されたときなど（1人1つまでの決まりにぶつかった）
    if (error.code === "23505") return { ok: false, status: 409, error: "もう一度押してください" };
    throw error;
  }
  return { ok: true, drawn: picked.length };
}

/** 当選を取り消す（その場にいなかったときなど）。そのあと同じ賞をもう一度抽選すれば、空いた枠が埋まる */
export async function voidLotteryWin(
  db: SupabaseClient,
  gameId: string,
  winId: string,
): Promise<{ ok: true } | Fail> {
  const { data, error } = await db
    .from("organizer_lottery_wins")
    .update({ voided: true })
    .eq("id", winId)
    .eq("game_id", gameId)
    .eq("voided", false)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) return { ok: false, status: 404, error: "当選が見つかりません" };
  return { ok: true };
}

/** はじめからやり直す（当選をすべて消し、受付中に戻す） */
export async function resetLottery(db: SupabaseClient, gameId: string): Promise<{ ok: true }> {
  const { error } = await db.from("organizer_lottery_wins").delete().eq("game_id", gameId);
  if (error) throw error;
  await setLotteryPhase(db, gameId, "entry");
  return { ok: true };
}

export async function setLotteryPhase(
  db: SupabaseClient,
  gameId: string,
  phase: LotteryPhase,
): Promise<{ ok: true } | Fail> {
  const { settings, lottery } = await readSettings(db, gameId);
  if (phase === "result") {
    const wins = await loadWins(db, gameId);
    if (wins.length === 0) return { ok: false, status: 409, error: "先に抽選してください" };
  }
  settings.lottery = { ...lottery, phase };
  const { error } = await db.from("organizer_games").update({ settings }).eq("id", gameId);
  if (error) throw error;
  return { ok: true };
}
