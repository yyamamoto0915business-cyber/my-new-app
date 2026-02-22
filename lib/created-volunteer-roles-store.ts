/** 作成イベント用のボランティア募集枠（開発用・インメモリ） */
import type { Event } from "./db/types";

export type CreatedVolunteerRole = {
  id: string;
  eventId: string;
  roleType: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  capacity: number;
  perksText?: string;
  hasTransportSupport: boolean;
  hasHonorarium: boolean;
  createdAt: string;
};

const createdRoles: CreatedVolunteerRole[] = [];
let nextRoleId = 1000;

export function addDefaultVolunteerRoleForEvent(event: Event): CreatedVolunteerRole {
  const dateTime = event.endTime
    ? `${event.date} ${event.startTime}〜${event.endTime}`
    : `${event.date} ${event.startTime}〜`;
  const role: CreatedVolunteerRole = {
    id: `vr-created-${nextRoleId++}`,
    eventId: event.id,
    roleType: "operation",
    title: "イベントスタッフ",
    description: event.description?.slice(0, 100) || "イベントのお手伝いをお願いします。",
    dateTime,
    location: event.location,
    capacity: 5,
    perksText: "謝礼・交通費はイベントにより異なります",
    hasTransportSupport: false,
    hasHonorarium: false,
    createdAt: new Date().toISOString(),
  };
  createdRoles.push(role);
  return role;
}

export function getCreatedVolunteerRoles(): CreatedVolunteerRole[] {
  return [...createdRoles];
}

export function getCreatedVolunteerRolesByEvent(eventId: string): CreatedVolunteerRole[] {
  return createdRoles.filter((r) => r.eventId === eventId);
}
