/**
 * 投票ゲームの設定（organizer_games.settings.vote）。
 * 段階は「案を集める → 投票 → 結果」の順で、主催者が切りかえる。
 */

export type VotePhase = "collect" | "vote" | "result";

export const VOTE_PHASES: readonly { id: VotePhase; label: string; description: string }[] = [
  { id: "collect", label: "案を集める", description: "参加者が自由に案を送れます" },
  { id: "vote", label: "投票", description: "主催者が選んだ候補から投票できます" },
  { id: "result", label: "結果発表", description: "票の数と1位を見られます" },
];

export type VoteSettings = {
  /** お題（例：「マスコットの名前を考えてください」） */
  prompt: string;
  /** 案を書くときのヒント */
  guide: string;
  /** 1人が送れる案の数（1〜5） */
  maxIdeasPerPlayer: number;
  /** 1人が入れられる票の数（1〜3） */
  votesPerPlayer: number;
  /** 案に理由・ひとことを添えられるか */
  allowNote: boolean;
  phase: VotePhase;
};

export const VOTE_BODY_MAX = 40;
export const VOTE_NOTE_MAX = 120;

export const DEFAULT_VOTE_SETTINGS: VoteSettings = {
  prompt: "",
  guide: "",
  maxIdeasPerPlayer: 3,
  votesPerPlayer: 1,
  allowNote: true,
  phase: "collect",
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function isVotePhase(value: unknown): value is VotePhase {
  return value === "collect" || value === "vote" || value === "result";
}

/** 保存する前・読んだあとに、いつも同じ形にそろえる */
export function sanitizeVoteSettings(raw: unknown): VoteSettings {
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    prompt: text(body.prompt, 80),
    guide: text(body.guide, 200),
    maxIdeasPerPlayer: clampInt(body.maxIdeasPerPlayer, 1, 5, DEFAULT_VOTE_SETTINGS.maxIdeasPerPlayer),
    votesPerPlayer: clampInt(body.votesPerPlayer, 1, 3, DEFAULT_VOTE_SETTINGS.votesPerPlayer),
    allowNote: typeof body.allowNote === "boolean" ? body.allowNote : DEFAULT_VOTE_SETTINGS.allowNote,
    phase: isVotePhase(body.phase) ? body.phase : DEFAULT_VOTE_SETTINGS.phase,
  };
}

/** ゲームの settings から投票の設定を取り出す。お題がなければ null */
export function readStoredVote(settings: unknown): VoteSettings | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const vote = sanitizeVoteSettings((settings as { vote?: unknown }).vote);
  return vote.prompt ? vote : null;
}

/** 案の文字をそろえる。空なら null */
export function normalizeVoteBody(value: unknown): string | null {
  const body = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!body) return null;
  return body.slice(0, VOTE_BODY_MAX);
}

export function normalizeVoteNote(value: unknown): string | null {
  const note = typeof value === "string" ? value.trim() : "";
  return note ? note.slice(0, VOTE_NOTE_MAX) : null;
}

/** 同じ案かどうか（大文字小文字・空白・ひらがな/カタカナの違いは見ない） */
export function voteBodyKey(body: string): string {
  return body
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

export type VoteTally = { ideaId: string; body: string; votes: number; rank: number };

/** 票を数えて順位をつける（同じ票数は同じ順位） */
export function rankVoteTally(rows: { ideaId: string; body: string; votes: number }[]): VoteTally[] {
  const sorted = [...rows].sort((a, b) => b.votes - a.votes || a.body.localeCompare(b.body, "ja"));
  let rank = 0;
  let prev = -1;
  return sorted.map((row, index) => {
    if (row.votes !== prev) {
      rank = index + 1;
      prev = row.votes;
    }
    return { ...row, rank };
  });
}

/** 参加の最初の画面に出す投票の情報（お題と段階だけ） */
export type PublicVoteIntro = { prompt: string; phase: VotePhase };

export function readPublicVoteIntro(raw: unknown): PublicVoteIntro | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as { prompt?: unknown; phase?: unknown };
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return null;
  return { prompt, phase: isVotePhase(body.phase) ? body.phase : "collect" };
}
