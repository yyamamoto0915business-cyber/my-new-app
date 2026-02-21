// フィルタ・検索ユーティリティ（Event[] に対して適用）
import type { Event } from "./db/types";
import { mockEvents } from "./events-mock";

export type { Event, EventFormData } from "./db/types";

export function getEvents(): Event[] {
  return mockEvents;
}

export function getEventById(id: string): Event | null {
  return mockEvents.find((e) => e.id === id) ?? null;
}

export type DateRangeFilter = "all" | "today" | "week" | "weekend";

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

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split("T")[0];
  return events.filter((e) => e.date >= todayStr && e.date <= weekEndStr);
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
