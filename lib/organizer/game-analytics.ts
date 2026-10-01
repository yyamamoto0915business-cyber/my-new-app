import type { SupabaseClient } from "@supabase/supabase-js";
import { getOwnedOrganizerGame, listOrganizerGameSpots } from "@/lib/organizer/games";
import type { OrganizerGame } from "@/lib/organizer/games";

export type GameAnalyticsWow = {
  participants: number | null;
  started: number | null;
  completed: number | null;
  completionRate: number | null;
  avgMinutes: number | null;
  repeaterRate: number | null;
};

export type GameAnalyticsKpi = {
  participants: number;
  started: number;
  completed: number;
  completionRate: number;
  avgMinutes: number | null;
  repeaterRate: number;
  repeaterCount: number;
  firstTimerCount: number;
  wow: GameAnalyticsWow;
};

export type GameAnalyticsDayPoint = {
  date: string;
  label: string;
  count: number;
};

export type GameAnalyticsHourPoint = {
  hour: number;
  label: string;
  count: number;
};

export type GameAnalyticsSpotRow = {
  id: string;
  name: string;
  kind: string;
  visits: number;
  reachRate: number;
};

export type GameAnalyticsFlowStep = {
  key: string;
  name: string;
  count: number;
  rate: number;
  dropOff: number | null;
};

export type GameAnalyticsQuestionRow = {
  key: string;
  label: string;
  prompt: string;
  ready: boolean;
};

export type GameAnalyticsHint = {
  id: string;
  text: string;
};

export type GameAnalytics = {
  game: OrganizerGame;
  kpi: GameAnalyticsKpi;
  days: GameAnalyticsDayPoint[];
  hours: GameAnalyticsHourPoint[];
  spots: GameAnalyticsSpotRow[];
  flow: GameAnalyticsFlowStep[];
  questions: GameAnalyticsQuestionRow[];
  hints: GameAnalyticsHint[];
  voicesReady: boolean;
  postsReady: boolean;
};

const HOUR_SLOTS = [6, 9, 12, 15, 18, 21] as const;

function jstParts(iso: string): { y: number; m: number; d: number; h: number; key: string } | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? NaN);
  const y = pick("year");
  const m = pick("month");
  const d = pick("day");
  const h = pick("hour");
  if (![y, m, d, h].every(Number.isFinite)) return null;
  return { y, m, d, h, key: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
}

function hourSlot(hour: number): (typeof HOUR_SLOTS)[number] {
  if (hour < 8) return 6;
  if (hour < 11) return 9;
  if (hour < 14) return 12;
  if (hour < 17) return 15;
  if (hour < 20) return 18;
  return 21;
}

function nextDateKey(key: string): string {
  return shiftDateKey(key, 1);
}

function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function labelFromKey(key: string): string {
  const [, m, d] = key.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function wowPct(now: number, prev: number): number | null {
  if (now === 0 && prev === 0) return null;
  if (prev <= 0) return now > 0 ? 100 : null;
  return Math.round(((now - prev) / prev) * 1000) / 10;
}

function wowDiff(now: number, prev: number): number | null {
  if (now === 0 && prev === 0) return null;
  return Math.round((now - prev) * 10) / 10;
}

function inDateRange(key: string, start: string, end: string) {
  return key >= start && key <= end;
}

function parseQuizQuestions(settings: unknown): { key: string; prompt: string }[] {
  if (!settings || typeof settings !== "object") return [];
  const quiz = (settings as { quiz?: unknown }).quiz;
  if (!quiz || typeof quiz !== "object") return [];
  const questions = (quiz as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) return [];
  return questions
    .map((row, index) => {
      const prompt =
        row && typeof row === "object" && typeof (row as { prompt?: unknown }).prompt === "string"
          ? (row as { prompt: string }).prompt.trim()
          : "";
      return {
        key:
          row && typeof row === "object" && typeof (row as { key?: unknown }).key === "string"
            ? (row as { key: string }).key
            : `q-${index + 1}`,
        prompt: prompt || `問題 ${index + 1}`,
      };
    })
    .slice(0, 12);
}

function buildHints(input: {
  kpi: GameAnalyticsKpi;
  hours: GameAnalyticsHourPoint[];
  spots: GameAnalyticsSpotRow[];
  flow: GameAnalyticsFlowStep[];
  questionCount: number;
}): GameAnalyticsHint[] {
  const hints: GameAnalyticsHint[] = [];
  if (input.kpi.participants === 0) {
    hints.push({
      id: "empty",
      text: "まだ参加データがありません。公開してQRを配ると、地域をどう歩いたかが見えてきます。",
    });
    return hints;
  }

  const peak = [...input.hours].sort((a, b) => b.count - a.count)[0];
  if (peak && peak.count > 0) {
    hints.push({
      id: "hour",
      text: `${peak.hour}時台の参加が多めです。案内やスタッフ配置を、この時間に寄せてみると歩きやすくなります。`,
    });
  }

  if (input.kpi.started >= 5 && input.kpi.completionRate < 40) {
    hints.push({
      id: "complete",
      text: "始めた人に対して完走率が低めです。コースの距離や、次のスポットの案内を見直してみてください。",
    });
  }

  const weak = input.flow.find((step) => (step.dropOff ?? 0) >= 25 && step.count >= 3);
  if (weak) {
    hints.push({
      id: "flow",
      text: `「${weak.name}」のあとで離脱が増えています。次の場所までの道順や距離を、もう少しわかりやすくすると良さそうです。`,
    });
  }

  const quiet = [...input.spots].sort((a, b) => a.visits - b.visits)[0];
  const busy = [...input.spots].sort((a, b) => b.visits - a.visits)[0];
  if (quiet && busy && input.spots.length >= 2 && busy.visits - quiet.visits >= 2) {
    hints.push({
      id: "spot",
      text: `「${busy.name}」はよく歩かれています。一方「${quiet.name}」は訪問が少なめなので、看板や一言案内があると回遊が伸びそうです。`,
    });
  }

  if (input.questionCount > 0) {
    hints.push({
      id: "quiz",
      text: "問題ごとの正答率は、参加者がクイズに答え始めてからここに出てきます。",
    });
  }

  if (hints.length === 0) {
    hints.push({
      id: "ok",
      text: "いまのところ、歩き方に大きな偏りは見当たりません。公開後の数日を見て、人気の道と静かな道を比べてみてください。",
    });
  }

  return hints.slice(0, 4);
}

export async function getOrganizerGameAnalytics(
  supabase: SupabaseClient,
  organizerId: string,
  gameId: string
): Promise<GameAnalytics | null> {
  const game = await getOwnedOrganizerGame(supabase, organizerId, gameId);
  if (!game) return null;

  let spots: Awaited<ReturnType<typeof listOrganizerGameSpots>> = [];
  try {
    spots = await listOrganizerGameSpots(supabase, game.id);
  } catch (error) {
    console.error("game analytics spots:", error);
  }

  const { data: playerRows, error: playerError } = await supabase
    .from("organizer_game_players")
    .select("id, created_at, last_seen_at")
    .eq("game_id", game.id);

  if (playerError && !/does not exist|schema cache/i.test(playerError.message)) {
    console.warn("game analytics players:", playerError.message);
  }

  const players = ((playerRows ?? []) as { id: string; created_at: string; last_seen_at: string }[]).filter(
    (row) => row.id
  );

  const spotIds = spots.map((spot) => spot.id);
  let stampRows: { player_id: string; spot_id: string; stamped_at: string }[] = [];
  if (spotIds.length > 0) {
    const { data, error } = await supabase
      .from("organizer_game_stamps")
      .select("player_id, spot_id, stamped_at")
      .in("spot_id", spotIds);
    if (error && !/does not exist|schema cache/i.test(error.message)) {
      console.warn("game analytics stamps:", error.message);
    }
    stampRows = (data ?? []) as typeof stampRows;
  }

  const stampsByPlayer = new Map<string, { spotId: string; at: string }[]>();
  for (const row of stampRows) {
    const list = stampsByPlayer.get(row.player_id) ?? [];
    list.push({ spotId: row.spot_id, at: row.stamped_at });
    stampsByPlayer.set(row.player_id, list);
  }

  const startedIds = new Set<string>();
  const completedIds = new Set<string>();
  const repeaterIds = new Set<string>();
  const durations: number[] = [];
  const dayCounts = new Map<string, number>();
  const hourCounts = new Map<number, number>();
  for (const hour of HOUR_SLOTS) hourCounts.set(hour, 0);

  const today = jstParts(new Date().toISOString())?.key ?? "2026-01-01";
  const thisStart = shiftDateKey(today, -6);
  const prevEnd = shiftDateKey(today, -7);
  const prevStart = shiftDateKey(today, -13);
  const week = {
    this: { participants: 0, started: 0, completed: 0, repeater: 0, minutes: [] as number[] },
    prev: { participants: 0, started: 0, completed: 0, repeater: 0, minutes: [] as number[] },
  };

  for (const player of players) {
    const stamps = (stampsByPlayer.get(player.id) ?? []).slice().sort((a, b) => a.at.localeCompare(b.at));
    const uniqueSpots = new Set(stamps.map((stamp) => stamp.spotId));
    const didStart = uniqueSpots.size > 0;
    const didComplete = spotIds.length > 0 && spotIds.every((id) => uniqueSpots.has(id));
    if (didStart) startedIds.add(player.id);
    if (didComplete) completedIds.add(player.id);

    const visitDays = new Set(
      [player.created_at, player.last_seen_at, ...stamps.map((stamp) => stamp.at)]
        .map((iso) => jstParts(iso)?.key)
        .filter((key): key is string => Boolean(key))
    );
    const isRepeater = visitDays.size >= 2;
    if (isRepeater) repeaterIds.add(player.id);

    let duration: number | null = null;
    if (stamps.length >= 2) {
      const start = new Date(stamps[0].at).getTime();
      const end = new Date(stamps[stamps.length - 1].at).getTime();
      if (end > start) {
        duration = (end - start) / 60000;
        durations.push(duration);
      }
    }

    const joined = jstParts(player.created_at);
    if (joined) dayCounts.set(joined.key, (dayCounts.get(joined.key) ?? 0) + 1);

    const activity = stamps[0]?.at ?? player.created_at;
    const parts = jstParts(activity);
    if (parts) {
      const slot = hourSlot(parts.h);
      hourCounts.set(slot, (hourCounts.get(slot) ?? 0) + 1);
    }

    const joinKey = joined?.key;
    const firstStampKey = stamps[0] ? jstParts(stamps[0].at)?.key : joinKey;
    const doneKey = didComplete && stamps.length > 0 ? jstParts(stamps[stamps.length - 1].at)?.key : null;
    const bucket =
      joinKey && inDateRange(joinKey, thisStart, today)
        ? week.this
        : joinKey && inDateRange(joinKey, prevStart, prevEnd)
          ? week.prev
          : null;
    if (bucket) {
      bucket.participants += 1;
      if (isRepeater) bucket.repeater += 1;
    }
    if (didStart && firstStampKey && inDateRange(firstStampKey, thisStart, today)) week.this.started += 1;
    if (didStart && firstStampKey && inDateRange(firstStampKey, prevStart, prevEnd)) week.prev.started += 1;
    if (doneKey && inDateRange(doneKey, thisStart, today)) week.this.completed += 1;
    if (doneKey && inDateRange(doneKey, prevStart, prevEnd)) week.prev.completed += 1;
    if (duration != null && firstStampKey && inDateRange(firstStampKey, thisStart, today)) {
      week.this.minutes.push(duration);
    }
    if (duration != null && firstStampKey && inDateRange(firstStampKey, prevStart, prevEnd)) {
      week.prev.minutes.push(duration);
    }
  }

  const avgOf = (values: number[]) =>
    values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  const thisCompleteRate = pct(week.this.completed, week.this.started || week.this.participants);
  const prevCompleteRate = pct(week.prev.completed, week.prev.started || week.prev.participants);
  const thisRepeaterRate = pct(week.this.repeater, week.this.participants);
  const prevRepeaterRate = pct(week.prev.repeater, week.prev.participants);

  const participants = players.length;
  const started = startedIds.size;
  const completed = completedIds.size;
  const repeaterCount = repeaterIds.size;
  const kpi: GameAnalyticsKpi = {
    participants,
    started,
    completed,
    completionRate: pct(completed, started || participants),
    avgMinutes: avgOf(durations),
    repeaterRate: pct(repeaterCount, participants),
    repeaterCount,
    firstTimerCount: Math.max(0, participants - repeaterCount),
    wow: {
      participants: wowPct(week.this.participants, week.prev.participants),
      started: wowPct(week.this.started, week.prev.started),
      completed: wowPct(week.this.completed, week.prev.completed),
      completionRate: wowDiff(thisCompleteRate, prevCompleteRate),
      avgMinutes:
        week.this.minutes.length === 0 && week.prev.minutes.length === 0
          ? null
          : wowDiff(avgOf(week.this.minutes) ?? 0, avgOf(week.prev.minutes) ?? 0),
      repeaterRate: wowDiff(thisRepeaterRate, prevRepeaterRate),
    },
  };

  const keys = [...dayCounts.keys()].sort();
  let chartStart = game.startsAt ? jstParts(game.startsAt)?.key : keys[0] ?? shiftDateKey(today, -13);
  let chartEnd = game.endsAt ? jstParts(game.endsAt)?.key : today || keys[keys.length - 1];
  if (!chartStart && chartEnd) chartStart = shiftDateKey(chartEnd, -13);
  if (!chartEnd && chartStart) chartEnd = chartStart;
  if (chartStart && chartEnd && chartStart > chartEnd) {
    const swap = chartStart;
    chartStart = chartEnd;
    chartEnd = swap;
  }
  if (chartStart && chartEnd) {
    let span = 0;
    let cursor = chartStart;
    while (cursor < chartEnd && span < 40) {
      cursor = nextDateKey(cursor);
      span += 1;
    }
    if (span > 31) chartStart = shiftDateKey(chartEnd, -31);
  }
  const days: GameAnalyticsDayPoint[] = [];
  if (chartStart && chartEnd) {
    let key = chartStart;
    let guard = 0;
    while (key <= chartEnd && guard < 32) {
      days.push({ date: key, label: labelFromKey(key), count: dayCounts.get(key) ?? 0 });
      key = nextDateKey(key);
      guard += 1;
    }
  }
  if (days.length === 0) {
    const fallback = today || keys[0] || "2026-01-01";
    days.push({ date: fallback, label: labelFromKey(fallback), count: dayCounts.get(fallback) ?? 0 });
  }

  const hours: GameAnalyticsHourPoint[] = HOUR_SLOTS.map((hour) => ({
    hour,
    label: `${hour}時`,
    count: hourCounts.get(hour) ?? 0,
  }));

  const visitBySpot = new Map<string, number>();
  for (const spot of spots) {
    const visits = new Set(stampRows.filter((row) => row.spot_id === spot.id).map((row) => row.player_id)).size;
    visitBySpot.set(spot.id, visits);
  }

  const spotRows: GameAnalyticsSpotRow[] = spots.map((spot) => ({
    id: spot.id,
    name: spot.name,
    kind: spot.kind,
    visits: visitBySpot.get(spot.id) ?? 0,
    reachRate: pct(visitBySpot.get(spot.id) ?? 0, participants || started),
  }));

  const flowBase = started || participants;
  const flow: GameAnalyticsFlowStep[] = [
    { key: "start", name: "スタート", count: started, rate: pct(started, flowBase || 1), dropOff: null },
  ];
  spots.forEach((spot, index) => {
    const count = visitBySpot.get(spot.id) ?? 0;
    const prev = flow[flow.length - 1];
    const dropOff = prev.count > 0 ? pct(Math.max(0, prev.count - count), prev.count) : 0;
    flow.push({
      key: spot.id,
      name: spot.name,
      count,
      rate: pct(count, flowBase || 1),
      dropOff: index === 0 && started <= count ? null : dropOff,
    });
  });
  flow.push({
    key: "goal",
    name: "ゴール",
    count: completed,
    rate: pct(completed, flowBase || 1),
    dropOff: spots.length ? pct(Math.max(0, (visitBySpot.get(spots[spots.length - 1]?.id) ?? 0) - completed), visitBySpot.get(spots[spots.length - 1]?.id) || 1) : null,
  });

  const { data: rawGame } = await supabase
    .from("organizer_games")
    .select("settings")
    .eq("id", game.id)
    .maybeSingle();
  const quizQuestions = parseQuizQuestions((rawGame as { settings?: unknown } | null)?.settings);
  const questions: GameAnalyticsQuestionRow[] = quizQuestions.map((question, index) => ({
    key: question.key,
    label: `Q${index + 1}`,
    prompt: question.prompt,
    ready: false,
  }));

  return {
    game,
    kpi,
    days,
    hours,
    spots: spotRows,
    flow,
    questions,
    hints: buildHints({
      kpi,
      hours,
      spots: spotRows,
      flow,
      questionCount: questions.length,
    }),
    voicesReady: false,
    postsReady: false,
  };
}
