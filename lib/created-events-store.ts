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
