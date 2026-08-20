/**
 * 店舗に紐づくイベントの取得・表示用ヘルパー
 */
import type { Event } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";
import { fetchEventsByStoreId } from "@/lib/db/events";
import { listCreatedEventsByStoreId } from "@/lib/created-events-store";
import {
  DEMO_ORGANIZER_STORE,
  DEMO_STORE_ID,
  type StoreLinkedEvent,
} from "@/lib/organizer/store-management-mock";
import { isPublicEventLike } from "@/lib/sample-events";
import { isPublicEventStatus } from "@/lib/public-events";
import { getJstTodayYmd } from "@/lib/jst-date";

export type StoreLinkedEventView = {
  id: string;
  title: string;
  dateLabel: string;
  startTime?: string;
  status?: Event["status"];
  imageUrl?: string | null;
  href: string;
};

function formatDateLabel(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.slice(0, 10).replace(/-/g, "/");
  }
  return date;
}

function formatTimeLabel(time: string | undefined): string | undefined {
  if (!time) return undefined;
  const m = String(time).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export function eventToStoreLinkedView(
  event: Pick<Event, "id" | "title" | "date" | "startTime" | "status" | "imageUrl">,
  hrefPrefix: "public" | "organizer" = "public",
): StoreLinkedEventView {
  return {
    id: event.id,
    title: event.title,
    dateLabel: formatDateLabel(event.date),
    startTime: formatTimeLabel(event.startTime),
    status: event.status,
    imageUrl: event.imageUrl,
    href:
      hrefPrefix === "organizer"
        ? `/organizer/events/${event.id}`
        : `/events/${event.id}`,
  };
}

function demoFallbackViews(
  storeId: string,
  hrefPrefix: "public" | "organizer",
): StoreLinkedEventView[] {
  if (storeId !== DEMO_STORE_ID && storeId !== "demo") return [];
  return DEMO_ORGANIZER_STORE.linkedEvents.map((e: StoreLinkedEvent) => ({
    id: e.id,
    title: e.title,
    dateLabel: e.dateLabel,
    href:
      hrefPrefix === "organizer"
        ? `/organizer/events`
        : `/events`,
  }));
}

function isMemoryStoreId(id: string): boolean {
  return id === "demo" || id.startsWith("demo-") || id.startsWith("store-mem-");
}

/** 主催管理用：店舗に紐づくイベント（下書き含む） */
export async function listStoreEventsForOrganizer(
  storeId: string,
): Promise<StoreLinkedEventView[]> {
  const resolvedId =
    storeId === "demo" ? DEMO_STORE_ID : storeId;

  const fromMemory = listCreatedEventsByStoreId(resolvedId).map((e) =>
    eventToStoreLinkedView(e, "organizer"),
  );

  if (isMemoryStoreId(resolvedId)) {
    return fromMemory.length > 0
      ? fromMemory
      : demoFallbackViews(resolvedId, "organizer");
  }

  const supabase = await createClient();
  if (!supabase) {
    return fromMemory.length > 0
      ? fromMemory
      : demoFallbackViews(resolvedId, "organizer");
  }

  try {
    const dbEvents = await fetchEventsByStoreId(supabase, resolvedId);
    const views = dbEvents.map((e) => eventToStoreLinkedView(e, "organizer"));
    const ids = new Set(views.map((v) => v.id));
    const merged = [
      ...views,
      ...fromMemory.filter((v) => !ids.has(v.id)),
    ];
    return merged.length > 0
      ? merged
      : demoFallbackViews(resolvedId, "organizer");
  } catch (e) {
    console.error("listStoreEventsForOrganizer:", e);
    return fromMemory.length > 0
      ? fromMemory
      : demoFallbackViews(resolvedId, "organizer");
  }
}

/** 公開ページ用：公開中の今後のイベント */
export async function listStoreEventsForPublic(
  storeId: string,
): Promise<StoreLinkedEventView[]> {
  const resolvedId =
    storeId === "demo" ? DEMO_STORE_ID : storeId;
  const today = getJstTodayYmd();

  const filterUpcoming = (events: Event[]) =>
    events
      .filter((e) => isPublicEventStatus(e.status) && isPublicEventLike(e))
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const fromMemory = filterUpcoming(listCreatedEventsByStoreId(resolvedId)).map(
    (e) => eventToStoreLinkedView(e, "public"),
  );

  if (isMemoryStoreId(resolvedId)) {
    return fromMemory.length > 0
      ? fromMemory
      : demoFallbackViews(resolvedId, "public");
  }

  const supabase = await createClient();
  if (!supabase) {
    return fromMemory.length > 0
      ? fromMemory
      : demoFallbackViews(resolvedId, "public");
  }

  try {
    const dbEvents = await fetchEventsByStoreId(supabase, resolvedId, {
      publishedOnly: true,
    });
    const views = filterUpcoming(dbEvents).map((e) =>
      eventToStoreLinkedView(e, "public"),
    );
    const ids = new Set(views.map((v) => v.id));
    const merged = [
      ...views,
      ...fromMemory.filter((v) => !ids.has(v.id)),
    ];
    return merged.length > 0
      ? merged
      : demoFallbackViews(resolvedId, "public");
  } catch (e) {
    console.error("listStoreEventsForPublic:", e);
    return fromMemory.length > 0
      ? fromMemory
      : demoFallbackViews(resolvedId, "public");
  }
}
