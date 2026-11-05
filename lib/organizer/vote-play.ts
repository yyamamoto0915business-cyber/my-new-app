/**
 * 投票ゲームの読み書き（サーバー専用・サービスロールの DB を使う）。
 * 参加者の操作は resolvePlayPlayer で確かめた人として行い、主催者の操作は持ち主のゲームだけに行う。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeVoteBody,
  normalizeVoteNote,
  rankVoteTally,
  readStoredVote,
  sanitizeVoteSettings,
  voteBodyKey,
  type VotePhase,
  type VoteSettings,
  type VoteTally,
} from "@/lib/organizer/vote";

/** これだけ通報されたら、主催者が見るまで自動で隠す */
const AUTO_HIDE_REPORTS = 3;

type IdeaRow = {
  id: string;
  player_id: string | null;
  nickname: string | null;
  body: string;
  note: string | null;
  hidden: boolean;
  is_candidate: boolean;
  report_count: number;
  created_at: string;
};

export type VoteIdeaView = { id: string; body: string; note: string | null; nickname: string | null; mine: boolean };

export type VotePlayState = {
  phase: VotePhase;
  prompt: string;
  guide: string;
  maxIdeasPerPlayer: number;
  votesPerPlayer: number;
  allowNote: boolean;
  /** 自分が送った案（隠されたものは出さない） */
  myIdeas: VoteIdeaView[];
  /** 届いている案の数（隠されたものは数えない） */
  ideaCount: number;
  /** 投票・結果のときの候補 */
  candidates: VoteIdeaView[];
  /** 自分が票を入れた候補 */
  myVotes: string[];
  /** 結果発表のときだけ */
  results: VoteTally[] | null;
};

async function loadSettings(db: SupabaseClient, gameId: string): Promise<VoteSettings | null> {
  const { data } = await db.from("organizer_games").select("settings").eq("id", gameId).maybeSingle();
  return readStoredVote((data as { settings?: unknown } | null)?.settings);
}

async function loadIdeas(db: SupabaseClient, gameId: string): Promise<IdeaRow[]> {
  const { data, error } = await db
    .from("organizer_vote_ideas")
    .select("id, player_id, nickname, body, note, hidden, is_candidate, report_count, created_at")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as IdeaRow[];
}

async function loadVoteCounts(db: SupabaseClient, gameId: string): Promise<Map<string, number>> {
  const { data, error } = await db.from("organizer_vote_ballots").select("idea_id").eq("game_id", gameId);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { idea_id: string }[]) {
    counts.set(row.idea_id, (counts.get(row.idea_id) ?? 0) + 1);
  }
  return counts;
}

function view(row: IdeaRow, playerId: string | null): VoteIdeaView {
  return { id: row.id, body: row.body, note: row.note, nickname: row.nickname, mine: row.player_id === playerId };
}

function tally(ideas: IdeaRow[], counts: Map<string, number>): VoteTally[] {
  return rankVoteTally(
    ideas
      .filter((idea) => idea.is_candidate && !idea.hidden)
      .map((idea) => ({ ideaId: idea.id, body: idea.body, votes: counts.get(idea.id) ?? 0 })),
  );
}

/** 参加者に見せる今の状態 */
export async function loadVotePlayState(
  db: SupabaseClient,
  gameId: string,
  playerId: string,
): Promise<VotePlayState | null> {
  const settings = await loadSettings(db, gameId);
  if (!settings) return null;
  const ideas = await loadIdeas(db, gameId);
  const visible = ideas.filter((idea) => !idea.hidden);
  const candidates = visible.filter((idea) => idea.is_candidate);

  const { data: ballots, error } = await db
    .from("organizer_vote_ballots")
    .select("idea_id")
    .eq("game_id", gameId)
    .eq("player_id", playerId);
  if (error) throw error;

  return {
    phase: settings.phase,
    prompt: settings.prompt,
    guide: settings.guide,
    maxIdeasPerPlayer: settings.maxIdeasPerPlayer,
    votesPerPlayer: settings.votesPerPlayer,
    allowNote: settings.allowNote,
    myIdeas: visible.filter((idea) => idea.player_id === playerId).map((idea) => view(idea, playerId)),
    ideaCount: visible.length,
    candidates: settings.phase === "collect" ? [] : candidates.map((idea) => view(idea, playerId)),
    myVotes: ((ballots ?? []) as { idea_id: string }[]).map((row) => row.idea_id),
    results: settings.phase === "result" ? tally(ideas, await loadVoteCounts(db, gameId)) : null,
  };
}

type Fail = { ok: false; status: number; error: string };

/** 案を送る（案を集めるあいだだけ） */
export async function submitVoteIdea(
  db: SupabaseClient,
  gameId: string,
  player: { id: string; nickname: string },
  input: { body: unknown; note: unknown },
): Promise<{ ok: true } | Fail> {
  const settings = await loadSettings(db, gameId);
  if (!settings) return { ok: false, status: 404, error: "投票が見つかりません" };
  if (settings.phase !== "collect") return { ok: false, status: 409, error: "案の受付は終わりました" };
  const body = normalizeVoteBody(input.body);
  if (!body) return { ok: false, status: 400, error: "案を入力してください" };
  const note = settings.allowNote ? normalizeVoteNote(input.note) : null;

  const ideas = await loadIdeas(db, gameId);
  const mine = ideas.filter((idea) => idea.player_id === player.id && !idea.hidden);
  if (mine.length >= settings.maxIdeasPerPlayer) {
    return { ok: false, status: 409, error: `案は1人${settings.maxIdeasPerPlayer}つまでです` };
  }
  const key = voteBodyKey(body);
  if (mine.some((idea) => voteBodyKey(idea.body) === key)) {
    return { ok: false, status: 409, error: "同じ案はもう送っています" };
  }

  const { error } = await db.from("organizer_vote_ideas").insert({
    game_id: gameId,
    player_id: player.id,
    nickname: player.nickname || null,
    body,
    note,
  });
  if (error) throw error;
  return { ok: true };
}

/** 自分の案を取り消す（案を集めるあいだだけ） */
export async function deleteVoteIdea(
  db: SupabaseClient,
  gameId: string,
  playerId: string,
  ideaId: string,
): Promise<{ ok: true } | Fail> {
  const settings = await loadSettings(db, gameId);
  if (!settings) return { ok: false, status: 404, error: "投票が見つかりません" };
  if (settings.phase !== "collect") return { ok: false, status: 409, error: "案の受付は終わりました" };
  const { error } = await db
    .from("organizer_vote_ideas")
    .delete()
    .eq("id", ideaId)
    .eq("game_id", gameId)
    .eq("player_id", playerId);
  if (error) throw error;
  return { ok: true };
}

/** 候補に票を入れる・取り消す（投票のあいだだけ） */
export async function toggleVoteBallot(
  db: SupabaseClient,
  gameId: string,
  playerId: string,
  ideaId: string,
): Promise<{ ok: true; voted: boolean } | Fail> {
  const settings = await loadSettings(db, gameId);
  if (!settings) return { ok: false, status: 404, error: "投票が見つかりません" };
  if (settings.phase !== "vote") return { ok: false, status: 409, error: "いまは投票できません" };

  const { data: idea } = await db
    .from("organizer_vote_ideas")
    .select("id, hidden, is_candidate")
    .eq("id", ideaId)
    .eq("game_id", gameId)
    .maybeSingle();
  if (!idea || idea.hidden || !idea.is_candidate) {
    return { ok: false, status: 404, error: "候補が見つかりません" };
  }

  const { data: existing, error } = await db
    .from("organizer_vote_ballots")
    .select("id, idea_id")
    .eq("game_id", gameId)
    .eq("player_id", playerId);
  if (error) throw error;
  const mine = (existing ?? []) as { id: string; idea_id: string }[];
  const already = mine.find((row) => row.idea_id === ideaId);
  if (already) {
    const { error: delError } = await db.from("organizer_vote_ballots").delete().eq("id", already.id);
    if (delError) throw delError;
    return { ok: true, voted: false };
  }
  if (mine.length >= settings.votesPerPlayer) {
    // 1票だけのときは、入れ直しやすいよう前の票を取り消して入れかえる
    if (settings.votesPerPlayer === 1 && mine[0]) {
      const { error: delError } = await db.from("organizer_vote_ballots").delete().eq("id", mine[0].id);
      if (delError) throw delError;
    } else {
      return { ok: false, status: 409, error: `票は1人${settings.votesPerPlayer}票までです` };
    }
  }
  const { error: insError } = await db
    .from("organizer_vote_ballots")
    .insert({ game_id: gameId, player_id: playerId, idea_id: ideaId });
  if (insError) throw insError;
  return { ok: true, voted: true };
}

/** ほかの人の案を通報する。何人かに通報されたら、主催者が見るまで隠す */
export async function reportVoteIdea(
  db: SupabaseClient,
  gameId: string,
  playerId: string,
  ideaId: string,
): Promise<{ ok: true } | Fail> {
  const { data: idea } = await db
    .from("organizer_vote_ideas")
    .select("id, player_id")
    .eq("id", ideaId)
    .eq("game_id", gameId)
    .maybeSingle();
  if (!idea) return { ok: false, status: 404, error: "案が見つかりません" };
  if (idea.player_id === playerId) return { ok: false, status: 400, error: "自分の案は通報できません" };

  const { error } = await db
    .from("organizer_vote_reports")
    .upsert({ idea_id: ideaId, player_id: playerId }, { onConflict: "idea_id,player_id", ignoreDuplicates: true });
  if (error) throw error;
  const { count } = await db
    .from("organizer_vote_reports")
    .select("idea_id", { count: "exact", head: true })
    .eq("idea_id", ideaId);
  const reports = count ?? 0;
  const { error: updError } = await db
    .from("organizer_vote_ideas")
    .update({ report_count: reports, ...(reports >= AUTO_HIDE_REPORTS ? { hidden: true } : {}) })
    .eq("id", ideaId);
  if (updError) throw updError;
  return { ok: true };
}

// ─── 主催者 ───────────────────────────────────────────────

export type VoteAdminIdea = {
  id: string;
  body: string;
  note: string | null;
  nickname: string | null;
  fromOrganizer: boolean;
  hidden: boolean;
  isCandidate: boolean;
  reportCount: number;
  votes: number;
  createdAt: string;
};

export type VoteAdminState = {
  settings: VoteSettings;
  ideas: VoteAdminIdea[];
  /** 投票した人の数 */
  voterCount: number;
  results: VoteTally[];
};

export async function loadVoteAdminState(db: SupabaseClient, gameId: string): Promise<VoteAdminState | null> {
  const { data } = await db.from("organizer_games").select("settings").eq("id", gameId).maybeSingle();
  const raw = (data as { settings?: unknown } | null)?.settings;
  const settings = sanitizeVoteSettings(
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as { vote?: unknown }).vote : null,
  );
  const ideas = await loadIdeas(db, gameId);
  const counts = await loadVoteCounts(db, gameId);
  const { data: voters } = await db.from("organizer_vote_ballots").select("player_id").eq("game_id", gameId);
  return {
    settings,
    ideas: ideas
      .map((idea) => ({
        id: idea.id,
        body: idea.body,
        note: idea.note,
        nickname: idea.nickname,
        fromOrganizer: idea.player_id === null,
        hidden: idea.hidden,
        isCandidate: idea.is_candidate,
        reportCount: idea.report_count,
        votes: counts.get(idea.id) ?? 0,
        createdAt: idea.created_at,
      }))
      .reverse(),
    voterCount: new Set(((voters ?? []) as { player_id: string }[]).map((row) => row.player_id)).size,
    results: tally(ideas, counts),
  };
}

/** 案を隠す・戻す、候補にする・外す */
export async function updateVoteIdea(
  db: SupabaseClient,
  gameId: string,
  ideaId: string,
  patch: { hidden?: boolean; isCandidate?: boolean },
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (typeof patch.hidden === "boolean") {
    update.hidden = patch.hidden;
    // 主催者が確かめて戻したら、通報の数もリセットする
    if (!patch.hidden) update.report_count = 0;
  }
  if (typeof patch.isCandidate === "boolean") update.is_candidate = patch.isCandidate;
  if (Object.keys(update).length === 0) return;
  const { error } = await db.from("organizer_vote_ideas").update(update).eq("id", ideaId).eq("game_id", gameId);
  if (error) throw error;
  if (patch.hidden === false) {
    await db.from("organizer_vote_reports").delete().eq("idea_id", ideaId);
  }
}

/** 主催者が候補を足す（そのまま候補になる） */
export async function addVoteCandidate(db: SupabaseClient, gameId: string, bodyRaw: unknown): Promise<{ ok: true } | Fail> {
  const body = normalizeVoteBody(bodyRaw);
  if (!body) return { ok: false, status: 400, error: "候補を入力してください" };
  const { error } = await db
    .from("organizer_vote_ideas")
    .insert({ game_id: gameId, player_id: null, nickname: null, body, is_candidate: true });
  if (error) throw error;
  return { ok: true };
}

/** 段階を切りかえる（案を集める → 投票 → 結果） */
export async function setVotePhase(db: SupabaseClient, gameId: string, phase: VotePhase): Promise<{ ok: true } | Fail> {
  const { data } = await db.from("organizer_games").select("settings").eq("id", gameId).maybeSingle();
  const raw = (data as { settings?: unknown } | null)?.settings;
  const settings = raw && typeof raw === "object" && !Array.isArray(raw) ? { ...(raw as Record<string, unknown>) } : {};
  const vote = sanitizeVoteSettings(settings.vote);
  if (phase === "vote") {
    const { count } = await db
      .from("organizer_vote_ideas")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId)
      .eq("is_candidate", true)
      .eq("hidden", false);
    if ((count ?? 0) < 2) return { ok: false, status: 409, error: "投票をはじめるには、候補を2つ以上選んでください" };
  }
  settings.vote = { ...vote, phase };
  const { error } = await db.from("organizer_games").update({ settings }).eq("id", gameId);
  if (error) throw error;
  return { ok: true };
}
