import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import {
  getOrganizerIdByStoreId,
  fetchStoreById,
} from "@/lib/db/stores";
import {
  createStoreSchedule,
  listStoreSchedules,
} from "@/lib/db/store-schedules";
import { getMemoryStoreById } from "@/lib/stores/memory-store";
import {
  createMemoryStoreSchedule,
  listMemoryStoreSchedules,
} from "@/lib/stores/memory-schedule";
import {
  isStoreScheduleStatus,
  normalizeStoreDateInput,
  type StoreScheduleInput,
} from "@/lib/stores/types";

type Ctx = { params: Promise<{ id: string }> };

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

function parseScheduleBody(body: Record<string, unknown>): {
  input?: StoreScheduleInput & { eventDate: string; eventName: string };
  error?: string;
} {
  const eventName =
    typeof body.eventName === "string" ? body.eventName.trim() : "";
  if (!eventName) return { error: "イベント／場所名は必須です" };

  const eventDate = normalizeStoreDateInput(body.eventDate);
  if (!eventDate) return { error: "出店日を入力してください" };

  const status = isStoreScheduleStatus(body.status) ? body.status : "scheduled";

  return {
    input: {
      eventDate,
      eventName,
      location: typeof body.location === "string" ? body.location : null,
      startTime: typeof body.startTime === "string" ? body.startTime : null,
      endTime: typeof body.endTime === "string" ? body.endTime : null,
      stallArea: typeof body.stallArea === "string" ? body.stallArea : null,
      status,
      eventId: typeof body.eventId === "string" ? body.eventId : null,
    },
  };
}

/** GET: 出店スケジュール一覧 */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: storeId } = await ctx.params;
  const gate = await assertOwner(storeId, user.id);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error ?? "見つかりません" },
      { status: gate.status },
    );
  }

  if (gate.memory) {
    return NextResponse.json({
      schedules: listMemoryStoreSchedules(storeId),
    });
  }

  try {
    const schedules = await listStoreSchedules(gate.supabase!, storeId);
    return NextResponse.json({ schedules });
  } catch (e) {
    console.error("store schedules GET:", e);
    return NextResponse.json({
      schedules: listMemoryStoreSchedules(storeId),
    });
  }
}

/** POST: 出店スケジュール追加 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: storeId } = await ctx.params;
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

  const parsed = parseScheduleBody(body);
  if (!parsed.input) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (gate.memory) {
    const store = getMemoryStoreById(storeId);
    if (store && store.kind !== "kitchen_car") {
      return NextResponse.json(
        { error: "出店スケジュールはキッチンカーのみ利用できます" },
        { status: 400 },
      );
    }
    try {
      const schedule = createMemoryStoreSchedule(storeId, parsed.input);
      return NextResponse.json(schedule, { status: 201 });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "作成に失敗しました" },
        { status: 400 },
      );
    }
  }

  try {
    const store = await fetchStoreById(gate.supabase!, storeId);
    if (store && store.kind !== "kitchen_car") {
      return NextResponse.json(
        { error: "出店スケジュールはキッチンカーのみ利用できます" },
        { status: 400 },
      );
    }
    const schedule = await createStoreSchedule(
      gate.supabase!,
      storeId,
      parsed.input,
    );
    return NextResponse.json(schedule, { status: 201 });
  } catch (e) {
    console.error("store schedules POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "作成に失敗しました" },
      { status: 500 },
    );
  }
}
