import { sanitizePlace } from "@/lib/organizer/game-experience";
import { MISSION_PLACE_KINDS, isMissionKindId, missionKindLabel, type MissionKindId } from "@/lib/organizer/mission";
import type { QuizGate } from "@/lib/organizer/quiz-play";

export type PublicMission = {
  index: number;
  kind: MissionKindId;
  kindLabel: string;
  name: string;
  condition: string;
  actionLabel: string;
  /** その場所に着いたことの確かめ方（「スポットに行く」「チェックイン」）。なければ押すだけで達成。 */
  arrival?: "gps" | "keyword";
  place?: string;
  /** 「クイズに答える」の問題と選択肢（正解は渡さない）。 */
  question?: string;
  choices?: string[];
};

export type PublicMissionPlay = {
  clearCount: number;
  hints: boolean;
  rewards: string[];
  missions: PublicMission[];
};

export type StoredMission = PublicMission & {
  keyword: string;
  pointAmount: number;
  /** 着いたことの確かめ（クイズのチェックポイントと同じ）。参加者には渡さない。 */
  gate: QuizGate | null;
  /** 「クイズに答える」の正解（choices の番号）。問題がなければ -1。 */
  correctIndex: number;
};

export type StoredMissionPlay = {
  clearCount: number;
  pointsOn: boolean;
  /** 公開設定の「ランキングを表示」。 */
  rankingOn: boolean;
  rewards: string[];
  missions: StoredMission[];
};

function quotedKeyword(condition: string): string {
  const matched = condition.match(/[「『]([^」』]+)[」』]/);
  return matched?.[1]?.trim() ?? "";
}

function actionLabel(kind: MissionKindId): string {
  if (kind === "photo") return "写真を撮って送る";
  if (kind === "checkin") return "チェックインする";
  if (kind === "quiz") return "答えた";
  if (kind === "friends") return "合言葉を送る";
  if (kind === "keyword") return "答える";
  return "着いた";
}

export function readStoredMission(settings: unknown): StoredMissionPlay | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const mission = (settings as { mission?: unknown }).mission;
  if (!mission || typeof mission !== "object" || Array.isArray(mission)) return null;
  const body = mission as Record<string, unknown>;
  const missions = Array.isArray(body.missions)
    ? body.missions.slice(0, 40).flatMap((item): StoredMission[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        if (row.published === false) return [];
        const name = typeof row.name === "string" ? row.name.trim().slice(0, 40) : "";
        if (!name) return [];
        const kind = typeof row.kind === "string" && isMissionKindId(row.kind) ? row.kind : "visit";
        const condition = typeof row.condition === "string" ? row.condition.trim().slice(0, 80) : "";
        const amountRaw = typeof row.amount === "number" ? Math.round(row.amount) : 0;
        const pointAmount =
          row.reward === "points" ? Math.min(9999, Math.max(1, amountRaw || 50)) : 0;
        const place = typeof row.place === "string" ? row.place.trim().slice(0, 40) : "";
        let gate: QuizGate | null = null;
        if ((MISSION_PLACE_KINDS as string[]).includes(kind)) {
          const gateKeyword = typeof row.keyword === "string" ? row.keyword.trim().slice(0, 40) : "";
          const spot = sanitizePlace(row.lat, row.lng);
          if (row.arrival === "keyword" && gateKeyword) gate = { arrival: "keyword", place, keyword: gateKeyword };
          else if (row.arrival !== "keyword" && row.arrival !== "none" && spot) {
            const radiusRaw = typeof row.radius === "number" ? Math.round(row.radius) : 50;
            gate = { arrival: "gps", place, ...spot, radiusM: Math.min(500, Math.max(5, radiusRaw)) };
          }
        }
        // 「クイズに答える」：問題文と2つ以上の選択肢があれば、正解したときだけ達成にする。
        const rawChoices = Array.isArray(row.choices)
          ? row.choices.slice(0, 4).map((choice) => (typeof choice === "string" ? choice.trim().slice(0, 40) : ""))
          : [];
        const question = typeof row.question === "string" ? row.question.trim().slice(0, 120) : "";
        const correctRaw = typeof row.correctIndex === "number" ? Math.round(row.correctIndex) : 0;
        const filled = rawChoices.map((choice, i) => ({ choice, i })).filter((item) => item.choice);
        const quizOn = kind === "quiz" && question && filled.length >= 2 && filled.some((item) => item.i === correctRaw);
        return [
          {
            index: 0,
            kind,
            kindLabel: missionKindLabel(kind),
            name,
            condition: kind === "keyword" ? "" : condition,
            actionLabel: gate
              ? gate.arrival === "gps"
                ? "現在地で確かめる"
                : "合言葉で確かめる"
              : quizOn
                ? "答える"
                : actionLabel(kind),
            keyword: kind === "keyword" ? quotedKeyword(condition) : "",
            pointAmount,
            gate,
            ...(gate ? { arrival: gate.arrival, place } : {}),
            correctIndex: quizOn ? filled.findIndex((item) => item.i === correctRaw) : -1,
            ...(quizOn ? { question, choices: filled.map((item) => item.choice) } : {}),
          },
        ];
      })
    : [];
  if (missions.length === 0) return null;
  const rewardsRaw =
    body.rewards && typeof body.rewards === "object" ? (body.rewards as Record<string, unknown>) : {};
  const prizePlace = typeof body.prizePlace === "string" ? body.prizePlace.trim().slice(0, 40) : "";
  const rewards = [
    rewardsRaw.coupon === true ? "クーポンを受け取れます。" : "",
    rewardsRaw.points === true ? "ポイントが残ります。" : "",
    rewardsRaw.stamp === true ? "スタンプが残ります。" : "",
    prizePlace ? `${prizePlace}で受け取れます。` : "",
  ].filter(Boolean);
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : missions.length;
  return {
    clearCount: Math.min(missions.length, Math.max(1, clearRaw)),
    pointsOn: rewardsRaw.points === true,
    rankingOn:
      !!body.publish && typeof body.publish === "object" && (body.publish as Record<string, unknown>).ranking === true,
    rewards,
    missions: missions.map((item, index) => ({ ...item, index })),
  };
}

export function missionAwardPoints(play: StoredMissionPlay, done: number[]): number {
  if (!play.pointsOn) return 0;
  const sum = play.missions
    .filter((mission) => done.includes(mission.index))
    .reduce((total, mission) => total + mission.pointAmount, 0);
  return Math.min(9999, Math.max(0, sum));
}

export function publicMission(play: StoredMissionPlay, hints: boolean): PublicMissionPlay {
  return {
    clearCount: play.clearCount,
    hints,
    rewards: play.rewards,
    missions: play.missions.map(({ keyword: _keyword, pointAmount: _pointAmount, gate: _gate, correctIndex: _correct, ...item }) => ({
      ...item,
      condition: hints ? item.condition : "",
    })),
  };
}

export function readPublicMission(raw: unknown): PublicMissionPlay | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const missions = Array.isArray(body.missions)
    ? body.missions.flatMap((item): PublicMission[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const name = typeof row.name === "string" ? row.name.trim() : "";
        const kind = typeof row.kind === "string" && isMissionKindId(row.kind) ? row.kind : null;
        const index = typeof row.index === "number" ? Math.round(row.index) : -1;
        if (!name || !kind || index < 0) return [];
        return [
          {
            index,
            kind,
            kindLabel: typeof row.kindLabel === "string" ? row.kindLabel : missionKindLabel(kind),
            name,
            condition: typeof row.condition === "string" ? row.condition : "",
            actionLabel: typeof row.actionLabel === "string" && row.actionLabel.trim() ? row.actionLabel : actionLabel(kind),
            ...(typeof row.question === "string" && Array.isArray(row.choices)
              ? {
                  question: row.question,
                  choices: row.choices.filter((choice): choice is string => typeof choice === "string"),
                }
              : {}),
            ...(row.arrival === "gps" || row.arrival === "keyword"
              ? { arrival: row.arrival as "gps" | "keyword", place: typeof row.place === "string" ? row.place : "" }
              : {}),
          },
        ];
      })
    : [];
  if (missions.length === 0) return null;
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : missions.length;
  const rewards = Array.isArray(body.rewards)
    ? body.rewards.filter((line): line is string => typeof line === "string" && line.trim().length > 0)
    : [];
  return {
    clearCount: Math.min(missions.length, Math.max(1, clearRaw)),
    hints: body.hints === true,
    rewards,
    missions,
  };
}

export function normalizeMissionDone(value: unknown, total: number): number[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<number>();
  for (const item of value) {
    if (typeof item !== "number" || !Number.isInteger(item)) continue;
    if (item < 0 || item >= total) continue;
    set.add(item);
  }
  return [...set].sort((left, right) => left - right);
}
