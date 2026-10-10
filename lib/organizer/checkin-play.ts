import { safeImageUrl } from "@/lib/organizer/game-experience";
import {
  checkinMethodLabel,
  sanitizeCheckinSettings,
  type CheckinClearMode,
  type CheckinMethod,
} from "@/lib/organizer/checkin";

export type PublicCheckinSpot = {
  index: number;
  name: string;
  place: string;
  method: CheckinMethod;
  methodLabel: string;
  radius: number;
  imageUrl: string;
  actionLabel: string;
};

export type PublicCheckinPlay = {
  needed: number;
  rewards: string[];
  spots: PublicCheckinSpot[];
};

export type StoredCheckinSpot = PublicCheckinSpot & {
  keyword: string;
};

export type StoredCheckinPlay = {
  needed: number;
  /** クリア時にアカウントへ加算する数。ポイント特典がオフなら 0。 */
  pointAmount: number;
  rewards: string[];
  spots: StoredCheckinSpot[];
};

function checkinImage(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw.startsWith("/") && !raw.includes("..") && !raw.includes("\\")) return raw.slice(0, 300);
  return safeImageUrl(raw, 300);
}

function actionLabel(method: CheckinMethod): string {
  if (method === "qr") return "QRを読み取った";
  if (method === "keyword") return "答える";
  return "この場所にいる";
}

function neededCount(mode: CheckinClearMode, clearCount: number, spotCount: number): number {
  if (spotCount <= 0) return 1;
  if (mode === "all") return spotCount;
  return Math.min(Math.max(clearCount, 1), spotCount);
}

export function readStoredCheckin(settings: unknown): StoredCheckinPlay | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const checkin = sanitizeCheckinSettings((settings as { checkin?: unknown }).checkin);
  if (!checkin) return null;
  const spots = checkin.spots.flatMap((spot) => {
    if (!spot.published || !spot.name) return [];
    return [
      {
        name: spot.name,
        place: checkin.hintOn ? spot.place : "",
        method: spot.method,
        methodLabel: checkinMethodLabel(spot.method),
        radius: spot.radius,
        imageUrl: checkinImage(spot.imageUrl),
        actionLabel: actionLabel(spot.method),
        keyword: spot.method === "keyword" ? spot.keyword : "",
      },
    ];
  });
  if (spots.length === 0) return null;
  const pointAmount = checkin.pointsOn ? checkin.points : 0;
  const rewards = [
    checkin.couponOn && checkin.couponName
      ? checkin.couponName
      : checkin.couponOn
        ? "クーポンを受け取れます。"
        : "",
    pointAmount > 0 ? `${pointAmount}ポイントが残ります。` : "",
    checkin.stampOn ? "スタンプが残ります。" : "",
    checkin.prizeOn ? "景品を受け取れます。" : "",
    checkin.receivePlace === "venue" ? "会場で受け取れます。" : "",
  ].filter(Boolean);
  return {
    needed: neededCount(checkin.clearMode, checkin.clearCount, spots.length),
    pointAmount,
    rewards,
    spots: spots.map((spot, index) => ({ ...spot, index })),
  };
}

export function publicCheckin(play: StoredCheckinPlay): PublicCheckinPlay {
  return {
    needed: play.needed,
    rewards: play.rewards,
    spots: play.spots.map(({ keyword: _keyword, ...spot }) => spot),
  };
}

function isMethod(value: string): value is CheckinMethod {
  return value === "gps" || value === "qr" || value === "keyword";
}

export function readPublicCheckin(raw: unknown): PublicCheckinPlay | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const spots = Array.isArray(body.spots)
    ? body.spots.flatMap((item): PublicCheckinSpot[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const name = typeof row.name === "string" ? row.name.trim() : "";
        const method = typeof row.method === "string" && isMethod(row.method) ? row.method : null;
        const index = typeof row.index === "number" ? Math.round(row.index) : -1;
        if (!name || !method || index < 0) return [];
        const radiusRaw = typeof row.radius === "number" ? Math.round(row.radius) : 50;
        return [
          {
            index,
            name,
            place: typeof row.place === "string" ? row.place : "",
            method,
            methodLabel:
              typeof row.methodLabel === "string" && row.methodLabel.trim()
                ? row.methodLabel
                : checkinMethodLabel(method),
            radius: Math.min(500, Math.max(10, radiusRaw)),
            imageUrl: checkinImage(row.imageUrl),
            actionLabel:
              typeof row.actionLabel === "string" && row.actionLabel.trim()
                ? row.actionLabel
                : actionLabel(method),
          },
        ];
      })
    : [];
  if (spots.length === 0) return null;
  const neededRaw = typeof body.needed === "number" ? Math.round(body.needed) : spots.length;
  const rewards = Array.isArray(body.rewards)
    ? body.rewards.filter((line): line is string => typeof line === "string" && line.trim().length > 0)
    : [];
  return {
    needed: Math.min(spots.length, Math.max(1, neededRaw)),
    rewards,
    spots,
  };
}

export function normalizeCheckinDone(value: unknown, total: number): number[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<number>();
  for (const item of value) {
    if (typeof item !== "number" || !Number.isInteger(item)) continue;
    if (item < 0 || item >= total) continue;
    set.add(item);
  }
  return [...set].sort((left, right) => left - right);
}
