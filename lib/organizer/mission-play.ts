import { isMissionKindId, missionKindLabel, type MissionKindId } from "@/lib/organizer/mission";

export type PublicMission = {
  index: number;
  kind: MissionKindId;
  kindLabel: string;
  name: string;
  condition: string;
  actionLabel: string;
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
};

export type StoredMissionPlay = {
  clearCount: number;
  pointsOn: boolean;
  rewards: string[];
  missions: StoredMission[];
};

function quotedKeyword(condition: string): string {
  const matched = condition.match(/[「『]([^」』]+)[」』]/);
  return matched?.[1]?.trim() ?? "";
}

function actionLabel(kind: MissionKindId): string {
  if (kind === "photo") return "写真を残す";
  if (kind === "checkin") return "チェックインする";
  if (kind === "quiz") return "答えた";
  if (kind === "friends") return "一緒に参加した";
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
        return [
          {
            index: 0,
            kind,
            kindLabel: missionKindLabel(kind),
            name,
            condition: kind === "keyword" ? "" : condition,
            actionLabel: actionLabel(kind),
            keyword: kind === "keyword" ? quotedKeyword(condition) : "",
            pointAmount,
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
    missions: play.missions.map(({ keyword: _keyword, pointAmount: _pointAmount, ...item }) => ({
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
