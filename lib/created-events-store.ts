/** 主催者が作成したイベントの一時ストア（開発用・インメモリ） */
import type { Event } from "./db/types";

const createdEvents: Event[] = [];
let nextId = 100;

export function addCreatedEvent(data: Omit<Event, "id" | "createdAt">): Event {
  const id = String(nextId++);
  const event: Event = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
    imageUrl: data.imageUrl?.trim() || null,
  };
  createdEvents.push(event);
  return event;
}

export function getCreatedEvents(): Event[] {
  return [...createdEvents];
}

export function getCreatedEventById(id: string): Event | null {
  return createdEvents.find((e) => e.id === id) ?? null;
}

export function updateCreatedEvent(
  id: string,
  data: Partial<Omit<Event, "id" | "createdAt">>
): Event | null {
  const idx = createdEvents.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const prev = createdEvents[idx];
  createdEvents[idx] = {
    ...prev,
    ...data,
    id: prev.id,
    createdAt: prev.createdAt,
    imageUrl: data.imageUrl !== undefined ? (data.imageUrl?.trim() || null) : prev.imageUrl,
  };
  return createdEvents[idx];
}

export function deleteCreatedEvent(id: string): boolean {
  const idx = createdEvents.findIndex((e) => e.id === id);
  if (idx < 0) return false;
  createdEvents.splice(idx, 1);
  return true;
}
