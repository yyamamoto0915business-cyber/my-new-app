import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchPublishedEventById,
  joinEvent,
  getParticipantStatus,
} from "@/lib/db/events";

type Params = { params: Promise<{ id: string }> };

/** GET: 申込済みかどうか */
export async function GET(_request: Request, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ applied: false });
  }

  const { id: eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "イベントIDが必要です" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ applied: false });
  }

  const status = await getParticipantStatus(supabase, eventId, user.id);
  return NextResponse.json({ applied: !!status });
}

/** POST: イベントに申し込む（申込必須イベント用） */
export async function POST(_request: Request, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "イベントIDが必要です" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }

  const event = await fetchPublishedEventById(supabase, eventId);
  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  const participationMode =
    (event as { participationMode?: string; requiresRegistration?: boolean })
      .participationMode ?? (event.requiresRegistration ? "required" : "none");
  if (participationMode !== "required") {
    return NextResponse.json(
      { error: "このイベントは申込制ではありません" },
      { status: 400 }
    );
  }

  const existing = await getParticipantStatus(supabase, eventId, user.id);
  if (existing) {
    return NextResponse.json(
      { error: "すでに申し込み済みです", status: existing },
      { status: 400 }
    );
  }

  try {
    await joinEvent(supabase, eventId, user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("join event:", e);
    return NextResponse.json({ error: "申し込みに失敗しました" }, { status: 500 });
  }
}
