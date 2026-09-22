export const ORGANIZER_GAME_SPOT_KINDS = ["stamp", "goal"] as const;

export type OrganizerGameSpotKind = (typeof ORGANIZER_GAME_SPOT_KINDS)[number];

export const ORGANIZER_GAME_SPOT_KIND_LABEL: Record<OrganizerGameSpotKind, string> = {
  stamp: "スタンプ",
  goal: "ゴール",
};

export const MAX_ORGANIZER_GAME_SPOTS = 20;

export function isOrganizerGameSpotKind(value: string): value is OrganizerGameSpotKind {
  return ORGANIZER_GAME_SPOT_KINDS.includes(value as OrganizerGameSpotKind);
}

export function generateOrganizerGameToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

export function organizerGameJoinPath(token: string): string {
  return `/play/${token}`;
}

export function organizerGameSpotPath(token: string): string {
  return `/play/spot/${token}`;
}
