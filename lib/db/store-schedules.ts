/**
 * 出店スケジュール（キッチンカー）の DB 操作
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isStoreScheduleStatus,
  normalizeStoreDateInput,
  normalizeTimeInput,
  type StoreScheduleInput,
  type StoreScheduleRecord,
  type StoreScheduleStatus,
} from "@/lib/stores/types";

function mapRow(r: Record<string, unknown>): StoreScheduleRecord {
  const status = isStoreScheduleStatus(r.status) ? r.status : "scheduled";
  const eventDateRaw = r.event_date;
  const eventDate =
    typeof eventDateRaw === "string"
      ? eventDateRaw.slice(0, 10)
      : String(eventDateRaw ?? "").slice(0, 10);

  return {
    id: String(r.id),
    storeId: String(r.store_id),
    eventDate,
    eventName: String(r.event_name ?? ""),
    location: (r.location as string | null) ?? null,
    startTime: (r.start_time as string | null) ?? null,
    endTime: (r.end_time as string | null) ?? null,
    stallArea: (r.stall_area as string | null) ?? null,
    status,
    eventId: (r.event_id as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function listStoreSchedules(
  supabase: SupabaseClient,
  storeId: string,
): Promise<StoreScheduleRecord[]> {
  const { data, error } = await supabase
    .from("store_schedules")
    .select("*")
    .eq("store_id", storeId)
    .order("event_date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function fetchStoreScheduleById(
  supabase: SupabaseClient,
  id: string,
): Promise<StoreScheduleRecord | null> {
  const { data, error } = await supabase
    .from("store_schedules")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function createStoreSchedule(
  supabase: SupabaseClient,
  storeId: string,
  input: StoreScheduleInput & { eventDate: string; eventName: string },
): Promise<StoreScheduleRecord> {
  const eventDate = normalizeStoreDateInput(input.eventDate);
  if (!eventDate) throw new Error("出店日が不正です");

  const status: StoreScheduleStatus = input.status ?? "scheduled";
  const row = {
    store_id: storeId,
    event_date: eventDate,
    event_name: input.eventName.trim(),
    location: input.location?.trim() || null,
    start_time:
      normalizeTimeInput(input.startTime) ?? (input.startTime?.trim() || null),
    end_time:
      normalizeTimeInput(input.endTime) ?? (input.endTime?.trim() || null),
    stall_area: input.stallArea?.trim() || null,
    status,
    event_id: input.eventId ?? null,
  };

  const { data, error } = await supabase
    .from("store_schedules")
    .insert(row)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function updateStoreSchedule(
  supabase: SupabaseClient,
  id: string,
  patch: StoreScheduleInput,
): Promise<StoreScheduleRecord | null> {
  const existing = await fetchStoreScheduleById(supabase, id);
  if (!existing) return null;

  const updates: Record<string, unknown> = {};

  if (patch.eventDate !== undefined) {
    const d = normalizeStoreDateInput(patch.eventDate);
    if (!d) throw new Error("出店日が不正です");
    updates.event_date = d;
  }
  if (patch.eventName !== undefined) {
    updates.event_name = patch.eventName.trim() || existing.eventName;
  }
  if (patch.location !== undefined) {
    updates.location = patch.location?.trim() || null;
  }
  if (patch.startTime !== undefined) {
    updates.start_time =
      normalizeTimeInput(patch.startTime) ?? (patch.startTime?.trim() || null);
  }
  if (patch.endTime !== undefined) {
    updates.end_time =
      normalizeTimeInput(patch.endTime) ?? (patch.endTime?.trim() || null);
  }
  if (patch.stallArea !== undefined) {
    updates.stall_area = patch.stallArea?.trim() || null;
  }
  if (patch.status !== undefined && isStoreScheduleStatus(patch.status)) {
    updates.status = patch.status;
  }
  if (patch.eventId !== undefined) {
    updates.event_id = patch.eventId;
  }

  if (Object.keys(updates).length === 0) return existing;

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("store_schedules")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function deleteStoreSchedule(
  supabase: SupabaseClient,
  id: string,
): Promise<boolean> {
  const { error } = await supabase.from("store_schedules").delete().eq("id", id);
  if (error) throw error;
  return true;
}
