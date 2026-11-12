import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { requireOrganizerFeature } from "@/lib/organizer/require-organizer-feature";
import {
  getPosPointsAvailability,
  lookupPosPointsHolder,
  POS_POINTS_UNAVAILABLE_MESSAGE,
} from "@/lib/points/pos-points";

async function organizerContext() {
  const user = await getApiUser();
  if (!user) return { error: NextResponse.json({ error: "ログインが必要です" }, { status: 401 }) };
  const supabase = await createClient();
  if (!supabase) return { error: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) };
  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) return { error: NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 }) };
  const planBlocked = await requireOrganizerFeature(supabase, organizerId, "pos");
  if (planBlocked) return { error: planBlocked };
  return { supabase, organizerId };
}

/** GET ?eventId=：このイベントのレジで、いまポイントを使えるか */
export async function GET(request: NextRequest) {
  const ctx = await organizerContext();
  if ("error" in ctx) return ctx.error;
  const eventId = request.nextUrl.searchParams.get("eventId");
  try {
    const availability = await getPosPointsAvailability(ctx.supabase, ctx.organizerId, eventId);
    return NextResponse.json(
      availability.enabled
        ? availability
        : { ...availability, message: POS_POINTS_UNAVAILABLE_MESSAGE[availability.reason] }
    );
  } catch (e) {
    console.error("pos points GET:", e);
    return NextResponse.json({ enabled: false, reason: "not_ready", message: "ポイントを確認できません" });
  }
}

/** POST { eventId, qr }：参加パスを読み取って、その人のこのイベントのポイントの残りを返す */
export async function POST(request: NextRequest) {
  const ctx = await organizerContext();
  if ("error" in ctx) return ctx.error;
  let body: { eventId?: unknown; qr?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストが不正です" }, { status: 400 });
  }
  const eventId = typeof body.eventId === "string" ? body.eventId : "";
  const qr = typeof body.qr === "string" ? body.qr.trim() : "";
  if (!eventId || !qr) {
    return NextResponse.json({ error: "参加パスを読み取ってください" }, { status: 400 });
  }
  const result = await lookupPosPointsHolder(ctx.supabase, ctx.organizerId, eventId, qr);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  // userId は画面に渡さない（会計のときはQRをもう一度サーバーで読み直す）
  const { name, receptionNumber, balance } = result.holder;
  return NextResponse.json({ name, receptionNumber, balance });
}
