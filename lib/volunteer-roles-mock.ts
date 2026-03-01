/** イベント付きボランティア募集枠（モック） */

export type VolunteerRoleType =
  | "operation"
  | "reception"
  | "guidance"
  | "cleaning"
  | "photo"
  | "translation"
  | "streaming"
  | "system"
  | "tech_other"
  | "setup"
  | "disaster";

/** 待遇チップ用（一覧表示） */
export type Benefit =
  | "TRANSPORT"
  | "LODGING"
  | "MEAL"
  | "REWARD"
  | "INSURANCE"
  | "SHUTTLE";

/** 待遇の詳細（詳細ページ用） */
export type SupportDetail = {
  transport?: { enabled: boolean; maxYen?: number; note?: string };
  lodging?: { enabled: boolean; maxYen?: number; note?: string };
  meal?: { enabled: boolean; note?: string };
  reward?: { enabled: boolean; note?: string };
  insurance?: { enabled: boolean; note?: string };
};

/** 緊急募集フラグ */
export type EmergencyInfo = {
  isEmergency?: boolean;
  urgencyLevel?: 1 | 2 | 3 | 4 | 5;
  activeTo?: string;
};

export type VolunteerRole = {
  id: string;
  eventId: string;
  roleType: VolunteerRoleType;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  capacity: number;
  skills?: string;
  perksText?: string;
  hasTransportSupport: boolean;
  hasHonorarium: boolean;
  createdAt: string;
  /** サムネイル（16:9推奨） */
  thumbnailUrl?: string;
  /** 一覧の待遇チップ用 */
  benefits?: Benefit[];
  /** 待遇の詳細（詳細ページ用） */
  supportDetail?: SupportDetail;
  /** 緊急募集 */
  emergency?: EmergencyInfo;
};

export const VOLUNTEER_ROLE_LABELS: Record<VolunteerRoleType, string> = {
  operation: "運営",
  reception: "受付",
  guidance: "案内",
  cleaning: "清掃",
  photo: "写真撮影",
  translation: "翻訳",
  streaming: "配信",
  system: "システム補助",
  tech_other: "技術ボランティア（その他）",
  setup: "設営",
  disaster: "災害",
};

/** 待遇チップの表示ラベル */
export const BENEFIT_LABELS: Record<Benefit, string> = {
  TRANSPORT: "交通費",
  LODGING: "宿泊",
  MEAL: "食事",
  REWARD: "謝礼",
  INSURANCE: "保険",
  SHUTTLE: "送迎",
};

/** 待遇チップの優先順位（表示順） */
export const BENEFIT_ORDER: Benefit[] = [
  "LODGING",
  "TRANSPORT",
  "REWARD",
  "MEAL",
  "INSURANCE",
  "SHUTTLE",
];

const rolesByEvent = new Map<string, VolunteerRole[]>();

function uuid() {
  return `vr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// 初期データ
const VOLUNTEER_IMAGES = [
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
];

function seedRoles() {
  if (rolesByEvent.size > 0) return;
  const r1: VolunteerRole = {
    id: uuid(),
    eventId: "1",
    roleType: "reception",
    title: "受付スタッフ",
    description: "来場者の受付・案内を担当していただきます。",
    dateTime: "2025-02-12 09:30〜12:00",
    location: "中央公園 メイン入口",
    capacity: 3,
    skills: "丁寧な対応",
    perksText: "昼食提供、記念品",
    hasTransportSupport: true,
    hasHonorarium: false,
    createdAt: "2025-02-01T10:00:00Z",
    thumbnailUrl: VOLUNTEER_IMAGES[0],
    benefits: ["TRANSPORT", "MEAL"],
    supportDetail: {
      transport: { enabled: true, maxYen: 3000, note: "実費・上限あり" },
      meal: { enabled: true, note: "昼食提供" },
    },
  };
  const r2: VolunteerRole = {
    id: uuid(),
    eventId: "1",
    roleType: "photo",
    title: "写真撮影ボランティア",
    description: "イベントの様子を記録写真として撮影していただきます。",
    dateTime: "2025-02-12 10:00〜15:00",
    location: "中央公園 会場内",
    capacity: 2,
    skills: "カメラ持参可能",
    perksText: "交通費支給、謝礼あり",
    hasTransportSupport: true,
    hasHonorarium: true,
    createdAt: "2025-02-01T10:00:00Z",
    thumbnailUrl: VOLUNTEER_IMAGES[1],
    benefits: ["TRANSPORT", "REWARD"],
    supportDetail: {
      transport: { enabled: true, maxYen: 5000 },
      reward: { enabled: true, note: "謝礼あり" },
    },
  };
  const r3: VolunteerRole = {
    id: uuid(),
    eventId: "3",
    roleType: "translation",
    title: "英語翻訳・案内サポート",
    description: "観光客向けに英語での案内・翻訳をお手伝いいただきます。",
    dateTime: "2025-02-14 13:00〜16:00",
    location: "工芸館",
    capacity: 2,
    perksText: "交通費支給、特典あり",
    hasTransportSupport: true,
    hasHonorarium: false,
    createdAt: "2025-02-08T14:00:00Z",
    thumbnailUrl: VOLUNTEER_IMAGES[2],
    benefits: ["TRANSPORT"],
    supportDetail: {
      transport: { enabled: true, maxYen: 2000 },
    },
  };
  const r4: VolunteerRole = {
    id: uuid(),
    eventId: "1",
    roleType: "disaster",
    title: "災害復興ボランティア（緊急）",
    description: "被災地での片付け・泥だし・物資整理をお手伝いいただきます。",
    dateTime: "2025-02-15 08:00〜17:00",
    location: "被災地域 現地集合",
    capacity: 10,
    perksText: "宿泊・交通費・食事・保険",
    hasTransportSupport: true,
    hasHonorarium: false,
    createdAt: "2025-02-20T09:00:00Z",
    thumbnailUrl: VOLUNTEER_IMAGES[3],
    benefits: ["LODGING", "TRANSPORT", "MEAL", "INSURANCE"],
    supportDetail: {
      transport: { enabled: true, maxYen: 10000, note: "往復交通費" },
      lodging: { enabled: true, maxYen: 5000, note: "宿泊手当" },
      meal: { enabled: true, note: "昼食提供" },
      insurance: { enabled: true, note: "ボランティア保険加入済" },
    },
    emergency: {
      isEmergency: true,
      urgencyLevel: 5,
      activeTo: "2025-02-25",
    },
  };
  rolesByEvent.set("1", [r1, r2, r4]);
  rolesByEvent.set("3", [r3]);
}

export function getVolunteerRolesByEvent(eventId: string): VolunteerRole[] {
  seedRoles();
  return rolesByEvent.get(eventId) ?? [];
}

export function getAllVolunteerRoles(): VolunteerRole[] {
  seedRoles();
  return Array.from(rolesByEvent.values()).flat();
}

export function getVolunteerRoleById(id: string): VolunteerRole | null {
  seedRoles();
  return getAllVolunteerRoles().find((r) => r.id === id) ?? null;
}
