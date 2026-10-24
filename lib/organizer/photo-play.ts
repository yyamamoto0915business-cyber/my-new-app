import { safeImageUrl } from "@/lib/organizer/game-experience";

export type PublicPhotoSpot = {
  index: number;
  name: string;
  place: string;
  prompt: string;
  imageUrl: string;
  actionLabel: string;
};

export type PublicPhotoPlay = {
  clearCount: number;
  photoRequired: boolean;
  /** クリア時にアカウントへ加算する数。ポイント特典がオフなら 0。 */
  pointAmount: number;
  rewards: string[];
  spots: PublicPhotoSpot[];
  /** クーポン・景品引換。どちらかがあれば、クリアした人に引き換えコードを出す（参加者には中身の文だけ見せる）。 */
  couponOn?: boolean;
  prizeOn?: boolean;
};

function photoImage(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw.startsWith("/") && !raw.includes("..") && !raw.includes("\\")) return raw.slice(0, 300);
  return safeImageUrl(raw, 300);
}

export function readStoredPhoto(settings: unknown): PublicPhotoPlay | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const photo = (settings as { photo?: unknown }).photo;
  if (!photo || typeof photo !== "object" || Array.isArray(photo)) return null;
  const body = photo as Record<string, unknown>;
  const spots = Array.isArray(body.spots)
    ? body.spots.slice(0, 20).flatMap((item): Omit<PublicPhotoSpot, "index">[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const name = typeof row.name === "string" ? row.name.trim().slice(0, 40) : "";
        if (!name) return [];
        return [
          {
            name,
            place: typeof row.place === "string" ? row.place.trim().slice(0, 40) : "",
            prompt: typeof row.prompt === "string" ? row.prompt.trim().slice(0, 80) : "",
            imageUrl: photoImage(row.imageUrl),
            actionLabel: "",
          },
        ];
      })
    : [];
  if (spots.length === 0) return null;
  const photoRequired = body.photoRequired !== false;
  const rewardsRaw =
    body.rewards && typeof body.rewards === "object" ? (body.rewards as Record<string, unknown>) : {};
  const pointsRaw = typeof body.points === "number" ? Math.round(body.points) : 0;
  const points = Math.min(9999, Math.max(0, pointsRaw));
  const pointAmount = rewardsRaw.points === true ? points : 0;
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const couponName = text(rewardsRaw.couponName, 40);
  const couponDetail = text(rewardsRaw.couponDetail, 80);
  const prizeName = text(rewardsRaw.prizeName, 40);
  const prizePlace = text(rewardsRaw.prizePlace, 60);
  const rewards = [
    pointAmount > 0 ? `${pointAmount}ポイントが残ります。` : "",
    rewardsRaw.coupon === true
      ? couponName
        ? `クーポン：${couponName}${couponDetail ? `（${couponDetail}）` : ""}`
        : "クーポンを受け取れます。"
      : "",
    rewardsRaw.prize === true
      ? prizeName
        ? `景品：${prizeName}${prizePlace ? `（受け取り場所：${prizePlace}）` : ""}`
        : "景品を受け取れます。"
      : "",
  ].filter(Boolean);
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : spots.length;
  const actionLabel = photoRequired ? "写真を残す" : "ここに来た";
  return {
    clearCount: Math.min(spots.length, Math.max(1, clearRaw)),
    photoRequired,
    pointAmount,
    rewards,
    spots: spots.map((spot, index) => ({ ...spot, index, actionLabel })),
    couponOn: rewardsRaw.coupon === true,
    prizeOn: rewardsRaw.prize === true,
  };
}

export function readPublicPhoto(raw: unknown): PublicPhotoPlay | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const spots = Array.isArray(body.spots)
    ? body.spots.flatMap((item): PublicPhotoSpot[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const name = typeof row.name === "string" ? row.name.trim() : "";
        const index = typeof row.index === "number" ? Math.round(row.index) : -1;
        if (!name || index < 0) return [];
        return [
          {
            index,
            name,
            place: typeof row.place === "string" ? row.place : "",
            prompt: typeof row.prompt === "string" ? row.prompt : "",
            imageUrl: photoImage(row.imageUrl),
            actionLabel:
              typeof row.actionLabel === "string" && row.actionLabel.trim() ? row.actionLabel : "写真を残す",
          },
        ];
      })
    : [];
  if (spots.length === 0) return null;
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : spots.length;
  const rewards = Array.isArray(body.rewards)
    ? body.rewards.filter((line): line is string => typeof line === "string" && line.trim().length > 0)
    : [];
  const pointRaw = typeof body.pointAmount === "number" ? Math.round(body.pointAmount) : 0;
  return {
    clearCount: Math.min(spots.length, Math.max(1, clearRaw)),
    photoRequired: body.photoRequired !== false,
    pointAmount: Math.min(9999, Math.max(0, pointRaw)),
    rewards,
    spots,
  };
}

export function normalizePhotoDone(value: unknown, total: number): number[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<number>();
  for (const item of value) {
    if (typeof item !== "number" || !Number.isInteger(item)) continue;
    if (item < 0 || item >= total) continue;
    set.add(item);
  }
  return [...set].sort((left, right) => left - right);
}
