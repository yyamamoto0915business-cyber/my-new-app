/**
 * Supabase 未設定時の募集ストア（開発用・インメモリ）
 */
import type { RecruitmentRole } from "./db/recruitments-mvp";

export type StoreRecruitment = {
  id: string;
  organizer_id: string;
  event_id: string | null;
  type: string;
  title: string;
  description: string;
  status: "draft" | "public" | "closed";
  start_at: string | null;
  end_at: string | null;
  meeting_place: string | null;
  meeting_lat: number | null;
  meeting_lng: number | null;
  roles: RecruitmentRole[];
  capacity: number | null;
  items_to_bring: string | null;
  provisions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  organizers?: { organization_name: string | null };
};

export type StoreApplication = {
  id: string;
  recruitment_id: string;
  user_id: string;
  status: string;
  message: string | null;
  checked_in_at: string | null;
  role_assigned: string | null;
  created_at: string;
};

const DEV_ORGANIZER_ID = "dev-organizer";
const now = new Date();
const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
const in21Days = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

const recruitments: StoreRecruitment[] = [
  {
    id: "store-r-seed-1",
    organizer_id: DEV_ORGANIZER_ID,
    event_id: null,
    type: "volunteer",
    title: "春のフリマ 受付スタッフ募集",
    description: "春のフリーマーケットで受付を担当していただける方を募集しています。",
    status: "public",
    start_at: in7Days.toISOString(),
    end_at: new Date(in7Days.getTime() + 6 * 60 * 60 * 1000).toISOString(),
    meeting_place: "〇〇公民館 正面玄関前",
    meeting_lat: 35.6812,
    meeting_lng: 139.7671,
    roles: [{ name: "受付", count: 2 }, { name: "誘導", count: 1 }],
    capacity: 5,
    items_to_bring: "動きやすい服、飲み物、タオル",
    provisions: "昼食支給",
    notes: "雨天時は屋内で開催",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    organizers: { organization_name: "開発用主催者" },
  },
  {
    id: "store-r-seed-2",
    organizer_id: DEV_ORGANIZER_ID,
    event_id: null,
    type: "volunteer",
    title: "地域イベント 物販スタッフ",
    description: "地域のお祭りで物販ブースの運営をお手伝いいただける方を募集します。",
    status: "public",
    start_at: in14Days.toISOString(),
    end_at: new Date(in14Days.getTime() + 8 * 60 * 60 * 1000).toISOString(),
    meeting_place: "△△公園 東口集合",
    meeting_lat: 35.6912,
    meeting_lng: 139.7771,
    roles: [{ name: "物販", count: 2 }, { name: "レジ", count: 1 }],
    capacity: 3,
    items_to_bring: "エプロン（あれば）",
    provisions: "交通費実費支給",
    notes: "混雑時は立つことが多いです",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    organizers: { organization_name: "開発用主催者" },
  },
  {
    id: "store-r-seed-3",
    organizer_id: DEV_ORGANIZER_ID,
    event_id: null,
    type: "volunteer",
    title: "ワークショップ 設営・撤収スタッフ",
    description: "子ども向けワークショップの設営と撤収をお手伝いいただける方を募集します。",
    status: "public",
    start_at: in21Days.toISOString(),
    end_at: new Date(in21Days.getTime() + 5 * 60 * 60 * 1000).toISOString(),
    meeting_place: "□□区民センター 1Fロビー",
    meeting_lat: 35.6712,
    meeting_lng: 139.7571,
    roles: [{ name: "設営", count: 2 }, { name: "撤収", count: 2 }],
    capacity: 4,
    items_to_bring: "作業しやすい服",
    provisions: "軽食支給",
    notes: "重い物を運ぶ作業があります",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    organizers: { organization_name: "開発用主催者" },
  },
];
const applications: StoreApplication[] = [];
let nextRecId = 100;
let nextAppId = 1;

export function addStoreRecruitment(input: Omit<StoreRecruitment, "id" | "created_at" | "updated_at">): StoreRecruitment {
  const id = `store-r-${nextRecId++}`;
  const now = new Date().toISOString();
  const r: StoreRecruitment = {
    ...input,
    id,
    created_at: now,
    updated_at: now,
    organizers: { organization_name: "開発用主催者" },
  };
  recruitments.push(r);
  return r;
}

export function updateStoreRecruitment(
  id: string,
  organizerId: string,
  updates: Partial<Omit<StoreRecruitment, "id" | "organizer_id" | "created_at">>
): StoreRecruitment | null {
  const idx = recruitments.findIndex((r) => r.id === id && r.organizer_id === organizerId);
  if (idx < 0) return null;
  const updated = { ...recruitments[idx], ...updates, updated_at: new Date().toISOString() };
  recruitments[idx] = updated;
  return updated;
}

export function getStoreRecruitmentById(id: string): StoreRecruitment | null {
  return recruitments.find((r) => r.id === id) ?? null;
}

export function getStoreRecruitmentsPublic(limit = 50): StoreRecruitment[] {
  return recruitments
    .filter((r) => r.status === "public")
    .sort((a, b) => (a.start_at ?? "").localeCompare(b.start_at ?? ""))
    .slice(0, limit);
}

export function getStoreRecommendedRecruitments(limit = 3): StoreRecruitment[] {
  return recruitments
    .filter((r) => r.status === "public" && r.meeting_place)
    .sort((a, b) => (a.start_at ?? "").localeCompare(b.start_at ?? ""))
    .slice(0, limit);
}

export function getStoreRecruitmentsByOrganizer(organizerId: string): StoreRecruitment[] {
  return recruitments
    .filter((r) => r.organizer_id === organizerId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function addStoreApplication(
  recruitmentId: string,
  userId: string,
  message?: string
): StoreApplication {
  const id = `store-a-${nextAppId++}`;
  const app: StoreApplication = {
    id,
    recruitment_id: recruitmentId,
    user_id: userId,
    status: "pending",
    message: message ?? null,
    checked_in_at: null,
    role_assigned: null,
    created_at: new Date().toISOString(),
  };
  applications.push(app);
  return app;
}

export function getStoreApplicationStatus(
  recruitmentId: string,
  userId: string
): string | null {
  const app = applications.find(
    (a) => a.recruitment_id === recruitmentId && a.user_id === userId
  );
  return app?.status ?? null;
}

export function getStoreApplicationsByRecruitment(recruitmentId: string): StoreApplication[] {
  return applications
    .filter((a) => a.recruitment_id === recruitmentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function updateStoreApplication(
  applicationId: string,
  updates: Partial<Pick<StoreApplication, "status" | "checked_in_at" | "role_assigned">>
): StoreApplication | null {
  const idx = applications.findIndex((a) => a.id === applicationId);
  if (idx < 0) return null;
  applications[idx] = { ...applications[idx], ...updates };
  return applications[idx];
}

export function getDevOrganizerId(): string {
  return DEV_ORGANIZER_ID;
}
