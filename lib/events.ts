// フィルタ・検索ユーティリティ（Event[] に対して適用）
import type { Event } from "./db/types";
import { mockEvents } from "./events-mock";
import { getCreatedEvents } from "./created-events-store";

export type { Event, EventFormData } from "./db/types";

function getAllEvents(): Event[] {
  return [...mockEvents, ...getCreatedEvents()];
}

export function getEvents(): Event[] {
  return getAllEvents();
}

export function getEventById(id: string): Event | null {
  return getAllEvents().find((e) => e.id === id) ?? null;
}

export type DateRangeFilter = "all" | "today" | "week" | "weekend" | "month" | "3months";

export function getEventsByDateRange(
  events: Event[],
  range: DateRangeFilter,
  specificDate?: string | null
): Event[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  if (specificDate) {
    return events.filter((e) => e.date === specificDate);
  }

  if (range === "all") return events;
  if (range === "today") {
    return events.filter((e) => e.date === todayStr);
  }

  if (range === "weekend") {
    return events.filter((e) => {
      if (e.date < todayStr) return false;
      const d = new Date(e.date + "T12:00:00");
      const day = d.getDay();
      return day === 0 || day === 6;
    });
  }

  const getEndDate = (days: number) => {
    const end = new Date(today);
    end.setDate(end.getDate() + days);
    return end.toISOString().split("T")[0];
  };

  const endStr =
    range === "week"
      ? getEndDate(7)
      : range === "month"
        ? getEndDate(30)
        : range === "3months"
          ? getEndDate(90)
          : getEndDate(7);

  return events.filter((e) => e.date >= todayStr && e.date <= endStr);
}

export type EventStatus = "available" | "full" | "ended";

export function getEventStatus(e: Event): EventStatus {
  const todayStr = new Date().toISOString().split("T")[0];
  if (e.date < todayStr) return "ended";
  if (e.capacity != null && e.capacity <= 0) return "full";
  return "available";
}

export function filterEventsByAvailableOnly(
  events: Event[],
  availableOnly: boolean
): Event[] {
  if (!availableOnly) return events;
  return events.filter((e) => getEventStatus(e) === "available");
}

export type EventSort = "date_asc" | "date_desc" | "newest";

export function sortEvents(
  events: Event[],
  sort: EventSort
): Event[] {
  const copy = [...events];
  if (sort === "date_asc") {
    return copy.sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || ""));
  }
  if (sort === "date_desc") {
    return copy.sort((a, b) => b.date.localeCompare(a.date) || (b.startTime || "").localeCompare(a.startTime || ""));
  }
  if (sort === "newest") {
    return copy.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
  return copy;
}

export function filterEventsByPrice(
  events: Event[],
  filter: "all" | "free" | "paid"
): Event[] {
  if (filter === "all") return events;
  if (filter === "free") return events.filter((e) => e.price === 0);
  return events.filter((e) => e.price > 0);
}

export function filterEventsByChildFriendly(
  events: Event[],
  childFriendly: boolean
): Event[] {
  if (!childFriendly) return events;
  return events.filter((e) => e.childFriendly);
}

export function searchEvents(events: Event[], query: string): Event[] {
  if (!query.trim()) return events;
  const q = query.toLowerCase();
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.organizerName.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
  );
}

export function filterEventsByRegion(
  events: Event[],
  prefecture?: string,
  city?: string
): Event[] {
  let result = events;
  if (prefecture?.trim()) {
    result = result.filter((e) => e.prefecture === prefecture);
  }
  if (city?.trim()) {
    result = result.filter((e) => e.city === city);
  }
  return result;
}

export function filterEventsByTags(
  events: Event[],
  tags: string[]
): Event[] {
  if (!tags.length) return events;
  return events.filter((e) => {
    const eventTags = e.tags ?? [];
    return tags.every((t) => eventTags.includes(t));
  });
}

export type RankingType = "newest" | "popular" | "satisfaction";

/**
 * おすすめイベント（最大3件）
 * 優先順位: 1) 開催中（今日） 2) 近日（startが近い） 3) isFeatured（あれば）
 */
export function getRecommendedEvents(events: Event[], limit = 3): Event[] {
  const todayStr = new Date().toISOString().split("T")[0];
  const futureOrToday = events.filter((e) => e.date >= todayStr);
  const copy = [...futureOrToday];
  copy.sort((a, b) => {
    const aToday = a.date === todayStr ? 1 : 0;
    const bToday = b.date === todayStr ? 1 : 0;
    if (aToday !== bToday) return bToday - aToday;
    return a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || "");
  });
  return copy.slice(0, limit);
}

export function getRankedEvents(
  events: Event[],
  type: RankingType,
  limit = 10
): Event[] {
  const todayStr = new Date().toISOString().split("T")[0];
  const futureOrToday = events.filter((e) => e.date >= todayStr);
  const copy = [...futureOrToday];

  if (type === "newest") {
    copy.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } else if (type === "popular") {
    copy.sort((a, b) => (b.participantCount ?? 0) - (a.participantCount ?? 0));
  } else {
    copy.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  }

  return copy.slice(0, limit);
}

// 2点間の距離（km）概算（Haversine 簡易版）
export function calcDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
