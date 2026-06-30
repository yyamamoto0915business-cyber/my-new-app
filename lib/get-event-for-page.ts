/**
 * 公開イベント詳細ページ用：DB を優先し、なければモック/ストアから取得
 */
import type { Event } from "./db/types";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import {
  fetchPublishedEventWithOrganizerInfo,
  fetchEventWithOrganizerInfo,
  fetchOtherPublishedEventsByOrganizer,
  fetchRelatedPublishedEvents,
  getOrganizerIdByEventId,
  type EventWithOrganizerInfo,
} from "./db/events";
import { getOrganizerIdByProfileId } from "./db/recruitments-mvp";
import { getEventById } from "./events";
import { isPublicEventStatus } from "./public-events";

export type EventForPublicPage = EventWithOrganizerInfo & {
  otherEvents?: Event[];
  relatedEvents?: Event[];
  /** 主催者本人による未公開プレビュー */
  isOrganizerPreview?: boolean;
};

async function enrichPublishedEvent(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  eventWithOrg: EventWithOrganizerInfo,
  id: string
): Promise<EventForPublicPage> {
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

/** 公開イベント1件取得 + 主催者情報 + 他イベント（DB優先） */
export async function getEventForPublicPage(id: string): Promise<EventForPublicPage | null> {
  const supabase = await createClient();
  if (supabase) {
    try {
      const eventWithOrg = await fetchPublishedEventWithOrganizerInfo(supabase, id);
      if (eventWithOrg) {
        return enrichPublishedEvent(supabase, eventWithOrg, id);
      }

      const user = await getApiUser();
      if (user) {
        const [organizerId, eventOrganizerId] = await Promise.all([
          getOrganizerIdByProfileId(supabase, user.id),
          getOrganizerIdByEventId(supabase, id),
        ]);
        if (organizerId && eventOrganizerId === organizerId) {
          const ownerEvent = await fetchEventWithOrganizerInfo(supabase, id);
          if (ownerEvent) {
            const otherEvents =
              ownerEvent.organizerId != null
                ? await fetchOtherPublishedEventsByOrganizer(
                    supabase,
                    ownerEvent.organizerId,
                    id,
                    3
                  )
                : [];
            return {
              ...ownerEvent,
              otherEvents,
              relatedEvents: [],
              isOrganizerPreview: !isPublicEventStatus(ownerEvent.status),
            };
          }
        }
      }
    } catch {
      // DB未接続 or スキーマ未適用時はフォールバック
    }
  }
  const fallback = getEventById(id);
  return fallback ? { ...fallback } : null;
}
