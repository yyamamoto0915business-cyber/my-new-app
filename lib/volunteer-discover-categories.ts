import type { VolunteerRoleType } from "@/lib/volunteer-roles-mock";

export type VolunteerDiscoverCategory = {
  id: string;
  label: string;
  emoji: string;
  iconBg: string;
  /** 役割タイプが一致すればヒット */
  roleTypes?: VolunteerRoleType[];
  /** タイトル・説明に含まれればヒット */
  keywords?: string[];
};

export const VOLUNTEER_DISCOVER_CATEGORIES: VolunteerDiscoverCategory[] = [
  {
    id: "volunteer_recruitment",
    label: "ボランティア募集",
    emoji: "🤝",
    iconBg: "#EAF4ED",
    keywords: [
      "ボランティア",
      "手伝い",
      "募集",
      "サポート",
      "支援",
      "お手伝い",
      "スタッフ",
    ],
  },
  {
    id: "operation",
    label: "まつり・イベント",
    emoji: "🎪",
    iconBg: "#FFF0E6",
    roleTypes: ["operation", "setup"],
    keywords: ["まつり", "祭", "イベント", "フェス", "催し"],
  },
  {
    id: "setup",
    label: "スポーツ・健康",
    emoji: "🏃",
    iconBg: "#E6F4FF",
    roleTypes: ["setup", "operation"],
    keywords: ["スポーツ", "健康", "マラソン", "ラン", "運動"],
  },
  {
    id: "guidance",
    label: "体験・ワークショップ",
    emoji: "🎨",
    iconBg: "#FFF3E6",
    roleTypes: ["guidance", "reception"],
    keywords: ["体験", "ワークショップ", "WS", "教室", "工作"],
  },
  {
    id: "reception",
    label: "学び・講座",
    emoji: "📚",
    iconBg: "#E8F5E9",
    roleTypes: ["reception", "guidance"],
    keywords: ["学び", "講座", "勉強", "セミナー", "学習"],
  },
  {
    id: "reception_community",
    label: "交流会・コミュニティ",
    emoji: "🤝",
    iconBg: "#E3F2FD",
    roleTypes: ["reception"],
    keywords: ["交流", "コミュニティ", "つながり", "meetup"],
  },
  {
    id: "streaming",
    label: "音楽・ライブ",
    emoji: "🎵",
    iconBg: "#F3E5F5",
    roleTypes: ["streaming", "photo"],
    keywords: ["音楽", "ライブ", "演奏", "コンサート"],
  },
  {
    id: "cleaning",
    label: "環境・自然",
    emoji: "🌿",
    iconBg: "#E8F5E9",
    roleTypes: ["cleaning"],
    keywords: ["環境", "自然", "清掃", "ごみ", "緑化", "ビーチ"],
  },
  {
    id: "guidance_kids",
    label: "子ども・教育",
    emoji: "🧒",
    iconBg: "#FFF8E1",
    roleTypes: ["guidance"],
    keywords: ["子ども", "こども", "教育", "親子", "キッズ"],
  },
  {
    id: "disaster",
    label: "福祉・サポート",
    emoji: "🏥",
    iconBg: "#FCE4EC",
    roleTypes: ["disaster", "reception"],
    keywords: ["福祉", "介護", "支援", "サポート", "病院"],
  },
];

const CATEGORY_BY_ID = new Map(
  VOLUNTEER_DISCOVER_CATEGORIES.map((c) => [c.id, c])
);

/** 旧 roleType（operation 等）との互換 */
const LEGACY_ROLE_TYPE_IDS = new Set([
  "operation",
  "reception",
  "guidance",
  "cleaning",
  "photo",
  "translation",
  "streaming",
  "system",
  "tech_other",
  "setup",
  "disaster",
]);

type MatchableRole = {
  roleType: string;
  title: string;
  description: string;
};

export function matchesVolunteerDiscoverCategory(
  role: MatchableRole,
  categoryId: string
): boolean {
  if (!categoryId) return true;

  const cat = CATEGORY_BY_ID.get(categoryId);
  if (cat) {
    if (cat.roleTypes?.includes(role.roleType as VolunteerRoleType)) return true;
    if (cat.keywords?.length) {
      const text = `${role.title} ${role.description}`;
      if (cat.keywords.some((kw) => text.includes(kw))) return true;
    }
    return false;
  }

  if (LEGACY_ROLE_TYPE_IDS.has(categoryId)) {
    return role.roleType === categoryId;
  }

  return role.roleType === categoryId;
}

export function getVolunteerDiscoverCategoryLabel(categoryId: string): string {
  if (!categoryId) return "すべて";
  return CATEGORY_BY_ID.get(categoryId)?.label ?? categoryId;
}
