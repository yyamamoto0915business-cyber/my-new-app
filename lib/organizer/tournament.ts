/**
 * トーナメント表（organizer_games.settings.tournament）と、対戦表・順位の組み立て。
 * 出場者の並びと試合の結果（organizer_tournament_results）から、毎回同じ表を組み立てる。
 * 結果には「勝った人の番号」を残すので、前の試合を直して組み合わせが変わったときは、
 * 合わなくなった結果は自動で使われなくなる。
 */

export type TournamentFormat = "knockout" | "league";

export type TournamentSettings = {
  format: TournamentFormat;
  /** 出場者（チーム・人）の名前。トーナメントでは、この順がシード順 */
  entrants: string[];
};

export const TOURNAMENT_NAME_MAX = 30;
export const TOURNAMENT_KNOCKOUT_MAX = 64;
export const TOURNAMENT_LEAGUE_MAX = 16;
export const TOURNAMENT_SCORE_MAX = 999;

export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  knockout: "トーナメント（勝ち抜き）",
  league: "リーグ戦（総当たり）",
};

export function tournamentEntrantMax(format: TournamentFormat): number {
  return format === "league" ? TOURNAMENT_LEAGUE_MAX : TOURNAMENT_KNOCKOUT_MAX;
}

/** 保存する前・読んだあとに、いつも同じ形にそろえる。空の名前は捨てる */
export function sanitizeTournamentSettings(raw: unknown): TournamentSettings {
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const format: TournamentFormat = body.format === "league" ? "league" : "knockout";
  const entrants = (Array.isArray(body.entrants) ? body.entrants : [])
    .map((v) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, TOURNAMENT_NAME_MAX) : ""))
    .filter(Boolean)
    .slice(0, tournamentEntrantMax(format));
  return { format, entrants };
}

/** ゲームの settings から取り出す。出場者が2人未満なら null */
export function readStoredTournament(settings: unknown): TournamentSettings | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const t = sanitizeTournamentSettings((settings as { tournament?: unknown }).tournament);
  return t.entrants.length >= 2 ? t : null;
}

/** 1試合の結果。winner は勝った出場者の番号（0から）。リーグ戦の引き分けは null */
export type MatchResult = { winner: number | null; scoreA: number | null; scoreB: number | null };

export type TournamentMatch = {
  key: string;
  round: number;
  roundLabel: string;
  /** 出場者の番号。まだ決まっていない（前の試合の結果待ち）ときは null */
  a: number | null;
  b: number | null;
  /** 不戦勝（相手がいない） */
  bye: boolean;
  /** 勝った出場者の番号。引き分けは draw: true */
  winner: number | null;
  draw: boolean;
  scoreA: number | null;
  scoreB: number | null;
  /** 両方の出場者が決まっていて、結果を入れられる */
  playable: boolean;
};

export type TournamentStanding = {
  index: number;
  name: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
  rank: number;
};

export type TournamentView = {
  format: TournamentFormat;
  entrants: string[];
  rounds: { round: number; label: string; matches: TournamentMatch[] }[];
  /** トーナメントの優勝者 */
  champion: number | null;
  /** リーグ戦の順位 */
  standings: TournamentStanding[] | null;
  /** 結果が入った試合の数 / 試合の数（不戦勝はのぞく） */
  done: number;
  total: number;
};

/** 標準のシード順（1位と最下位が当たり、上位どうしは決勝まで当たらない） */
export function seedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

function roundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - 1 - round;
  if (fromEnd === 0) return "決勝";
  if (fromEnd === 1) return "準決勝";
  if (fromEnd === 2) return "準々決勝";
  return `${round + 1}回戦`;
}

export function knockoutMatchKey(round: number, index: number): string {
  return `K${round}-${index}`;
}

export function leagueMatchKey(a: number, b: number): string {
  return `L${Math.min(a, b)}-${Math.max(a, b)}`;
}

function buildKnockout(entrants: string[], results: Record<string, MatchResult>): TournamentView {
  const n = entrants.length;
  let size = 2;
  while (size < n) size *= 2;
  const totalRounds = Math.log2(size);
  // 1回戦の枠：シード順に並べ、出場者の数をこえたところは不戦勝
  const slots = seedOrder(size).map((seed) => (seed <= n ? seed - 1 : null));
  const rounds: TournamentView["rounds"] = [];
  let prevWinners: (number | null)[] = [];
  let done = 0;

  for (let r = 0; r < totalRounds; r += 1) {
    const count = size / 2 ** (r + 1);
    const matches: TournamentMatch[] = [];
    const winners: (number | null)[] = [];
    for (let i = 0; i < count; i += 1) {
      const a = r === 0 ? slots[2 * i] : prevWinners[2 * i];
      const b = r === 0 ? slots[2 * i + 1] : prevWinners[2 * i + 1];
      // 1回戦で片方しかいないときだけ不戦勝。2回戦以降は「結果待ち」と区別する
      const bye = r === 0 && (a === null) !== (b === null);
      const key = knockoutMatchKey(r, i);
      const stored = results[key];
      let winner: number | null = null;
      if (bye) winner = a ?? b;
      else if (stored && stored.winner !== null && a !== null && b !== null && (stored.winner === a || stored.winner === b)) {
        winner = stored.winner;
      }
      const playable = !bye && a !== null && b !== null;
      if (playable && winner !== null) done += 1;
      // 結果が今の組み合わせに合っているときだけ、スコアも見せる
      const valid = winner !== null && !bye;
      matches.push({
        key,
        round: r,
        roundLabel: roundLabel(r, totalRounds),
        a,
        b,
        bye,
        winner,
        draw: false,
        scoreA: valid ? (stored?.scoreA ?? null) : null,
        scoreB: valid ? (stored?.scoreB ?? null) : null,
        playable,
      });
      winners.push(winner);
    }
    rounds.push({ round: r, label: roundLabel(r, totalRounds), matches });
    prevWinners = winners;
  }

  return {
    format: "knockout",
    entrants,
    rounds,
    champion: prevWinners[0] ?? null,
    standings: null,
    done,
    // 勝ち抜きでは、試合の数はいつも「出場者 − 1」（不戦勝はのぞく）
    total: Math.max(0, n - 1),
  };
}

/** リーグ戦の対戦順（サークル方式）。どの節も、1人が1試合ずつになるように並べる */
function leagueSchedule(n: number): [number, number][][] {
  const list: (number | null)[] = Array.from({ length: n }, (_, i) => i);
  if (n % 2 === 1) list.push(null);
  const m = list.length;
  const rounds: [number, number][][] = [];
  for (let r = 0; r < m - 1; r += 1) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < m / 2; i += 1) {
      const x = list[i];
      const y = list[m - 1 - i];
      if (x !== null && y !== null) pairs.push(x < y ? [x, y] : [y, x]);
    }
    rounds.push(pairs);
    // 先頭は固定して、残りを1つずつ回す
    list.splice(1, 0, list.pop() as number | null);
  }
  return rounds;
}

function buildLeague(entrants: string[], results: Record<string, MatchResult>): TournamentView {
  const n = entrants.length;
  const table: TournamentStanding[] = entrants.map((name, index) => ({
    index,
    name,
    played: 0,
    win: 0,
    draw: 0,
    loss: 0,
    points: 0,
    scoreFor: 0,
    scoreAgainst: 0,
    rank: 0,
  }));
  let done = 0;
  let total = 0;
  const rounds = leagueSchedule(n).map((pairs, r) => {
    const matches: TournamentMatch[] = pairs.map(([a, b]) => {
      const key = leagueMatchKey(a, b);
      const stored = results[key];
      total += 1;
      const decided = stored !== undefined && (stored.winner === null || stored.winner === a || stored.winner === b);
      if (decided) {
        done += 1;
        const ta = table[a];
        const tb = table[b];
        ta.played += 1;
        tb.played += 1;
        if (stored.winner === null) {
          ta.draw += 1;
          tb.draw += 1;
          ta.points += 1;
          tb.points += 1;
        } else {
          const w = stored.winner === a ? ta : tb;
          const l = stored.winner === a ? tb : ta;
          w.win += 1;
          l.loss += 1;
          w.points += 3;
        }
        if (stored.scoreA !== null && stored.scoreB !== null) {
          ta.scoreFor += stored.scoreA;
          ta.scoreAgainst += stored.scoreB;
          tb.scoreFor += stored.scoreB;
          tb.scoreAgainst += stored.scoreA;
        }
      }
      return {
        key,
        round: r,
        roundLabel: `第${r + 1}節`,
        a,
        b,
        bye: false,
        winner: decided ? stored.winner : null,
        draw: decided && stored.winner === null,
        scoreA: decided ? stored.scoreA : null,
        scoreB: decided ? stored.scoreB : null,
        playable: true,
      };
    });
    return { round: r, label: `第${r + 1}節`, matches };
  });

  // 勝ち点 → 得失点差 → 総得点 → 入れた順
  const sorted = [...table].sort(
    (x, y) =>
      y.points - x.points ||
      y.scoreFor - y.scoreAgainst - (x.scoreFor - x.scoreAgainst) ||
      y.scoreFor - x.scoreFor ||
      x.index - y.index,
  );
  sorted.forEach((row, i) => {
    const prev = sorted[i - 1];
    const same =
      prev &&
      prev.points === row.points &&
      prev.scoreFor - prev.scoreAgainst === row.scoreFor - row.scoreAgainst &&
      prev.scoreFor === row.scoreFor;
    row.rank = same ? prev.rank : i + 1;
  });

  return { format: "league", entrants, rounds, champion: null, standings: sorted, done, total };
}

export function buildTournamentView(settings: TournamentSettings, results: Record<string, MatchResult>): TournamentView {
  return settings.format === "league"
    ? buildLeague(settings.entrants, results)
    : buildKnockout(settings.entrants, results);
}

/** 主催者が入れた結果を確かめる。トーナメントは引き分けなし */
export function checkMatchResult(
  view: TournamentView,
  key: string,
  raw: { winner?: unknown; draw?: unknown; scoreA?: unknown; scoreB?: unknown },
): { ok: true; result: MatchResult } | { ok: false; error: string } {
  const match = view.rounds.flatMap((r) => r.matches).find((m) => m.key === key);
  if (!match) return { ok: false, error: "試合が見つかりません" };
  if (!match.playable || match.a === null || match.b === null) {
    return { ok: false, error: "まだ対戦相手が決まっていません" };
  }
  const score = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isInteger(n) && n >= 0 && n <= TOURNAMENT_SCORE_MAX ? n : NaN;
  };
  const scoreA = score(raw.scoreA);
  const scoreB = score(raw.scoreB);
  if (Number.isNaN(scoreA) || Number.isNaN(scoreB)) return { ok: false, error: "スコアは0〜999の数で入れてください" };
  if (raw.draw === true) {
    if (view.format !== "league") return { ok: false, error: "トーナメントでは引き分けにできません" };
    return { ok: true, result: { winner: null, scoreA, scoreB } };
  }
  const winner = typeof raw.winner === "number" ? raw.winner : NaN;
  if (winner !== match.a && winner !== match.b) return { ok: false, error: "勝った方を選んでください" };
  return { ok: true, result: { winner, scoreA, scoreB } };
}
