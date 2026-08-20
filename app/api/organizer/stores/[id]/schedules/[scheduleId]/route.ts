import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByStoreId } from "@/lib/db/stores";
import {
  deleteStoreSchedule,
  fetchStoreScheduleById,
  updateStoreSchedule,
} from "@/lib/db/store-schedules";
import { getMemoryStoreById } from "@/lib/stores/memory-store";
import {
  deleteMemoryStoreSchedule,
  getMemoryStoreScheduleById,
  updateMemoryStoreSchedule,
} from "@/lib/stores/memory-schedule";
import {
  isStoreScheduleStatus,
  normalizeStoreDateInput,
  type StoreScheduleInput,
} from "@/lib/stores/types";

type Ctx = { params: Promise<{ id: string; scheduleId: string }> };

async function assertOwner(storeId: string, userId: string) {
  const mem = getMemoryStoreById(storeId);
  if (mem) {
    if (mem.organizerId !== userId && mem.organizerId !== "dev-organizer") {
      return { ok: false as const, status: 404 as const };
    }
    return { ok: true as const, memory: true as const };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false as const, status: 404 as const };
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, userId);
  if (!organizerId) {
    return { ok: false as const, status: 403 as const, error: "主催者登録が必要です" };
  }

  const ownerId = await getOrganizerIdByStoreId(supabase, storeId);
  if (!ownerId || ownerId !== organizerId) {
    return { ok: false as const, status: 404 as const };
  }

  return { ok: true as const, memory: false as const, supabase };
}

function parsePatch(body: Record<string, unknown>): StoreScheduleInput {
  const patch: StoreScheduleInput = {};
  if (typeof body.eventName === "string") patch.eventName = body.eventName;
  if (body.eventDate !== undefined) {
    const d = normalizeStoreDateInput(body.eventDate);
    if (d) patch.eventDate = d;
  }
  if (body.location !== undefined) {
    patch.location = typeof body.location === "string" ? body.location : null;
  }
  if (body.startTime !== undefined) {
    patch.startTime =
      typeof body.startTime === "string" ? body.startTime : null;
  }
  if (body.endTime !== undefined) {
    patch.endTime = typeof body.endTime === "string" ? body.endTime : null;
  }
  if (body.stallArea !== undefined) {
    patch.stallArea =
      typeof body.stallArea === "string" ? body.stallArea : null;
  }
  if (isStoreScheduleStatus(body.status)) patch.status = body.status;
  if (body.eventId !== undefined) {
    patch.eventId = typeof body.eventId === "string" ? body.eventId : null;
  }
  return patch;
}

/** GET: 1件 */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: storeId, scheduleId } = await ctx.params;
  const gate = await assertOwner(storeId, user.id);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error ?? "見つかりません" },
      { status: gate.status },
    );
  }

  if (gate.memory) {
    const schedule = getMemoryStoreScheduleById(scheduleId);
    if (!schedule || schedule.storeId !== storeId) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    return NextResponse.json(schedule);
  }

  try {
    const schedule = await fetchStoreScheduleById(gate.supabase!, scheduleId);
    if (!schedule || schedule.storeId !== storeId) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    return NextResponse.json(schedule);
  } catch (e) {
    console.error("store schedule GET:", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

/** PATCH: 更新 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: storeId, scheduleId } = await ctx.params;
  const gate = await assertOwner(storeId, user.id);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error ?? "見つかりません" },
      { status: gate.status },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 },
    );
  }

  const patch = parsePatch(body);

  if (gate.memory) {
    const existing = getMemoryStoreScheduleById(scheduleId);
    if (!existing || existing.storeId !== storeId) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    try {
      const updated = updateMemoryStoreSchedule(scheduleId, patch);
      return NextResponse.json(updated);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "更新に失敗しました" },
        { status: 400 },
      );
    }
  }

  try {
    const existing = await fetchStoreScheduleById(gate.supabase!, scheduleId);
    if (!existing || existing.storeId !== storeId) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    const updated = await updateStoreSchedule(gate.supabase!, scheduleId, patch);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("store schedule PATCH:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "更新に失敗しました" },
      { status: 500 },
    );
  }
}

/** DELETE */
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: storeId, scheduleId } = await ctx.params;
  const gate = await assertOwner(storeId, user.id);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error ?? "見つかりません" },
      { status: gate.status },
    );
  }

  if (gate.memory) {
    const existing = getMemoryStoreScheduleById(scheduleId);
    if (!existing || existing.storeId !== storeId) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    deleteMemoryStoreSchedule(scheduleId);
    return NextResponse.json({ ok: true });
  }

  try {
    const existing = await fetchStoreScheduleById(gate.supabase!, scheduleId);
    if (!existing || existing.storeId !== storeId) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    await deleteStoreSchedule(gate.supabase!, scheduleId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("store schedule DELETE:", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
