/**
 * 公開店舗詳細用のデータ取得
 */
import { createClient } from "@/lib/supabase/server";
import { fetchStoreById } from "@/lib/db/stores";
import { listStoreNewsByStoreId } from "@/lib/db/store-news";
import { listStoreMenuByStoreId } from "@/lib/db/store-menu";
import { listStoreSchedules } from "@/lib/db/store-schedules";
import { getMemoryStoreById } from "@/lib/stores/memory-store";
import { listMemoryStoreNews } from "@/lib/stores/memory-news";
import { listMemoryStoreMenu } from "@/lib/stores/memory-menu";
import { listMemoryStoreSchedules } from "@/lib/stores/memory-schedule";
import { DEMO_STORE_ID } from "@/lib/organizer/store-management-mock";
import {
  listStoreEventsForPublic,
  type StoreLinkedEventView,
} from "@/lib/stores/store-linked-events";
import { listUpcomingSchedules } from "@/lib/stores/schedule-view";
import type {
  StoreMenuRecord,
  StoreNewsRecord,
  StoreRecord,
  StoreScheduleRecord,
} from "@/lib/stores/types";

export type PublicStorePageData = {
  store: StoreRecord;
  news: StoreNewsRecord[];
  menu: StoreMenuRecord[];
  events: StoreLinkedEventView[];
  /** キッチンカー向け：今後の出店（中止除く） */
  schedules: StoreScheduleRecord[];
};

function isMemoryId(id: string): boolean {
  return id === "demo" || id.startsWith("demo-") || id.startsWith("store-mem-");
}

function resolveMemory(id: string): StoreRecord | null {
  return (
    getMemoryStoreById(id) ??
    (id === "demo" || id === DEMO_STORE_ID
      ? getMemoryStoreById(DEMO_STORE_ID)
      : null)
  );
}

/** 公開可能な店舗＋公開中ニュース／メニュー／連携イベントを返す。なければ null */
export async function getStoreForPublicPage(
  id: string,
): Promise<PublicStorePageData | null> {
  if (isMemoryId(id) || resolveMemory(id)) {
    const store = resolveMemory(id);
    if (!store) return null;
    if (store.status !== "public") return null;
    const news = listMemoryStoreNews(store.id).filter((n) => n.status === "public");
    const menu = listMemoryStoreMenu(store.id).filter((m) => m.status === "public");
    const events = await listStoreEventsForPublic(store.id);
    const schedules =
      store.kind === "kitchen_car"
        ? listUpcomingSchedules(listMemoryStoreSchedules(store.id))
        : [];
    return { store, news, menu, events, schedules };
  }

  const supabase = await createClient();
  if (!supabase) return null;

  try {
    const store = await fetchStoreById(supabase, id);
    if (!store || store.status !== "public") return null;
    const [allNews, allMenu, events, allSchedules] = await Promise.all([
      listStoreNewsByStoreId(supabase, id),
      listStoreMenuByStoreId(supabase, id),
      listStoreEventsForPublic(id),
      store.kind === "kitchen_car"
        ? listStoreSchedules(supabase, id)
        : Promise.resolve([] as StoreScheduleRecord[]),
    ]);
    return {
      store,
      news: allNews.filter((n) => n.status === "public"),
      menu: allMenu.filter((m) => m.status === "public"),
      events,
      schedules: listUpcomingSchedules(allSchedules),
    };
  } catch (e) {
    console.error("getStoreForPublicPage:", e);
    return null;
  }
}
