import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TOURNAMENT_NAME_MAX,
  buildTournamentView,
  checkMatchResult,
  sanitizeTournamentSettings,
  type MatchResult,
  type TournamentView,
} from "@/lib/organizer/tournament";

type Fail = { ok: false; status: number; error: string };

async function readSettings(db: SupabaseClient, gameId: string) {
  const { data } = await db.from("organizer_games").select("settings").eq("id", gameId).maybeSingle();
  const raw = (data as { settings?: unknown } | null)?.settings;
  const settings = raw && typeof raw === "object" && !Array.isArray(raw) ? { ...(raw as Record<string, unknown>) } : {};
  return { settings, tournament: sanitizeTournamentSettings(settings.tournament) };
}

async function loadResults(db: SupabaseClient, gameId: string): Promise<Record<string, MatchResult>> {
  const { data, error } = await db
    .from("organizer_tournament_results")
    .select("match_key, winner, score_a, score_b")
    .eq("game_id", gameId);
  if (error) throw error;
  const out: Record<string, MatchResult> = {};
  for (const row of (data ?? []) as { match_key: string; winner: number | null; score_a: number | null; score_b: number | null }[]) {
    out[row.match_key] = { winner: row.winner, scoreA: row.score_a, scoreB: row.score_b };
  }
  return out;
}

/** 今の対戦表（参加者にも主催者にも同じものを見せる） */
export async function loadTournamentView(db: SupabaseClient, gameId: string): Promise<TournamentView | null> {
  const [{ tournament }, results] = await Promise.all([readSettings(db, gameId), loadResults(db, gameId)]);
  if (tournament.entrants.length < 2) return null;
  return buildTournamentView(tournament, results);
}

/** 試合の結果を入れる・直す */
export async function setTournamentResult(
  db: SupabaseClient,
  gameId: string,
  key: string,
  raw: { winner?: unknown; draw?: unknown; scoreA?: unknown; scoreB?: unknown },
): Promise<{ ok: true } | Fail> {
  const view = await loadTournamentView(db, gameId);
  if (!view) return { ok: false, status: 404, error: "トーナメントが見つかりません" };
  const checked = checkMatchResult(view, key, raw);
  if (!checked.ok) return { ok: false, status: 400, error: checked.error };
  const { error } = await db.from("organizer_tournament_results").upsert(
    {
      game_id: gameId,
      match_key: key,
      winner: checked.result.winner,
      score_a: checked.result.scoreA,
      score_b: checked.result.scoreB,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "game_id,match_key" },
  );
  if (error) throw error;
  return { ok: true };
}

/** 試合の結果を消す（入れまちがいのとき） */
export async function clearTournamentResult(db: SupabaseClient, gameId: string, key: string): Promise<{ ok: true }> {
  const { error } = await db.from("organizer_tournament_results").delete().eq("game_id", gameId).eq("match_key", key);
  if (error) throw error;
  return { ok: true };
}

/** 出場者の名前を直す（人数と並びは変えない。変えると組み合わせが変わるため） */
export async function renameTournamentEntrant(
  db: SupabaseClient,
  gameId: string,
  index: number,
  name: unknown,
): Promise<{ ok: true } | Fail> {
  const { settings, tournament } = await readSettings(db, gameId);
  const next = typeof name === "string" ? name.replace(/\s+/g, " ").trim().slice(0, TOURNAMENT_NAME_MAX) : "";
  if (!next) return { ok: false, status: 400, error: "名前を入れてください" };
  if (!Number.isInteger(index) || index < 0 || index >= tournament.entrants.length) {
    return { ok: false, status: 404, error: "出場者が見つかりません" };
  }
  const entrants = [...tournament.entrants];
  entrants[index] = next;
  settings.tournament = { ...tournament, entrants };
  const { error } = await db.from("organizer_games").update({ settings }).eq("id", gameId);
  if (error) throw error;
  return { ok: true };
}

/** 結果をすべて消して、はじめからにする */
export async function resetTournament(db: SupabaseClient, gameId: string): Promise<{ ok: true }> {
  const { error } = await db.from("organizer_tournament_results").delete().eq("game_id", gameId);
  if (error) throw error;
  return { ok: true };
}
