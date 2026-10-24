export const MISSION_KIND_IDS = ["visit", "photo", "keyword", "checkin", "quiz", "friends"] as const;

export type MissionKindId = (typeof MISSION_KIND_IDS)[number];

export type MissionReward = "stamp" | "points";

export const MISSION_KINDS: {
  id: MissionKindId;
  label: string;
  blurb: string;
}[] = [
  { id: "visit", label: "スポットに行く", blurb: "指定のスポットを訪れて達成" },
  { id: "photo", label: "写真を投稿", blurb: "スポットで撮った写真を投稿" },
  { id: "keyword", label: "キーワード入力", blurb: "指定されたキーワードを入力して達成" },
  { id: "checkin", label: "チェックイン", blurb: "指定の場所に来てチェックイン" },
  { id: "quiz", label: "クイズに答える", blurb: "まちに関するクイズに挑戦" },
  { id: "friends", label: "友だちと参加", blurb: "友だちと一緒に参加して達成" },
];

export const MISSION_TIPS: Record<MissionKindId, string> = {
  visit: "スポットに着いたら、達成だよ！",
  photo: "写真を撮って投稿すると達成だよ！",
  keyword: "合言葉を入力すると達成だよ！",
  checkin: "その場所でチェックインすると達成だよ！",
  quiz: "クイズに正解すると達成だよ！",
  friends: "友だちと一緒に参加すると達成だよ！",
};

export type MissionItem = {
  key: string;
  kind: MissionKindId;
  name: string;
  condition: string;
  reward: MissionReward;
  amount: number;
  published: boolean;
  /** 「スポットに行く」「チェックイン」の場所と、着いたことの確かめ方。 */
  place: string;
  arrival: "none" | "gps" | "keyword";
  lat: number | null;
  lng: number | null;
  radius: number;
  /** 現地の看板などに書いた合言葉（確かめ方が合言葉のとき）。 */
  keyword: string;
  /** 「クイズに答える」の問題文・選択肢・正解（選択肢の番号）。 */
  question: string;
  choices: string[];
  correctIndex: number;
};

/** 場所の確かめを使うミッション。 */
export const MISSION_PLACE_KINDS: MissionKindId[] = ["visit", "checkin"];

const PLACE_DEFAULTS = {
  place: "",
  arrival: "gps" as const,
  lat: null,
  lng: null,
  radius: 50,
  keyword: "",
  question: "",
  choices: ["", ""],
  correctIndex: 0,
};

export function isMissionKindId(value: string): value is MissionKindId {
  return MISSION_KIND_IDS.includes(value as MissionKindId);
}

export function missionKindLabel(id: MissionKindId): string {
  return MISSION_KINDS.find((kind) => kind.id === id)?.label ?? "ミッション";
}

export function missionRewardLabel(item: Pick<MissionItem, "reward" | "amount">): string {
  if (item.reward === "points") return `ポイント ${item.amount}pt`;
  return `スタンプ ${item.amount}個`;
}

export function createMissionItem(kind: MissionKindId): MissionItem {
  const reward: MissionReward = kind === "photo" || kind === "checkin" ? "points" : "stamp";
  return {
    key: crypto.randomUUID(),
    kind,
    name: "",
    condition: "",
    reward,
    amount: reward === "points" ? 50 : 1,
    published: true,
    ...PLACE_DEFAULTS,
  };
}

export function sampleMissions(): MissionItem[] {
  return [
    {
      key: crypto.randomUUID(),
      kind: "visit",
      name: "中央広場に行こう",
      condition: "中央広場に訪れる",
      reward: "stamp",
      amount: 1,
      published: true,
      ...PLACE_DEFAULTS,
    },
    {
      key: crypto.randomUUID(),
      kind: "photo",
      name: "さくら通りで写真を投稿",
      condition: "さくら通りで撮影した写真を投稿",
      reward: "points",
      amount: 50,
      published: true,
      ...PLACE_DEFAULTS,
    },
    {
      key: crypto.randomUUID(),
      kind: "keyword",
      name: "合言葉を入力",
      condition: "キーワード「さくら2025」を入力",
      reward: "stamp",
      amount: 1,
      published: true,
      ...PLACE_DEFAULTS,
    },
    {
      key: crypto.randomUUID(),
      kind: "checkin",
      name: "ゴール地点でチェックイン",
      condition: "駅前ゴールにチェックイン",
      reward: "points",
      amount: 100,
      published: true,
      ...PLACE_DEFAULTS,
    },
  ];
}

export type MissionSettings = {
  formats: MissionKindId[];
  missions: Omit<MissionItem, "key">[];
  clearCount: number;
  rewards: { coupon: boolean; points: boolean; stamp: boolean };
  prizePlace: string;
  publish: { passOnly: boolean; ranking: boolean; hints: boolean };
};

export function sanitizeMissionSettings(raw: unknown): MissionSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const formats = Array.isArray(body.formats)
    ? body.formats.filter((id): id is MissionKindId => typeof id === "string" && isMissionKindId(id))
    : [];
  const missions = Array.isArray(body.missions)
    ? body.missions.slice(0, 40).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const kind = typeof row.kind === "string" && isMissionKindId(row.kind) ? row.kind : "visit";
        const reward: MissionReward = row.reward === "points" ? "points" : "stamp";
        const amountRaw = typeof row.amount === "number" ? row.amount : reward === "points" ? 50 : 1;
        return [
          {
            kind,
            name: typeof row.name === "string" ? row.name.trim().slice(0, 40) : "",
            condition: typeof row.condition === "string" ? row.condition.trim().slice(0, 80) : "",
            reward,
            amount: Math.min(9999, Math.max(1, Math.round(amountRaw))),
            published: row.published !== false,
            place: typeof row.place === "string" ? row.place.trim().slice(0, 40) : "",
            arrival: (row.arrival === "keyword" || row.arrival === "none" ? row.arrival : "gps") as MissionItem["arrival"],
            lat: typeof row.lat === "number" && Number.isFinite(row.lat) ? row.lat : null,
            lng: typeof row.lng === "number" && Number.isFinite(row.lng) ? row.lng : null,
            radius: typeof row.radius === "number" ? Math.min(500, Math.max(5, Math.round(row.radius))) : 50,
            keyword: typeof row.keyword === "string" ? row.keyword.trim().slice(0, 40) : "",
            question: typeof row.question === "string" ? row.question.trim().slice(0, 120) : "",
            choices: Array.isArray(row.choices)
              ? row.choices
                  .slice(0, 4)
                  .map((choice) => (typeof choice === "string" ? choice.trim().slice(0, 40) : ""))
              : ["", ""],
            correctIndex:
              typeof row.correctIndex === "number" ? Math.min(3, Math.max(0, Math.round(row.correctIndex))) : 0,
          },
        ];
      })
    : [];
  const rewardsRaw =
    body.rewards && typeof body.rewards === "object" ? (body.rewards as Record<string, unknown>) : {};
  const publishRaw =
    body.publish && typeof body.publish === "object" ? (body.publish as Record<string, unknown>) : {};
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : 1;
  return {
    formats: formats.length > 0 ? formats : ["visit"],
    missions,
    clearCount: Math.min(40, Math.max(1, clearRaw)),
    rewards: {
      coupon: rewardsRaw.coupon === true,
      points: rewardsRaw.points === true,
      stamp: rewardsRaw.stamp === true,
    },
    prizePlace: typeof body.prizePlace === "string" ? body.prizePlace.trim().slice(0, 40) : "",
    publish: {
      passOnly: publishRaw.passOnly === true,
      ranking: publishRaw.ranking === true,
      hints: publishRaw.hints === true,
    },
  };
}
