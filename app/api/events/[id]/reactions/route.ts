import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  setEventReaction,
  removeEventReaction,
  getMyReaction,
  getEventReactionCounts,
} from "@/lib/db/event-reactions";
import { fetchPublishedEventById } from "@/lib/db/events";
import type { ReactionType } from "@/lib/db/event-reactions";

type Params = { params: Promise<{ id: string }> };

/** GET: 自分のリアクション + 件数（認証なしでも件数は返す） */
export async function GET(_request: Request, { params }: Params) {
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

  const [counts, user] = await Promise.all([
    getEventReactionCounts(supabase, eventId),
    getApiUser(),
  ]);

  let myReaction: ReactionType | null = null;
  if (user) {
    myReaction = await getMyReaction(supabase, eventId, user.id);
  }

  return NextResponse.json({
    planned: counts.planned,
    interested: counts.interested,
    myReaction,
  });
}

/** POST: 参加予定 / 気になる を設定。DELETE: 解除 */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "イベントIDが必要です" }, { status: 400 });
  }

  let body: { type?: string } = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "リクエストが不正です" }, { status: 400 });
  }

  const type = body.type as ReactionType | undefined;
  if (type !== "planned" && type !== "interested") {
    return NextResponse.json(
      { error: "type は planned または interested を指定してください" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }

  const event = await fetchPublishedEventById(supabase, eventId);
  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  try {
    await setEventReaction(supabase, eventId, user.id, type);
    const counts = await getEventReactionCounts(supabase, eventId);
    return NextResponse.json({
      success: true,
      myReaction: type,
      planned: counts.planned,
      interested: counts.interested,
    });
  } catch (e) {
    console.error("set reaction:", e);
    return NextResponse.json({ error: "設定に失敗しました" }, { status: 500 });
  }
}

/** DELETE: リアクション解除 */
export async function DELETE(_request: Request, { params }: Params) {
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

  try {
    await removeEventReaction(supabase, eventId, user.id);
    const counts = await getEventReactionCounts(supabase, eventId);
    return NextResponse.json({
      success: true,
      myReaction: null,
      planned: counts.planned,
      interested: counts.interested,
    });
  } catch (e) {
    console.error("remove reaction:", e);
    return NextResponse.json({ error: "解除に失敗しました" }, { status: 500 });
  }
}
