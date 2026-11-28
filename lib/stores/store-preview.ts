import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchStoreById } from "@/lib/db/stores";
import { listStoreMenuByStoreId } from "@/lib/db/store-menu";
import { listStoreNewsByStoreId } from "@/lib/db/store-news";
import { listStoreSchedules } from "@/lib/db/store-schedules";
import { listUpcomingSchedules } from "@/lib/stores/schedule-view";
import { getOrganizerById } from "@/lib/db/organizers";
import type { StoreMenuRecord, StoreNewsRecord, StoreRecord, StoreScheduleRecord } from "@/lib/stores/types";
import type { StoreHomepageOrganizer } from "@/components/stores/detail/StoreHomepage";

/**
 * 下書きのお店を、公開前に相手に見てもらうためのプレビューリンク。
 * リンクを知っている人だけが見られる。期限が来たら見られなくなる。発行・読み取りは管理用の接続だけ。
 */
export const STORE_PREVIEW_DAYS = 14;

export async function issueStorePreviewLinks(
  admin: SupabaseClient,
  organizerId: string,
): Promise<{ storeId: string; name: string; token: string; expiresAt: string }[]> {
  const { data } = await admin.from("stores").select("id, name").eq("organizer_id", organizerId).order("created_at");
  const expiresAt = new Date(Date.now() + STORE_PREVIEW_DAYS * 86400000).toISOString();
  const out: { storeId: string; name: string; token: string; expiresAt: string }[] = [];
  for (const s of (data ?? []) as { id: string; name: string }[]) {
    const token = randomBytes(18).toString("base64url");
    const { error } = await admin.from("stores").update({ preview_token: token, preview_expires_at: expiresAt }).eq("id", s.id);
    if (!error) out.push({ storeId: s.id, name: s.name, token, expiresAt });
  }
  return out;
}

export type StorePreviewData = {
  store: StoreRecord;
  menu: StoreMenuRecord[];
  news: StoreNewsRecord[];
  schedules: StoreScheduleRecord[];
  organizer: StoreHomepageOrganizer | null;
  expiresAt: string;
};

/** お店の id から、プレビューに出す中身を集める（公開前でも。呼ぶ前に見てよい人か確かめること） */
export async function loadStorePreviewById(admin: SupabaseClient, storeId: string): Promise<Omit<StorePreviewData, "expiresAt"> | null> {
  const store = await fetchStoreById(admin, storeId);
  if (!store) return null;
  const [menu, news, schedules, org] = await Promise.all([
    listStoreMenuByStoreId(admin, store.id),
    listStoreNewsByStoreId(admin, store.id),
    store.kind === "kitchen_car" ? listStoreSchedules(admin, store.id) : Promise.resolve([] as StoreScheduleRecord[]),
    getOrganizerById(admin, store.organizerId),
  ]);
  return {
    store,
    menu: menu.filter((m) => m.status === "public"),
    news: news.filter((n) => n.status === "public"),
    schedules: listUpcomingSchedules(schedules),
    organizer: org
      ? { id: org.id, name: org.organizationName, avatarUrl: org.avatarUrl, shortBio: org.shortBio, instagramUrl: org.instagramUrl }
      : null,
  };
}

export async function readStorePreview(admin: SupabaseClient, token: string): Promise<StorePreviewData | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const { data } = await admin.from("stores").select("id, preview_expires_at").eq("preview_token", token).maybeSingle();
  const row = data as { id: string; preview_expires_at: string | null } | null;
  if (!row?.preview_expires_at || Date.parse(row.preview_expires_at) <= Date.now()) return null;
  const store = await fetchStoreById(admin, row.id);
  if (!store) return null;
  const [menu, news, schedules, org] = await Promise.all([
    listStoreMenuByStoreId(admin, store.id),
    listStoreNewsByStoreId(admin, store.id),
    store.kind === "kitchen_car" ? listStoreSchedules(admin, store.id) : Promise.resolve([] as StoreScheduleRecord[]),
    getOrganizerById(admin, store.organizerId),
  ]);
  return {
    store,
    menu: menu.filter((m) => m.status === "public"),
    news: news.filter((n) => n.status === "public"),
    schedules: listUpcomingSchedules(schedules),
    organizer: org
      ? { id: org.id, name: org.organizationName, avatarUrl: org.avatarUrl, shortBio: org.shortBio, instagramUrl: org.instagramUrl }
      : null,
    expiresAt: row.preview_expires_at,
  };
}
