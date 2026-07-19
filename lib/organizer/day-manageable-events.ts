import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLIC_EVENT_STATUSES, isPublicEventStatus } from "@/lib/public-events";
import {
  normalizeEventFormat,
  normalizeOnlineService,
  type EventFormat,
  type OnlineService,
} from "@/lib/event-online";

/** 当日運営ダッシュボードのイベント切替に必要な最小フィールド */
export type DayManageableEvent = {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string | null;
  location?: string;
  status: "public" | "ended";
  visibilityStatus: "published";
  eventFormat?: EventFormat;
  onlineService?: OnlineService | null;
};

function getEventEndAtJst(date: string, endTime?: string | null): Date {
  const t = endTime && endTime.trim() ? endTime : "23:59";
  return new Date(`${date}T${t}:00+09:00`);
}

function toDayStatus(event: {
  date: string;
  status?: string | null;
  endTime?: string | null;
}): "public" | "ended" | null {
  if (event.status === "archived" || event.status === "draft") return null;
  if (event.status && !isPublicEventStatus(event.status)) return null;
  const endAtJst = getEventEndAtJst(event.date, event.endTime);
  return endAtJst.getTime() >= Date.now() ? "public" : "ended";
}

/**
 * 当日運営用の公開・終了イベント一覧（アーカイブ/下書き除外）。
 * 参加人数や応募などの重い集計は行わない。
 */
export async function fetchDayManageableEvents(
  supabase: SupabaseClient,
  organizerId: string,
  limit = 80
): Promise<DayManageableEvent[]> {
  type DayEventRow = {
    id: string;
    title: string;
    date: string;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    status?: string | null;
    event_format?: string | null;
    online_service?: string | null;
  };

  let data: DayEventRow[] | null = null;
  let error: { message: string } | null = null;

  {
    const first = await supabase
      .from("events")
      .select(
        "id, title, date, start_time, end_time, location, status, event_format, online_service"
      )
      .eq("organizer_id", organizerId)
      .in("status", [...PUBLIC_EVENT_STATUSES])
      .order("date", { ascending: false })
      .limit(limit);
    data = (first.data as DayEventRow[] | null) ?? null;
    error = first.error;
  }

  if (error && /event_format|online_service/i.test(error.message)) {
    const fallback = await supabase
      .from("events")
      .select("id, title, date, start_time, end_time, location, status")
      .eq("organizer_id", organizerId)
      .in("status", [...PUBLIC_EVENT_STATUSES])
      .order("date", { ascending: false })
      .limit(limit);
    data = (fallback.data as DayEventRow[] | null) ?? null;
    error = fallback.error;
  }

  if (error) throw error;

  const events: DayManageableEvent[] = [];
  for (const row of data ?? []) {
    const endTime = row.end_time ?? null;
    const status = toDayStatus({
      date: row.date,
      status: row.status ?? null,
      endTime,
    });
    if (!status) continue;
    events.push({
      id: row.id,
      title: row.title,
      date: row.date,
      startTime: row.start_time ?? undefined,
      endTime,
      location: row.location ?? undefined,
      status,
      visibilityStatus: "published",
      eventFormat: normalizeEventFormat(row.event_format),
      onlineService: normalizeOnlineService(row.online_service),
    });
  }

  return events.sort((a, b) => {
    if (a.status === "public" && b.status !== "public") return -1;
    if (a.status !== "public" && b.status === "public") return 1;
    return a.status === "public"
      ? a.date.localeCompare(b.date)
      : b.date.localeCompare(a.date);
  });
}
