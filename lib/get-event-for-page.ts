/**
 * 公開イベント詳細ページ用：DB を優先し、なければモック/ストアから取得
 */
import type { Event } from "./db/types";
import { createClient } from "@/lib/supabase/server";
import {
  fetchPublishedEventWithOrganizerInfo,
  fetchOtherPublishedEventsByOrganizer,
  fetchRelatedPublishedEvents,
  type EventWithOrganizerInfo,
} from "./db/events";
import { getEventById } from "./events";

export type EventForPublicPage = EventWithOrganizerInfo & {
  otherEvents?: Event[];
  relatedEvents?: Event[];
};

/** 公開イベント1件取得 + 主催者情報 + 他イベント（DB優先） */
export async function getEventForPublicPage(id: string): Promise<EventForPublicPage | null> {
  const supabase = await createClient();
  if (supabase) {
    try {
      const eventWithOrg = await fetchPublishedEventWithOrganizerInfo(supabase, id);
      if (eventWithOrg) {
        const otherEvents =
          eventWithOrg.organizerId != null
            ? await fetchOtherPublishedEventsByOrganizer(
                supabase,
                eventWithOrg.organizerId,
                id,
                3
              )
            : [];
        const relatedEvents = await fetchRelatedPublishedEvents(
          supabase,
          {
            id,
            tags: eventWithOrg.tags ?? [],
            prefecture: eventWithOrg.prefecture ?? undefined,
          },
          4
        );
        return { ...eventWithOrg, otherEvents, relatedEvents };
      }
    } catch {
      // DB未接続 or スキーマ未適用時はフォールバック
    }
  }
  const fallback = getEventById(id);
  return fallback ? { ...fallback } : null;
}
