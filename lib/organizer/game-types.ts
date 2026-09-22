export const ORGANIZER_GAME_TYPE_IDS = [
  "stamp",
  "quiz",
  "mystery",
  "mission",
  "photo",
  "coupon",
  "checkin",
] as const;

export type OrganizerGameTypeId = (typeof ORGANIZER_GAME_TYPE_IDS)[number];

export type OrganizerGameStatus = "draft" | "published" | "archived";

export type OrganizerGameType = {
  id: OrganizerGameTypeId;
  label: string;
  description: string;
  /** いま作成できるタイプか */
  available: boolean;
};

export const ORGANIZER_GAME_TYPES: readonly OrganizerGameType[] = [
  {
    id: "stamp",
    label: "スタンプラリー",
    description: "スポットを巡ってスタンプを集めます",
    available: true,
  },
  {
    id: "quiz",
    label: "クイズラリー",
    description: "各スポットの問題に答えます",
    available: false,
  },
  {
    id: "mystery",
    label: "謎解き街歩き",
    description: "ヒントをたどってまちを歩きます",
    available: false,
  },
  {
    id: "mission",
    label: "ミッション",
    description: "課題をクリアして進みます",
    available: false,
  },
  {
    id: "photo",
    label: "フォトラリー",
    description: "スポットで写真を撮ります",
    available: false,
  },
  {
    id: "coupon",
    label: "クーポンラリー",
    description: "巡った先で特典を受け取れます",
    available: false,
  },
  {
    id: "checkin",
    label: "チェックイン",
    description: "訪れた記録を残します",
    available: false,
  },
];

export function isOrganizerGameTypeId(value: string): value is OrganizerGameTypeId {
  return ORGANIZER_GAME_TYPE_IDS.includes(value as OrganizerGameTypeId);
}

export function getOrganizerGameType(id: OrganizerGameTypeId): OrganizerGameType {
  return ORGANIZER_GAME_TYPES.find((type) => type.id === id) ?? ORGANIZER_GAME_TYPES[0];
}

export const DEFAULT_ORGANIZER_GAME_TYPE_ID: OrganizerGameTypeId = "stamp";
