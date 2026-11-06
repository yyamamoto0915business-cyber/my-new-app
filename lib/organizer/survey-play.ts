import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sanitizeSurveySettings,
  tallySurvey,
  validateSurveyAnswers,
  type SurveyAnswers,
  type SurveyPhase,
  type SurveyQuestion,
  type SurveyTally,
} from "@/lib/organizer/survey";

type Fail = { ok: false; status: number; error: string };

async function readSettings(db: SupabaseClient, gameId: string) {
  const { data } = await db.from("organizer_games").select("settings").eq("id", gameId).maybeSingle();
  const raw = (data as { settings?: unknown } | null)?.settings;
  const settings = raw && typeof raw === "object" && !Array.isArray(raw) ? { ...(raw as Record<string, unknown>) } : {};
  return { settings, survey: sanitizeSurveySettings(settings.survey) };
}

type ResponseRow = { player_id: string; answers: unknown; created_at: string; updated_at: string };

async function loadResponses(db: SupabaseClient, gameId: string): Promise<ResponseRow[]> {
  const { data, error } = await db
    .from("organizer_survey_responses")
    .select("player_id, answers, created_at, updated_at")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true })
    .limit(5000);
  if (error) throw error;
  return (data ?? []) as ResponseRow[];
}

function asAnswers(raw: unknown): SurveyAnswers {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as SurveyAnswers) : {};
}

/** 答えた人に見せてよい集計（自由記述は出さない） */
function publicTally(tally: SurveyTally[]): SurveyTally[] {
  return tally.filter((t) => t.type !== "text");
}

/* ───────── 参加者 ───────── */

export type SurveyPlayState = {
  phase: SurveyPhase;
  questions: SurveyQuestion[];
  thanks: string;
  /** 自分の答え（まだなら null） */
  mine: SurveyAnswers | null;
  /** 答えたあと、主催者が見せる設定にしているときだけ入る */
  results: SurveyTally[] | null;
  responses: number;
};

export async function loadSurveyPlayState(
  db: SupabaseClient,
  gameId: string,
  playerId: string,
): Promise<SurveyPlayState | null> {
  const { survey } = await readSettings(db, gameId);
  if (survey.questions.length === 0) return null;
  const rows = await loadResponses(db, gameId);
  const mineRow = rows.find((r) => r.player_id === playerId);
  const mine = mineRow ? asAnswers(mineRow.answers) : null;
  return {
    phase: survey.phase,
    questions: survey.questions,
    thanks: survey.thanks,
    mine,
    results:
      mine && survey.shareResults
        ? publicTally(tallySurvey(survey.questions, rows.map((r) => asAnswers(r.answers))))
        : null,
    responses: rows.length,
  };
}

export async function submitSurveyAnswers(
  db: SupabaseClient,
  gameId: string,
  playerId: string,
  raw: unknown,
): Promise<{ ok: true } | Fail> {
  const { survey } = await readSettings(db, gameId);
  if (survey.questions.length === 0) return { ok: false, status: 404, error: "アンケートが見つかりません" };
  if (survey.phase !== "open") return { ok: false, status: 409, error: "このアンケートは締め切られました" };
  const checked = validateSurveyAnswers(survey.questions, raw);
  if (!checked.ok) return { ok: false, status: 400, error: checked.error };
  if (Object.keys(checked.answers).length === 0) return { ok: false, status: 400, error: "1つ以上答えてください" };
  const { error } = await db
    .from("organizer_survey_responses")
    .upsert(
      { game_id: gameId, player_id: playerId, answers: checked.answers, updated_at: new Date().toISOString() },
      { onConflict: "game_id,player_id" },
    );
  if (error) throw error;
  return { ok: true };
}

/* ───────── 主催者 ───────── */

export type SurveyAdminState = {
  phase: SurveyPhase;
  shareResults: boolean;
  questions: SurveyQuestion[];
  responses: number;
  tally: SurveyTally[];
  /** CSV 用。答えた順 */
  rows: { nickname: string; answeredAt: string; answers: SurveyAnswers }[];
};

export async function loadSurveyAdminState(db: SupabaseClient, gameId: string): Promise<SurveyAdminState> {
  const [{ survey }, rows] = await Promise.all([readSettings(db, gameId), loadResponses(db, gameId)]);
  const playerIds = rows.map((r) => r.player_id);
  const names = new Map<string, string>();
  if (playerIds.length > 0) {
    const { data } = await db.from("organizer_game_players").select("id, nickname").in("id", playerIds);
    for (const p of (data ?? []) as { id: string; nickname: string }[]) names.set(p.id, p.nickname);
  }
  return {
    phase: survey.phase,
    shareResults: survey.shareResults,
    questions: survey.questions,
    responses: rows.length,
    tally: tallySurvey(survey.questions, rows.map((r) => asAnswers(r.answers))),
    rows: rows.map((r) => ({
      nickname: names.get(r.player_id) ?? "参加者",
      answeredAt: r.updated_at || r.created_at,
      answers: asAnswers(r.answers),
    })),
  };
}

export async function setSurveyPhase(db: SupabaseClient, gameId: string, phase: SurveyPhase): Promise<{ ok: true }> {
  const { settings, survey } = await readSettings(db, gameId);
  settings.survey = { ...survey, phase };
  const { error } = await db.from("organizer_games").update({ settings }).eq("id", gameId);
  if (error) throw error;
  return { ok: true };
}

export async function setSurveyShareResults(db: SupabaseClient, gameId: string, shareResults: boolean): Promise<{ ok: true }> {
  const { settings, survey } = await readSettings(db, gameId);
  settings.survey = { ...survey, shareResults };
  const { error } = await db.from("organizer_games").update({ settings }).eq("id", gameId);
  if (error) throw error;
  return { ok: true };
}
