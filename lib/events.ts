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

export function getEventsByDateRange(
  events: Event[],
  range: "today" | "week"
): Event[] {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  if (range === "today") {
    return events.filter((e) => e.date === todayStr);
  }

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split("T")[0];
  return events.filter((e) => e.date >= todayStr && e.date <= weekEndStr);
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
