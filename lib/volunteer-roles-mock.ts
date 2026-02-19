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
  | "tech_other";

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
};

const rolesByEvent = new Map<string, VolunteerRole[]>();

function uuid() {
  return `vr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// 初期データ
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
  };
  rolesByEvent.set("1", [r1, r2]);
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
