/**
 * 出店スケジュールの開発用インメモリ
 */
import {
  isStoreScheduleStatus,
  normalizeStoreDateInput,
  normalizeTimeInput,
  type StoreScheduleInput,
  type StoreScheduleRecord,
  type StoreScheduleStatus,
} from "@/lib/stores/types";

const schedules: StoreScheduleRecord[] = [];
let nextId = 1;

export function listMemoryStoreSchedules(storeId: string): StoreScheduleRecord[] {
  return schedules
    .filter((s) => s.storeId === storeId)
    .slice()
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .map((s) => ({ ...s }));
}

export function getMemoryStoreScheduleById(
  id: string,
): StoreScheduleRecord | null {
  const found = schedules.find((s) => s.id === id);
  return found ? { ...found } : null;
}

export function createMemoryStoreSchedule(
  storeId: string,
  input: StoreScheduleInput & { eventDate: string; eventName: string },
): StoreScheduleRecord {
  const eventDate = normalizeStoreDateInput(input.eventDate);
  if (!eventDate) throw new Error("出店日が不正です");
  const now = new Date().toISOString();
  const status: StoreScheduleStatus = input.status ?? "scheduled";
  const record: StoreScheduleRecord = {
    id: `sched-mem-${nextId++}`,
    storeId,
    eventDate,
    eventName: input.eventName.trim(),
    location: input.location?.trim() || null,
    startTime:
      normalizeTimeInput(input.startTime) ?? (input.startTime?.trim() || null),
    endTime:
      normalizeTimeInput(input.endTime) ?? (input.endTime?.trim() || null),
    stallArea: input.stallArea?.trim() || null,
    status,
    eventId: input.eventId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  schedules.push(record);
  return { ...record };
}

export function updateMemoryStoreSchedule(
  id: string,
  patch: StoreScheduleInput,
): StoreScheduleRecord | null {
  const idx = schedules.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const prev = schedules[idx];
  const now = new Date().toISOString();

  let eventDate = prev.eventDate;
  if (patch.eventDate !== undefined) {
    const d = normalizeStoreDateInput(patch.eventDate);
    if (!d) throw new Error("出店日が不正です");
    eventDate = d;
  }

  const next: StoreScheduleRecord = {
    ...prev,
    eventDate,
    eventName:
      patch.eventName !== undefined
        ? patch.eventName.trim() || prev.eventName
        : prev.eventName,
    location:
      patch.location !== undefined
        ? patch.location?.trim() || null
        : prev.location,
    startTime:
      patch.startTime !== undefined
        ? normalizeTimeInput(patch.startTime) ??
          (patch.startTime?.trim() || null)
        : prev.startTime,
    endTime:
      patch.endTime !== undefined
        ? normalizeTimeInput(patch.endTime) ?? (patch.endTime?.trim() || null)
        : prev.endTime,
    stallArea:
      patch.stallArea !== undefined
        ? patch.stallArea?.trim() || null
        : prev.stallArea,
    status:
      patch.status !== undefined && isStoreScheduleStatus(patch.status)
        ? patch.status
        : prev.status,
    eventId: patch.eventId !== undefined ? patch.eventId : prev.eventId,
    updatedAt: now,
  };
  schedules[idx] = next;
  return { ...next };
}

export function deleteMemoryStoreSchedule(id: string): boolean {
  const idx = schedules.findIndex((s) => s.id === id);
  if (idx < 0) return false;
  schedules.splice(idx, 1);
  return true;
}

/** デモ用シード（キッチンカー向け） */
export function seedDemoKitchenSchedules(storeId: string): void {
  if (schedules.some((s) => s.storeId === storeId)) return;

  const base = new Date();
  base.setHours(12, 0, 0, 0);
  const isoDaysFromNow = (days: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const samples: Array<
    StoreScheduleInput & { eventDate: string; eventName: string }
  > = [
    {
      eventDate: isoDaysFromNow(0),
      eventName: "週末マルシェ",
      location: "練馬駅北口広場",
      startTime: "11:00",
      endTime: "18:00",
      stallArea: "A区画",
      status: "scheduled",
    },
    {
      eventDate: isoDaysFromNow(7),
      eventName: "グリーンマルシェ",
      location: "代々木公園",
      startTime: "10:00",
      endTime: "17:00",
      stallArea: "A区画",
      status: "scheduled",
    },
    {
      eventDate: isoDaysFromNow(14),
      eventName: "手づくり市",
      location: "駅前広場",
      startTime: "11:00",
      endTime: "16:00",
      status: "scheduled",
    },
    {
      eventDate: isoDaysFromNow(21),
      eventName: "まちフェス",
      location: "中央広場",
      startTime: "10:00",
      endTime: "17:00",
      stallArea: "キッチンカーゾーン",
      status: "scheduled",
    },
    {
      eventDate: isoDaysFromNow(28),
      eventName: "海辺フードフェス",
      location: "臨海公園",
      startTime: "11:00",
      endTime: "16:00",
      status: "adjusting",
    },
  ];
  for (const s of samples) {
    createMemoryStoreSchedule(storeId, s);
  }
}
